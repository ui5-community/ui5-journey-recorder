/*!
 * ${copyright}
 */

import RenderManager from "sap/ui/core/RenderManager";
import CodeViewer from "./CodeViewer";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import Theming from "sap/ui/core/Theming";
import { Themes } from "../model/enum/Themes";

/**
 * @namespace com.ui5.journeyrecorder
 * 
 * @author Adrian Marten
 * @version ${version}
 * 
 * @constructors
 * @public
 * @name com.ui5.journeyrecorder.control.CodeViewerRenderer
 */
export default class CodeViewerRenderer {
    apiVersion: 2;

    constructor() { }

    public static render(rm: RenderManager, control: CodeViewer) {
        const th = Theming.getTheme() as Themes;
        hljs.registerLanguage('javascript', javascript)
        rm.openStart("div", control);
        rm.class("code-viewer")
        rm.style("height", control.getHeight());
        rm.style("overflow", "auto");
        rm.openEnd();
        rm.openStart("pre")
        switch (th) {
            case Themes.QUARTZ_DARK:
            case Themes.EVENING_HORIZON:
                rm.class("dark");
                break;
            default:
                rm.class("bright");
        }
        rm.openEnd();
        rm.openStart("code").class("hljs").class("internal").openEnd();
        const highlightedCode = control.getCode().split('\n').map((cp) => hljs.highlight(cp, { language: control.getLanguage() }).value);
        const lineCount = highlightedCode.length;
        const indicatorWith = `${('' + lineCount).length * 0.5}rem`;
        highlightedCode.forEach((hc, index) => {
            rm.openStart("div").class("row").openEnd();
            rm.openStart("div").class("line-indicator").style("width", indicatorWith).openEnd();
            rm.text('' + index);
            rm.close("div");
            rm.openStart("div").class("code").openEnd()
            rm.unsafeHtml(hc);
            rm.close("div")
            rm.close("div")
        })

        rm.close("code");
        rm.close("pre");

        // get the pre and code section with speed-highlight package
        rm.close("div");
    }
}