import { IconColor, ValueState } from "sap/ui/core/library";
import { StepType } from "./enum/StepType";

export default {
	formatValue: (value: string) => {
		return value?.toUpperCase();
	},

	actionIcon(action: StepType) {
		switch (action) {
			case StepType.CLICK:
				return "sap-icon://cursor-arrow";
			case StepType.INPUT:
				return "sap-icon://text";
			case StepType.KEYPRESS:
				return "sap-icon://keyboard-and-mouse";
			case StepType.VALIDATION:
				return "sap-icon://validate";
			default:
				return 'sap-icon://question-mark';
		}
	},

	actionText(action: StepType) {
		switch (action) {
			case StepType.CLICK:
				return "Click";
			case StepType.INPUT:
				return "Input";
			case StepType.KEYPRESS:
				return "KeyPress";
			case StepType.VALIDATION:
				return "Validation";
			default:
				return '';
		}
	},

	stateIconColor(state: ValueState) {
		switch (state) {
			case ValueState.Error:
				return IconColor.Negative;
			case ValueState.Information:
				return IconColor.Contrast;
			case ValueState.Success:
				return IconColor.Positive;
			case ValueState.Warning:
				return IconColor.Critical;
			default:
				return IconColor.Default;
		}
	},

	stateIcon(state: ValueState) {
		switch (state) {
			case ValueState.Error:
				return 'sap-icon://message-error';
			case ValueState.Information:
				return 'sap-icon://hint';
			case ValueState.Success:
				return 'sap-icon://accept';
			case ValueState.Warning:
				return 'sap-icon://warning2';
			default:
				'';
		}
	}
};
