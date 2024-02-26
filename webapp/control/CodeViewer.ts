import Control from "sap/ui/core/Control";
import { MetadataOptions } from "sap/ui/core/Element";
import CodeViewerRenderer from "./CodeViewerRenderer";
import { Themes } from "../model/enum/Themes";
import Theming from "sap/ui/core/Theming";

/*!
 * ${copyright}
 */

/**
 * @namespace com.ui5.journeyrecorder
 * 
 * @extends Control
 * @author Adrian Marten
 * @version ${version}
 * 
 * @constructor
 * @public
 * @name com.ui5.journeyrecorder.control.CodeViewer
 */
export default class CodeViewer extends Control {
    // The following three lines were generated and should remain as-is to make TypeScript aware of the constructor signatures
    constructor(idOrSettings?: string | $CodeViewerSettings);
    constructor(id?: string, settings?: $CodeViewerSettings);
    constructor(id?: string, settings?: $CodeViewerSettings) {
        super(id, settings);
        Theming.attachApplied(() => {
            this.invalidate();
        });
    }

    static readonly metadata: MetadataOptions = {
        properties: {
            height: { type: "string", defaultValue: '100%' },
            language: { type: "string", defaultValue: '', bindable: true },
            code: { type: "string", defaultValue: '', bindable: true },
        }
    }

    static renderer: typeof CodeViewerRenderer = CodeViewerRenderer;
}