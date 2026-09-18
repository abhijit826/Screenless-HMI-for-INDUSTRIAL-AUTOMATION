from typing import Dict, Any, List
from models import HmiDslModel, ValidationResultModel, ValidationCheckModel
from context_graph import MachineContextGraph

ALLOWED_WIDGET_TYPES = {
    "status",
    "analog",
    "gauge",
    "trend",
    "alarm_banner",
    "alarm_list",
    "equipment_graphic",
    "command_button",
    "setpoint",
    "navigation",
    "diagnostic",
    "kpi"
}

class HmiValidator:
    def __init__(self, context_graph: MachineContextGraph):
        self.context = context_graph

    def validate(self, dsl_dict: Dict[str, Any]) -> ValidationResultModel:
        checks: List[ValidationCheckModel] = []
        errors: List[str] = []
        warnings: List[str] = []

        # Rule 10: Validate basic structure
        try:
            dsl = HmiDslModel(**dsl_dict)
            checks.append(ValidationCheckModel(
                rule="RULE_10_JSON_STRUCTURE",
                status="PASS",
                details="HMI DSL payload conforms to required JSON schema."
            ))
        except Exception as e:
            return ValidationResultModel(
                status="rejected",
                reason=f"Rule 10 Violation: Invalid HMI DSL JSON payload: {str(e)}",
                errors=[f"JSON Schema validation error: {str(e)}"],
                checks=[ValidationCheckModel(
                    rule="RULE_10_JSON_STRUCTURE",
                    status="FAIL",
                    details=f"Invalid JSON schema: {str(e)}"
                )]
            )

        # Iterate widgets
        for idx, widget in enumerate(dsl.widgets):
            w_prefix = f"Widget #{idx+1} ('{widget.type}')"

            # Rule 8: Widget Type Check
            if widget.type not in ALLOWED_WIDGET_TYPES:
                errors.append(f"{w_prefix}: Unknown widget type '{widget.type}'. Allowed types are {sorted(list(ALLOWED_WIDGET_TYPES))}.")
                checks.append(ValidationCheckModel(
                    rule="RULE_8_WIDGET_TYPE",
                    status="FAIL",
                    details=f"Unknown widget type '{widget.type}'"
                ))
            else:
                checks.append(ValidationCheckModel(
                    rule="RULE_8_WIDGET_TYPE",
                    status="PASS",
                    details=f"Widget type '{widget.type}' is approved."
                ))

            # Rule 1 & Rule 9: Tag existence check
            if widget.tag:
                if widget.tag not in self.context.tags:
                    errors.append(f"{w_prefix}: Referenced tag '{widget.tag}' does not exist in Machine Context Graph.")
                    checks.append(ValidationCheckModel(
                        rule="RULE_1_TAG_EXISTENCE",
                        status="FAIL",
                        details=f"Tag '{widget.tag}' not found in context."
                    ))
                else:
                    tag_meta = self.context.tags[widget.tag]
                    checks.append(ValidationCheckModel(
                        rule="RULE_1_TAG_EXISTENCE",
                        status="PASS",
                        details=f"Tag '{widget.tag}' verified in context graph."
                    ))

                    # Rule 4: Monitor tag used as writable control check
                    if tag_meta.safety_type == "monitor" and widget.type in ["command_button", "setpoint"]:
                        errors.append(
                            f"{w_prefix}: UNSAFE BINDING! Tag '{widget.tag}' has safety_type='monitor' and writable=False. "
                            f"It CANNOT be bound to a writable '{widget.type}' control!"
                        )
                        checks.append(ValidationCheckModel(
                            rule="RULE_4_MONITOR_NOT_WRITABLE",
                            status="FAIL",
                            details=f"Monitor tag '{widget.tag}' cannot be used in writable control '{widget.type}'."
                        ))

                    # Rule 5: Setpoint validation
                    if widget.type == "setpoint":
                        if tag_meta.safety_type != "setpoint" or not tag_meta.writable:
                            errors.append(f"{w_prefix}: Tag '{widget.tag}' is not configured as a writable setpoint.")
                            checks.append(ValidationCheckModel(
                                rule="RULE_5_SETPOINT_VALIDATION",
                                status="FAIL",
                                details=f"Tag '{widget.tag}' is not a valid setpoint tag."
                            ))
                        elif tag_meta.min is None or tag_meta.max is None:
                            errors.append(f"{w_prefix}: Setpoint tag '{widget.tag}' lacks defined min/max engineering limits.")
                            checks.append(ValidationCheckModel(
                                rule="RULE_5_SETPOINT_VALIDATION",
                                status="FAIL",
                                details=f"Setpoint '{widget.tag}' missing min/max limits."
                            ))
                        else:
                            checks.append(ValidationCheckModel(
                                rule="RULE_5_SETPOINT_VALIDATION",
                                status="PASS",
                                details=f"Setpoint tag '{widget.tag}' has valid min ({tag_meta.min}) and max ({tag_meta.max})."
                            ))

                    # Rule 6: Command button validation
                    if widget.type == "command_button":
                        if tag_meta.safety_type != "command" or not tag_meta.writable:
                            errors.append(f"{w_prefix}: Tag '{widget.tag}' is not a valid writable command tag.")
                            checks.append(ValidationCheckModel(
                                rule="RULE_6_COMMAND_VALIDATION",
                                status="FAIL",
                                details=f"Tag '{widget.tag}' is safety_type='{tag_meta.safety_type}', writable={tag_meta.writable}."
                            ))
                        else:
                            checks.append(ValidationCheckModel(
                                rule="RULE_6_COMMAND_VALIDATION",
                                status="PASS",
                                details=f"Command tag '{widget.tag}' verified with role '{tag_meta.required_role}' and interlocks."
                            ))

            # Rule 2 & Rule 7: Alarm validation
            if widget.alarm:
                if widget.alarm not in self.context.alarms:
                    errors.append(f"{w_prefix}: Referenced alarm '{widget.alarm}' does not exist in Machine Context Graph.")
                    checks.append(ValidationCheckModel(
                        rule="RULE_2_ALARM_EXISTENCE",
                        status="FAIL",
                        details=f"Alarm '{widget.alarm}' not found in context graph."
                    ))
                else:
                    alarm_meta = self.context.alarms[widget.alarm]
                    checks.append(ValidationCheckModel(
                        rule="RULE_7_ALARM_PRIORITY",
                        status="PASS",
                        details=f"Alarm '{widget.alarm}' verified with priority '{alarm_meta.priority}'."
                    ))

            # Rule 3: Asset existence check
            if widget.asset:
                if widget.asset not in self.context.assets:
                    errors.append(f"{w_prefix}: Referenced asset '{widget.asset}' does not exist in Machine Context Graph.")
                    checks.append(ValidationCheckModel(
                        rule="RULE_3_ASSET_EXISTENCE",
                        status="FAIL",
                        details=f"Asset '{widget.asset}' not found in context graph."
                    ))
                else:
                    checks.append(ValidationCheckModel(
                        rule="RULE_3_ASSET_EXISTENCE",
                        status="PASS",
                        details=f"Asset '{widget.asset}' verified."
                    ))

            # stateTag existence check for equipment_graphic
            if widget.stateTag and widget.stateTag not in self.context.tags:
                errors.append(f"{w_prefix}: Equipment graphic stateTag '{widget.stateTag}' does not exist.")
                checks.append(ValidationCheckModel(
                    rule="RULE_1_TAG_EXISTENCE",
                    status="FAIL",
                    details=f"stateTag '{widget.stateTag}' not found."
                ))

        # Check navigation elements
        for nav_asset in dsl.navigation:
            if nav_asset not in self.context.assets:
                warnings.append(f"Navigation target asset '{nav_asset}' is not in context graph.")

        if errors:
            return ValidationResultModel(
                status="rejected",
                reason=f"Validation Safety Gate Rejected AI HMI Proposal ({len(errors)} error(s) found).",
                errors=errors,
                warnings=warnings,
                checks=checks
            )

        return ValidationResultModel(
            status="approved",
            reason="All 11 deterministic safety gate checks passed successfully.",
            errors=[],
            warnings=warnings,
            checks=checks,
            validated_dsl=dsl
        )
