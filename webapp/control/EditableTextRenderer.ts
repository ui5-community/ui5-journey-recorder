import RenderManager from "sap/ui/core/RenderManager";
import EditableText from "./EditableText";
import Label from "sap/m/Title";
import Input from "sap/m/Input";
import Button from "sap/m/Button";

/*!
 * ${copyright}
 */

/**
 * EditableText renderer.
 * @namespace com.ui5.journeyrecorder
 */
export default {
    apiVersion: 2,

    render: function (rm: RenderManager, control: EditableText) {
        rm.openStart("div", control);
        rm.class("editable-text")
        rm.openEnd();

        const isTitleStyle = control.getUseAsTitle();
        const prefix = control.getAggregation('_prefix') as Label;
        if(isTitleStyle) {
            prefix.addStyleClass('title-use')
        }
        rm.renderControl(prefix);
        
        if ((control.getAggregation('_prefix') as Label).getText() !== '') {
            rm.openStart("span");
            rm.openEnd();
            rm.text("\u00a0");
            rm.close("span");
        }

        const text = control.getAggregation('_text') as Label;
        if(isTitleStyle) {
            text.addStyleClass('title-use')
        }
        rm.renderControl(text);

        rm.renderControl(control.getAggregation('_input') as Input);
        rm.renderControl(control.getAggregation('_toEdit') as Button)
        rm.renderControl(control.getAggregation('_toShow') as Button)

        rm.close("div");
    }
}