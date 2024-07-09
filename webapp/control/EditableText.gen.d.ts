import Event from "sap/ui/base/Event";
import { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import { $ControlSettings } from "sap/ui/core/Control";

declare module "./EditableText" {

    /**
     * Interface defining the settings object used in constructor calls
     */
    interface $EditableTextSettings extends $ControlSettings {
        prefix?: string | PropertyBindingInfo;
        text?: string | PropertyBindingInfo;
        useAsTitle?: boolean | PropertyBindingInfo | `{${string}}`;
        change?: (event: EditableText$ChangeEvent) => void;
    }

    export default interface EditableText {

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

        // property: useAsTitle
        getUseAsTitle(): boolean;
        setUseAsTitle(useAsTitle: boolean): this;
        bindUseAsTitle(bindingInfo: PropertyBindingInfo): this;
        unbindUseAsTitle(): this;

        // event: change
        attachChange(fn: (event: EditableText$ChangeEvent) => void, listener?: object): this;
        attachChange<CustomDataType extends object>(data: CustomDataType, fn: (event: EditableText$ChangeEvent, data: CustomDataType) => void, listener?: object): this;
        detachChange(fn: (event: EditableText$ChangeEvent) => void, listener?: object): this;
        fireChange(parameters?: EditableText$ChangeEventParameters): this;
    }

    /**
     * Interface describing the parameters of EditableText's 'change' event.
     */
    export interface EditableText$ChangeEventParameters {
        value?: string;
    }

    /**
     * Type describing the EditableText's 'change' event.
     */
    export type EditableText$ChangeEvent = Event<EditableText$ChangeEventParameters>;
}
