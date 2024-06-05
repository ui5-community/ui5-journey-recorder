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
        getHeight(): string;
        setHeight(height: string): this;

        // property: language
        getLanguage(): string;
        setLanguage(language: string): this;
        bindLanguage(bindingInfo: PropertyBindingInfo): this;
        unbindLanguage(): this;

        // property: code
        getCode(): string;
        setCode(code: string): this;
        bindCode(bindingInfo: PropertyBindingInfo): this;
        unbindCode(): this;
    }
}
