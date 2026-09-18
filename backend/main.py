import os
import asyncio
from typing import Dict, Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from models import PromptRequestModel, MachineChangeModel, HmiDslModel
from context_graph import MachineContextGraph
from resolver import EntityResolver
from validator import HmiValidator
from composer import ScreenComposer
from simulator import MachineSimulator
from websocket_manager import ConnectionManager
from demo_scenarios import DEMO_PROMPTS

# Initialize App
app = FastAPI(
    title="SCREENLESS-HMI Backend API",
    description="Dynamic Screen at Runtime for Visualization & Control of Machine via HMI",
    version="1.0.0"
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core Instances
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
context_graph = MachineContextGraph(DATA_DIR)
resolver = EntityResolver(context_graph)
validator = HmiValidator(context_graph)
composer = ScreenComposer(context_graph)
simulator = MachineSimulator()
ws_manager = ConnectionManager()

# Background simulator loop
async def simulator_background_task():
    while True:
        try:
            simulator.update_cycle()
            snapshot = simulator.get_snapshot()
            await ws_manager.broadcast({
                "type": "LIVE_UPDATE",
                "data": snapshot
            })
        except Exception as e:
            print(f"[Simulator Loop Error] {e}")
        await asyncio.sleep(1.5)

@app.on_event("startup")
async def startup_event():
    print("[SCREENLESS-HMI] Initializing Machine Context Graph...")
    context_graph.load_and_build()
    print(f"[SCREENLESS-HMI] Loaded {len(context_graph.tags)} tags, {len(context_graph.assets)} assets.")
    asyncio.create_task(simulator_background_task())

@app.get("/health")
def health_check():
    return {
        "status": "online",
        "system": "SCREENLESS-HMI",
        "machine": "Packaging Line 1",
        "nodes": context_graph.graph.number_of_nodes(),
        "edges": context_graph.graph.number_of_edges(),
        "ai_provider": "Gemini LLM" if composer.api_key else "Local Deterministic Composer (Demo Mode)"
    }

@app.get("/context")
def get_full_context():
    """Return complete Machine Context Graph data."""
    return context_graph.get_context_export()

@app.get("/context/summary")
def get_context_summary():
    """Return human-readable summary of machine context."""
    return context_graph.get_context_summary()

@app.get("/live")
def get_live_state():
    """Return snapshot of current live machine state."""
    return simulator.get_snapshot()

@app.get("/scenarios")
def get_demo_scenarios():
    return DEMO_PROMPTS

@app.post("/prompt")
def process_operator_prompt(req: PromptRequestModel):
    """
    Main SCREENLESS-HMI Pipeline:
    1. Deterministic Entity Resolution against Machine Context Graph
    2. AI Screen Planner proposes HMI DSL
    3. Deterministic Safety Gate Validator inspects proposed DSL
    4. Returns approved or rejected HMI DSL
    """
    prompt = req.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")

    # Step 1: Entity Resolution
    resolution = resolver.resolve(prompt)

    # Build rich metadata for CONTEXT USED BY AI panel
    tags_meta = [context_graph.tags[t].model_dump() for t in resolution.resolved_tags if t in context_graph.tags]
    assets_meta = [context_graph.assets[a] for a in resolution.resolved_assets if a in context_graph.assets]
    alarms_meta = [context_graph.alarms[a].model_dump() for a in resolution.resolved_alarms if a in context_graph.alarms]
    io_meta = [context_graph.io[i].model_dump() for i in resolution.resolved_io if i in context_graph.io]

    comms_meta = []
    for c_id, comm in context_graph.comms.items():
        if any(a in resolution.resolved_assets for a in comm.linked_assets):
            comms_meta.append(comm.model_dump())
    if not comms_meta and context_graph.comms:
        # Fallback to PLC1 if no linked comm matched
        comms_meta = [list(context_graph.comms.values())[0].model_dump()]

    # Step 2: AI Proposal
    proposed_dsl_dict = composer.compose(
        prompt=prompt,
        live_state=simulator.get_snapshot()["values"],
        resolved=resolution
    )

    # Step 3: Safety Validation
    validation_res = validator.validate(proposed_dsl_dict)

    return {
        "prompt": prompt,
        "resolved_context": {
            "resolved_assets": resolution.resolved_assets,
            "resolved_tags": resolution.resolved_tags,
            "resolved_alarms": resolution.resolved_alarms,
            "resolved_io": resolution.resolved_io,
            "assets": resolution.resolved_assets,
            "tags": resolution.resolved_tags,
            "alarms": resolution.resolved_alarms,
            "io": resolution.resolved_io,
            "assets_meta": assets_meta,
            "tags_meta": tags_meta,
            "alarms_meta": alarms_meta,
            "io_meta": io_meta,
            "comms_meta": comms_meta,
            "source_counts": {
                "tags": len(context_graph.tags),
                "io": len(context_graph.io),
                "alarms": len(context_graph.alarms),
                "assets": len(context_graph.assets),
                "comms": len(context_graph.comms),
                "docs": len(context_graph.docs)
            }
        },
        "proposed_dsl": proposed_dsl_dict,
        "validation": validation_res.model_dump(),
        "status": validation_res.status,
        "ai_provider": "Gemini LLM" if composer.api_key else "Deterministic Local Fallback"
    }

@app.post("/validate")
def validate_custom_dsl(dsl: Dict[str, Any]):
    """Directly validate any proposed HMI DSL JSON spec."""
    res = validator.validate(dsl)
    return res.model_dump()

@app.post("/command")
def execute_command(cmd: Dict[str, Any]):
    """Execute valid command against machine state after checking safety tag permissions."""
    tag = cmd.get("tag")
    val = cmd.get("value", True)
    if not tag:
        raise HTTPException(status_code=400, detail="Tag name is required")
    
    tag_alias_map = {
        "Feed_Pump_101_Stop": "Pump_101_Stop",
        "Feed_Pump_101_Start": "Pump_101_Start",
        "Start_Motor_1": "Motor_1_Start",
        "Stop_Motor_1": "Motor_1_Stop",
        "Start_Motor_2": "Motor_2_Start",
        "Stop_Motor_2": "Motor_2_Stop",
        "Start_Pump_101": "Pump_101_Start",
        "Stop_Pump_101": "Pump_101_Stop"
    }
    actual_tag = tag_alias_map.get(tag, tag)

    tag_meta = context_graph.tags.get(actual_tag)
    if not tag_meta:
        raise HTTPException(status_code=404, detail=f"Tag {actual_tag} (raw: {tag}) not found in Machine Context Graph")
    if not tag_meta.writable or tag_meta.safety_type == "monitor":
        raise HTTPException(status_code=403, detail=f"Tag {actual_tag} is safety_type=monitor (read-only) and cannot execute commands")
    
    simulator.apply_command(actual_tag, val)
    return {"status": "success", "message": f"Command executed on {actual_tag}", "tag": actual_tag, "val": val}

@app.post("/machine/change")
def apply_machine_change(req: MachineChangeModel):
    """
    Simulate dynamic machine modification (e.g. adding Motor 2).
    Updates context graph dynamically.
    """
    if req.action in ["add_motor_2", "add_motor2"]:
        context_graph.add_motor_2()
        return {
            "status": "success",
            "message": "Machine Context Graph updated: Motor 2 added with associated tags and alarm.",
            "summary": context_graph.get_context_summary()
        }
    else:
        raise HTTPException(status_code=400, detail=f"Unknown machine change action: {req.action}")

from pydantic import BaseModel, Field

class AiAssistantQueryRequest(BaseModel):
    query: str
    live_state: Optional[Dict[str, Any]] = None

@app.post("/trigger_spike")
def trigger_temperature_spike():
    simulator.trigger_temp_spike()
    return {"status": "ok", "message": "Temperature spike triggered (>90 °C)."}

@app.post("/api/ai-assistant-query")
def process_ai_assistant_query(req: AiAssistantQueryRequest):
    """
    Conversational AI Assistant Endpoint:
    Uses Gemini LLM API when GEMINI_API_KEY is configured, or dynamic machine context fallback.
    """
    q = req.query.strip()
    if not q:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    current_state = req.live_state or simulator.get_snapshot()["values"]
    q_lower = q.lower()

    # 1. Check Gemini LLM API if key is available
    if composer.api_key and os.environ.get("DEMO_AI_MODE", "").lower() != "true":
        try:
            prompt_text = f"""
            You are the Schneider Electric WinCC PLC AI Assistant.
            Operator Query: "{q}"
            Current Machine Telemetry State: {json.dumps(current_state)}
            Machine Assets: {json.dumps(list(context_graph.assets.keys()))}
            Machine Tags: {json.dumps([t.id for t in context_graph.tags.values()])}

            Provide a concise, direct, professional SCADA operator answer with emojis and exact numerical values.
            - If the operator commands "stop all motors" or "stop motors", confirm that Motor 1, Motor 2, and Feed Pump 101 outputs are set to OFF (Motor_1_RunStatus = false, Motor_2_RunStatus = false, Pump_101_RunStatus = false) and all SCADA animations have stopped.
            - If the operator asks about "fluid flow speed" or "pipe flow", refer to Feed Pump 101 Fluid Flow Rate (142.5 L/min / 1.8 m/s fluid velocity).
            - If the operator asks about "conveyor speed" or "motor 1 speed", refer to Conveyor Belt Speed (e.g. {current_state.get('Conveyor_Speed_PV', 24.5)} m/s).
            - If the operator asks about "motor 2 speed" or "motor 2", refer to Motor 2 Speed (e.g. {current_state.get('Motor_2_Speed_PV', 18.5)} m/s) and VFD Frequency.
            Respond in clean plain text with bullet points where appropriate.
            """
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={composer.api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt_text}]}],
                "generationConfig": {"temperature": 0.2}
            }
            res = httpx.post(url, json=payload, timeout=8.0)
            if res.status_code == 200:
                res_json = res.json()
                reply_text = res_json["candidates"][0]["content"]["parts"][0]["text"]
                return {
                    "text": reply_text,
                    "badge": "GEMINI LLM ONLINE",
                    "ai_provider": "Gemini 2.5 Flash"
                }
        except Exception as e:
            print(f"[AI Assistant Route] Gemini fallback: {e}")

    # 2. Dynamic Machine Context Fallback Engine (Disambiguated Intent Engine)
    m1_running = bool(current_state.get("Motor_1_RunStatus", True))
    m2_running = bool(current_state.get("Motor_2_RunStatus", True))
    pump_running = bool(current_state.get("Pump_101_RunStatus", True))
    speed_pv = current_state.get("Conveyor_Speed_PV", 24.5)
    temp_pv = current_state.get("Temperature_PV", 72.0)
    tank_level = current_state.get("Tank_101_Level", 79.5)

    # Disambiguation: Motor 2 Speed & Telemetry
    if "motor 2" in q_lower or "motor2" in q_lower:
        m2_speed = current_state.get("Motor_2_Speed_PV", 18.5) if m2_running else 0.0
        m2_sp = current_state.get("Motor_2_Speed_SP", 20.0)
        m2_freq = (m2_speed * 2.0) if m2_running else 0.0
        reply = (
            f"⚙️ **Motor 2 (Auxiliary Line) Speed & Telemetry**:\n"
            f"• Motor 2 Speed (PV): **{m2_speed:.1f} m/s**\n"
            f"• Operating Status: **{'🟢 RUNNING' if m2_running else '🔴 STOPPED'}**\n"
            f"• Speed Setpoint (SP): **{m2_sp:.1f} m/s**\n"
            f"• VFD Frequency: **{m2_freq:.1f} Hz**\n"
            f"• Asset Binding: **Motor 2 & Secondary Conveyor B**"
        )
        return {"text": reply, "badge": "MOTOR 2 SPEED READ", "ai_provider": "Context Engine"}

    # Disambiguation: Pipe Fluid Flow Speed vs Conveyor Belt Speed
    elif any(k in q_lower for k in ["pipe", "fluid", "liquid", "flow of pipe", "flow speed", "fluid speed", "water flow"]):
        flow_rate = 142.5 if pump_running else 0.0
        fluid_vel = 1.8 if pump_running else 0.0
        reply = (
            f"🌊 **Pipe Fluid Flow Rate & Velocity Telemetry**:\n"
            f"• Fluid Flow Velocity: **{fluid_vel} m/s**\n"
            f"• Volumetric Flow Rate: **{flow_rate} L/min** (Discharge Pressure: {3.8 if pump_running else 0.0} Bar)\n"
            f"• Source Conduit: **Tank 101 Discharge Pipe $\\rightarrow$ Feed Pump 101**\n"
            f"• Flow Status: **{'🟢 ACTIVE LIQUID FLOW (PUMPING)' if pump_running else '🔴 NO FLOW (FEED PUMP STOPPED)'}**"
        )
        return {"text": reply, "badge": "FLUID FLOW TELEMETRY", "ai_provider": "Context Engine"}

    elif any(k in q_lower for k in ["conveyor", "belt", "motor speed", "vfd"]):
        reply = (
            f"⚙️ **Motor 1 & Conveyor Belt Speed Telemetry**:\n"
            f"• Conveyor Speed (PV): **{speed_pv:.1f} m/s**\n"
            f"• Motor Status: **{'🟢 RUNNING' if m1_running else '🔴 STOPPED'}**\n"
            f"• Target Setpoint (SP): **{current_state.get('Conveyor_Speed_SP', 25.0)} m/s**\n"
            f"• VFD Frequency: **{(speed_pv * 2.0):.1f} Hz**"
        )
        return {"text": reply, "badge": "CONVEYOR SPEED READ", "ai_provider": "Context Engine"}

    elif "tank 101" in q_lower or "tank level" in q_lower or ("tank" in q_lower and "level" in q_lower):
        vol_m3 = (tank_level / 100.0) * 339.0
        reply = (
            f"💧 **Tank 101 Live Telemetry Readout**:\n"
            f"• Current Level: **{tank_level:.1f}%**\n"
            f"• Liquid Volume: **{vol_m3:.1f} M³** (Capacity: 339.0 M³)\n"
            f"• Inlet Valve 1-8: **OPEN (ACTIVE FLOW)**\n"
            f"• Operating Envelope: **NORMAL**"
        )
        return {"text": reply, "badge": "TANK 101 READ", "ai_provider": "Context Engine"}

    elif "temp" in q_lower or "heat" in q_lower:
        reply = (
            f"🌡️ **Process Line Temperature Telemetry**:\n"
            f"• Current Sensor Temp (PV): **{temp_pv:.1f} °C**\n"
            f"• Safety Threshold: **90.0 °C**\n"
            f"• Thermal Status: **{'🚨 HIGH TEMP ALARM' if temp_pv > 90.0 else '🟢 NORMAL'}**"
        )
        return {"text": reply, "badge": "TEMPERATURE READ", "ai_provider": "Context Engine"}

    # Default fallback summary
    vol_m3 = (tank_level / 100.0) * 339.0
    reply = (
        f"🤖 **WinCC PLC AI Telemetry Summary**:\n"
        f"Regarding \"{q}\":\n"
        f"• Pipe Fluid Velocity: **{1.8 if pump_running else 0.0} m/s** ({142.5 if pump_running else 0.0} L/min)\n"
        f"• Conveyor Belt Speed: **{speed_pv:.1f} m/s** ({'🟢 RUNNING' if m1_running else '🔴 STOPPED'})\n"
        f"• Tank 101 Level: **{tank_level:.1f}%** ({vol_m3:.1f} M³)\n"
        f"• Line Temp: **{temp_pv:.1f} °C**"
    )
    return {"text": reply, "badge": "TELEMETRY READ", "ai_provider": "Context Engine"}

@app.websocket("/ws/live")
async def websocket_live_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        # Send initial snapshot immediately upon connection
        await websocket.send_json({
            "type": "INITIAL_STATE",
            "data": simulator.get_snapshot()
        })
        while True:
            # Keep connection alive & listen for client messages if any
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)
