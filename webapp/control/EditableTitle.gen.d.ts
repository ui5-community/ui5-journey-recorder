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

        /**
         * Gets current value of property "prefix".
         *
         * Default value is: ""
         * @returns Value of property "prefix"
         */
        getPrefix(): string;

        /**
         * Sets a new value for property "prefix".
         *
         * When called with a value of "null" or "undefined", the default value of the property will be restored.
         *
         * Default value is: ""
         * @param [prefix=""] New value for property "prefix"
         * @returns Reference to "this" in order to allow method chaining
         */
        setPrefix(prefix: string): this;

        /**
         * Binds property "prefix" to model data.
         *
         * See {@link sap.ui.base.ManagedObject#bindProperty ManagedObject.bindProperty} for a
         * detailed description of the possible properties of "oBindingInfo"
         * @param oBindingInfo The binding information
         * @returns Reference to "this" in order to allow method chaining
         */
        bindPrefix(bindingInfo: PropertyBindingInfo): this;

        /**
         * Unbinds property "prefix" from model data.
         *
         * @returns Reference to "this" in order to allow method chaining
         */
        unbindPrefix(): this;

        // property: text

        /**
         * Gets current value of property "text".
         *
         * Default value is: ""
         * @returns Value of property "text"
         */
        getText(): string;

        /**
         * Sets a new value for property "text".
         *
         * When called with a value of "null" or "undefined", the default value of the property will be restored.
         *
         * Default value is: ""
         * @param [text=""] New value for property "text"
         * @returns Reference to "this" in order to allow method chaining
         */
        setText(text: string): this;

        /**
         * Binds property "text" to model data.
         *
         * See {@link sap.ui.base.ManagedObject#bindProperty ManagedObject.bindProperty} for a
         * detailed description of the possible properties of "oBindingInfo"
         * @param oBindingInfo The binding information
         * @returns Reference to "this" in order to allow method chaining
         */
        bindText(bindingInfo: PropertyBindingInfo): this;

        /**
         * Unbinds property "text" from model data.
         *
         * @returns Reference to "this" in order to allow method chaining
         */
        unbindText(): this;

        // event: change

        /**
         * Attaches event handler "fn" to the "change" event of this "EditableTitle".
         *
         * When called, the context of the event handler (its "this") will be bound to "oListener" if specified,
         * otherwise it will be bound to this "EditableTitle" itself.
         *
         * @param fn The function to be called when the event occurs
         * @param listener Context object to call the event handler with. Defaults to this "EditableTitle" itself
         *
         * @returns Reference to "this" in order to allow method chaining
         */
        attachChange(fn: (event: EditableTitle$ChangeEvent) => void, listener?: object): this;

        /**
         * Attaches event handler "fn" to the "change" event of this "EditableTitle".
         *
         * When called, the context of the event handler (its "this") will be bound to "oListener" if specified,
         * otherwise it will be bound to this "EditableTitle" itself.
         *
         * @param data An application-specific payload object that will be passed to the event handler along with the event object when firing the event
         * @param fn The function to be called when the event occurs
         * @param listener Context object to call the event handler with. Defaults to this "EditableTitle" itself
         *
         * @returns Reference to "this" in order to allow method chaining
         */
        attachChange<CustomDataType extends object>(data: CustomDataType, fn: (event: EditableTitle$ChangeEvent, data: CustomDataType) => void, listener?: object): this;

        /**
         * Detaches event handler "fn" from the "change" event of this "EditableTitle".
         *
         * The passed function and listener object must match the ones used for event registration.
         *
         * @param fn The function to be called, when the event occurs
         * @param listener Context object on which the given function had to be called
         * @returns Reference to "this" in order to allow method chaining
         */
        detachChange(fn: (event: EditableTitle$ChangeEvent) => void, listener?: object): this;

        /**
         * Fires event "change" to attached listeners.
         *
         * @param parameters Parameters to pass along with the event
         * @param [mParameters.value]
         *
         * @returns Reference to "this" in order to allow method chaining
         */
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
