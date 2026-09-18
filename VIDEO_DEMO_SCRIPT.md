# 🎬 Video Presentation Script: Screenless HMI for Industrial Automation (Context2HMI)

> **Total Estimated Duration**: ~4 to 5 minutes  
> **Key Message**: *"The screen is a verified query on the machine, not a static file you maintain."*

---

## 📋 Video Overview & Section Timeline

| Section | Screen View / Visual Action | Topic & Key Points |
| :--- | :--- | :--- |
| **0:00 - 0:30** | Title Slide / Main SCADA Dashboard | **Introduction & The Problem** (Manual HMI Engineering bottleneck) |
| **0:30 - 1:00** | Architectural Diagram & Motto | **Architecture & 11-Rule Deterministic Safety Gate** |
| **1:00 - 1:50** | SCADA HMI Process Visualizer | **ISA-95 Plant Schematic, Mechanical Counters & Animated Piping** |
| **1:50 - 2:30** | ISA-95 Tree Navigation & Modal | **Asset Hierarchy & Focus View Modal with Direct PLC Controls** |
| **2:30 - 3:30** | AI Assistant Drawer | **Natural Language Machine Telemetry & Multi-Motor Control** |
| **3:30 - 4:15** | Safety Rejection & Motor 2 Addition | **Deterministic Safety Gate Violation & Machine Delta Adaptation** |
| **4:15 - 4:45** | Main Dashboard Overview | **Summary & Next-Gen Industrial Automation Vision** |

---

## 🎙️ Detailed Step-by-Step Voiceover Script & Screen Guide

---

### 🟢 SECTION 1: Introduction & The Problem (0:00 - 0:30)

**Visual On-Screen**:
Show the full **Context2HMI Dashboard** with animated cyan and emerald fluid lines flowing across the SCADA schematic.

**Voiceover Script**:
> *"Welcome! Today we are presenting **Context2HMI — The Screenless HMI for Industrial Automation**.*  
>
> *In traditional manufacturing, building HMI screens requires hundreds of hours of manual graphic design, static tag linking, and costly re-engineering whenever a machine or line changes.*  
>
> *Our core philosophy shifts this paradigm entirely: **'The screen is a verified query on the machine, not a static file you maintain.'**"*

---

### 🟢 SECTION 2: Architecture & Deterministic Safety Gate (0:30 - 1:00)

**Visual On-Screen**:
Show the Architecture Flowchart or zoom into the **"AI PROPOSES. DETERMINISTIC VALIDATOR DECIDES."** header banner.

**Voiceover Script**:
> *"Before rendering any visual layout or sending a control command, Context2HMI passes every request through a **Machine Context Graph** built directly from engineering artifacts like `tags.json`, `io.json`, and `asset_hierarchy.json`.*  
>
> *Here is the critical rule: **The AI LLM NEVER directly controls a machine and NEVER writes executable UI code.** The AI proposes an HMI specification in JSON, but our **11-Rule Deterministic Safety Engine** evaluates every single tag binding.*  
>
> *If a rule is violated—for example, trying to attach a Start button to a read-only temperature sensor—the system instantly blocks execution and renders a safety rejection banner."*

---

### 🟢 SECTION 3: Main SCADA HMI Visualizer & Animated Piping (1:00 - 1:50)

**Visual On-Screen**:
Pan smoothly across the **5 Process Panels** on the main dashboard screen:
1. **Panel 1 (Top Left)**: Primary Water Vessel Tank 101, 7-8 Toplama Motor, 7-digit Totalizer Counter, and Solenoid Valve `1-8 Açık`.
2. **Panel 2 (Top Middle)**: Heavy Main Pump Motor with revolving impeller, `1-6 Sayaç` needle gauge, and SSR Indicators.
3. **Panel 3 (Top Right)**: Conveyor Belt A with rolling DZN indicators, live speed readout (`24.4 m/s`), and Motor 1 / Motor 2 VFD badges.
4. **Panel 4 (Bottom Left)**: Dual Buffer Tanks (Red 350.0 Cm & Blue 347.6 Cm), Feed Pump, Sand Filter (`Kum Filtresi`), and Mode Selectors (`Otomatik`/`Direkt`/`Manuel`).
5. **Panel 5 (Bottom Right)**: Secondary Main Reservoirs (`Derenin Karşısı`), Tank 1 Level, Totalizer, and Main Distribution Pump.

**Voiceover Script**:
> *"Let's take a look at the live **SCADA HMI Process Visualizer**.*  
>
> *The entire schematic is rendered using scalable high-tech SVG vector graphics with 3D metallic pipe casings and real-time animated neon fluid streams.*  
>
> *Notice how sleek the piping layout is—cyan streams indicate active water feed lines, while emerald green represents treated buffer recirculation. Every digit, rolling mechanical counter, and telemetry value remains 100% crisp and readable without visual clutter."*

---

### 🟢 SECTION 4: ISA-95 Tree Navigation & Asset Focus View (1:50 - 2:30)

**Visual On-Screen**:
1. Mouse clicks on **`Feed Pump 101`** in the left **ISA-95 Hierarchy Tree**.
2. Show the **Asset Focus View Modal** popping up cleanly with real-time temperature/pressure line charts, setpoint controls, and START/STOP buttons.

**Voiceover Script**:
> *"Navigating complex industrial plants is effortless thanks to our **ISA-95 Unified Asset Hierarchy** on the left.*  
>
> *Clicking on any asset—like **Feed Pump 101**—instantly launches a dedicated **Asset Focus View**.*  
>
> *Operators get an immediate, un-cluttered deep dive into device-specific telemetry, real-time trend graphs, setpoint adjustments, and direct PLC command buttons. Closing the modal returns us straight to the overview schematic."*

---

### 🟢 SECTION 5: AI Assistant — Natural Language Machine Telemetry & Control (2:30 - 3:30)

**Visual On-Screen**:
1. Click the **AI Assistant** button to expand the slide-out AI Command Drawer.
2. Type or speak: *"What is the speed of the conveyor belt?"*
3. Show the AI drawer output: `Conveyor Speed (PV): 24.4 m/s, Setpoint: 25 m/s, VFD Frequency: 48.8 Hz`.
4. Type or speak: *"Stop all motors"*.
5. Show the AI response: `🛑 Executing command: STOP MOTOR 1 & MOTOR 2`.
6. Highlight that the SCADA schematic animation immediately stops, conveyor speed drops to `0.0 m/s`, and motor beacons switch to STOPPED (`Red/Orange`).

**Voiceover Script**:
> *"Now, let's explore the power of our **Context-Aware AI Assistant**.*  
>
> *An operator doesn't need to hunt through navigation menus. They can ask natural language questions like: **'What is the speed of the conveyor belt?'***  
>
> *The AI agent resolves the question against the Machine Context Graph and returns exact real-time telemetry: Conveyor speed 24.4 m/s, VFD frequency 48.8 Hz.*  
>
> *Next, let's issue an operational command: **'Stop all motors.'***  
>
> *Watch what happens: The AI understands the multi-asset context, validates the command, executes the PLC shutdown, and the SCADA diagram updates immediately—stopping the belt motion and motor rotation live."*

---

### 🟢 SECTION 6: Deterministic Safety Violation & Dynamic Delta Adaptation (3:30 - 4:15)

**Visual On-Screen**:
1. Type an unsafe prompt: *"Add a Start button using Temperature_PV"*.
2. Show the **Red Rejection Banner**: `REJECTED BY SAFETY ENGINE — Rule 4: Read-only tag Temperature_PV cannot be bound to writable control 'command_button'`.
3. Click the **"+ ADD MOTOR 2"** button on the top toolbar.
4. Show how the Machine Context Graph regenerates and the SCADA diagram automatically adapts to include Motor 2 without manual screen re-design.

**Voiceover Script**:
> *"To prove safety is never compromised, let's attempt an unsafe operation: **'Add a Start button using Temperature_PV.'**  
>
> *Notice the red banner: The Deterministic Safety Engine catches Rule 4 violation and blocks the unsafe binding before it ever touches the screen.*  
>
> *Furthermore, if new equipment is added to the plant floor—such as clicking **'+ ADD MOTOR 2'**—the system dynamically updates its Machine Context Graph and instantly compiles the new hardware into the live SCADA visualizer!"*

---

### 🟢 SECTION 7: Conclusion & Summary (4:15 - 4:45)

**Visual On-Screen**:
Return to the full, active SCADA HMI dashboard with synchronized WebSockets and green system status indicator.

**Voiceover Script**:
> *"To summarize: **Context2HMI** delivers:
> 1. Zero static screen engineering.
> 2. 100% deterministic safety guarantees.
> 3. ISA-95 compliant machine graph model.
> 4. Instant natural language machine intelligence.
>
> Thank you for watching our prototype demonstration!"*

---

## 💡 Pro Tips for Recording the Demo Video

1. **Screen Resolution**: Set display to **1920x1080 (1080p)** for crystal clear text rendering.
2. **Audio**: Use a clear microphone with background noise suppression.
3. **Pacing**: Move your mouse pointer deliberately to highlight buttons, rolling counters, and piping paths as you mention them in the script.
4. **Lighting**: Ensure dark mode colors look vibrant on screen.
