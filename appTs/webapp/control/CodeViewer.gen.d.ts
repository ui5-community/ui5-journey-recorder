import { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import { $ControlSettings } from "sap/ui/core/Control";

declare module "./CodeViewer" {

    /**
     * Interface defining the settings object used in constructor calls
     */
    interface $CodeViewerSettings extends $ControlSettings {
        height?: string | PropertyBindingInfo;
        language?: string | PropertyBindingInfo;
        code?: string | PropertyBindingInfo;
    }

    export default interface CodeViewer {

        // property: height

        /**
         * Gets current value of property "height".
         *
         * Default value is: "100%"
         * @returns Value of property "height"
         */
        getHeight(): string;

        /**
         * Sets a new value for property "height".
         *
         * When called with a value of "null" or "undefined", the default value of the property will be restored.
         *
         * Default value is: "100%"
         * @param [height="100%"] New value for property "height"
         * @returns Reference to "this" in order to allow method chaining
         */
        setHeight(height: string): this;

        // property: language

        /**
         * Gets current value of property "language".
         *
         * Default value is: ""
         * @returns Value of property "language"
         */
        getLanguage(): string;

        /**
         * Sets a new value for property "language".
         *
         * When called with a value of "null" or "undefined", the default value of the property will be restored.
         *
         * Default value is: ""
         * @param [language=""] New value for property "language"
         * @returns Reference to "this" in order to allow method chaining
         */
        setLanguage(language: string): this;

        /**
         * Binds property "language" to model data.
         *
         * See {@link sap.ui.base.ManagedObject#bindProperty ManagedObject.bindProperty} for a
         * detailed description of the possible properties of "oBindingInfo"
         * @param oBindingInfo The binding information
         * @returns Reference to "this" in order to allow method chaining
         */
        bindLanguage(bindingInfo: PropertyBindingInfo): this;

        /**
         * Unbinds property "language" from model data.
         *
         * @returns Reference to "this" in order to allow method chaining
         */
        unbindLanguage(): this;

        // property: code

        /**
         * Gets current value of property "code".
         *
         * Default value is: ""
         * @returns Value of property "code"
         */
        getCode(): string;

        /**
         * Sets a new value for property "code".
         *
         * When called with a value of "null" or "undefined", the default value of the property will be restored.
         *
         * Default value is: ""
         * @param [code=""] New value for property "code"
         * @returns Reference to "this" in order to allow method chaining
         */
        setCode(code: string): this;

        /**
         * Binds property "code" to model data.
         *
         * See {@link sap.ui.base.ManagedObject#bindProperty ManagedObject.bindProperty} for a
         * detailed description of the possible properties of "oBindingInfo"
         * @param oBindingInfo The binding information
         * @returns Reference to "this" in order to allow method chaining
         */
        bindCode(bindingInfo: PropertyBindingInfo): this;

        /**
         * Unbinds property "code" from model data.
         *
         * @returns Reference to "this" in order to allow method chaining
         */
        unbindCode(): this;
    }
}
