import Event from "sap/ui/base/Event";
import { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import { $ControlSettings } from "sap/ui/core/Control";

declare module "./EditableTitle" {

    /**
     * Interface defining the settings object used in constructor calls
     */
    interface $EditableTitleSettings extends $ControlSettings {
        prefix?: string | PropertyBindingInfo;
        text?: string | PropertyBindingInfo;
        change?: (event: EditableTitle$ChangeEvent) => void;
    }

    export default interface EditableTitle {

        // property: prefix
        getPrefix(): string;
        setPrefix(prefix: string): this;
        bindPrefix(bindingInfo: PropertyBindingInfo): this;
        unbindPrefix(): this;

        // property: text
        getText(): string;
        setText(text: string): this;
        bindText(bindingInfo: PropertyBindingInfo): this;
        unbindText(): this;

        // event: change
        attachChange(fn: (event: EditableTitle$ChangeEvent) => void, listener?: object): this;
        attachChange<CustomDataType extends object>(data: CustomDataType, fn: (event: EditableTitle$ChangeEvent, data: CustomDataType) => void, listener?: object): this;
        detachChange(fn: (event: EditableTitle$ChangeEvent) => void, listener?: object): this;
        fireChange(parameters?: EditableTitle$ChangeEventParameters): this;
    }

    /**
     * Interface describing the parameters of EditableTitle's 'change' event.
     */
    export interface EditableTitle$ChangeEventParameters {
        value?: string;
    }

    /**
     * Type describing the EditableTitle's 'change' event.
     */
    export type EditableTitle$ChangeEvent = Event<EditableTitle$ChangeEventParameters>;
}
