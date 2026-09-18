DEMO_PROMPTS = [
    {
        "id": "scenario_1",
        "title": "1. Conveyor Health & Motor Faults",
        "prompt": "Show conveyor health and motor faults",
        "description": "Dynamic HMI generation showing Motor 1 status, speed trend, and graphics."
    },
    {
        "id": "scenario_2",
        "title": "2. Process Temp, Pressure & Alarms",
        "prompt": "Show temperature, pressure and active alarms",
        "description": "Monitors live process variables and displays alarms when temperature exceeds 90 °C."
    },
    {
        "id": "scenario_3",
        "title": "3. Unsafe Command Rejection (Safety Gate)",
        "prompt": "Add a Start button using Temperature_PV",
        "description": "Demonstrates safety gate validator rejecting read-only monitor tag bound to command button."
    },
    {
        "id": "scenario_4",
        "title": "4. Machine Change Adaptation",
        "prompt": "Show me the health of the whole machine",
        "description": "Generates HMI incorporating newly added Motor 2 asset dynamically."
    }
]
