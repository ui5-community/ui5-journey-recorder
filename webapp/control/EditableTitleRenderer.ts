import RenderManager from "sap/ui/core/RenderManager";
import EditableTitle from "./EditableTitle";
import Title from "sap/m/Title";
import Input from "sap/m/Input";
import Button from "sap/m/Button";

/*!
 * ${copyright}
 */

/**
 * EditableTitle renderer.
 * @namespace com.ui5.journeyrecorder
 */
export default {
    apiVersion: 2,

    render: function (rm: RenderManager, control: EditableTitle) {
        rm.openStart("div", control);
        rm.class("editable-title")
        rm.openEnd();
        rm.renderControl(control.getAggregation('_prefix') as Title);
        if ((control.getAggregation('_prefix') as Title).getText() !== '') {
            rm.openStart("span");
            rm.openEnd();
            rm.text("\u00a0");
            rm.close("span");
        }
        rm.renderControl(control.getAggregation('_title') as Title);
        rm.renderControl(control.getAggregation('_input') as Input);
        rm.renderControl(control.getAggregation('_toEdit') as Button)
        rm.renderControl(control.getAggregation('_toShow') as Button)

        rm.close("div");
    }
}