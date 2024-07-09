import Control from "sap/ui/core/Control";
import { MetadataOptions } from "sap/ui/core/Element";
import EditableTextRenderer from "./EditableTextRenderer";
import Button from "sap/m/Button";
import { ButtonType } from "sap/m/library";
import Label from "sap/m/Label";
import { LabelDesign } from "sap/m/library";
import Input from "sap/m/Input";
import { InputBase$ChangeEvent } from "sap/m/InputBase";

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
 * @name com.ui5.journeyrecorder.control.EditableText
 */
export default class EditableText extends Control {
    // The following three lines were generated and should remain as-is to make TypeScript aware of the constructor signatures
    constructor(idOrSettings?: string | $EditableTextSettings);
    constructor(id?: string, settings?: $EditableTextSettings);
    constructor(id?: string, settings?: $EditableTextSettings) { super(id, settings); }

    static readonly metadata: MetadataOptions = {
        properties: {
            prefix: { type: "string", defaultValue: '', bindable: true },
            text: { type: "string", defaultValue: '', bindable: true },
            useAsTitle: { type: "boolean", defaultValue: false, bindable: true }
        },
        aggregations: {
            _prefix: { type: "sap.m.Label", multiple: false, visibility: "hidden" },
            _text: { type: "sap.m.Label", multiple: false, visibility: "hidden" },
            _input: { type: "sap.m.Input", multiple: false, visibility: "hidden" },
            _toEdit: { type: "sap.m.Button", multiple: false, visibility: "hidden" },
            _toShow: { type: "sap.m.Button", multiple: false, visibility: "hidden" }
        },
        events: {
            change: {
                parameters: {
                    value: { type: "string" }
                }
            }
        }
    }

    init() {
        this.setAggregation("_toEdit",
            new Button({
                id: this.getId() + "-editSwitch",
                icon: "sap-icon://edit",
                type: ButtonType.Transparent,
                visible: true,
                press: this._toEdit.bind(this)
            }));
        this.setAggregation("_toShow",
            new Button({
                id: this.getId() + "-viewSwitch",
                icon: "sap-icon://decline",
                type: ButtonType.Transparent,
                visible: false,
                press: this._toShow.bind(this)
            }));


        this.setAggregation("_prefix",
            new Label({ 
                id: this.getId() + "-prefix", 
                text: this.getPrefix(), 
                visible: true, 
                design: (this.getUseAsTitle() as boolean) ? LabelDesign.Bold : LabelDesign.Standard
            }));

        const titleInput = new Label({ 
            id: this.getId() + "-text", 
            text: this.getText(), 
            visible: true, 
            design: (this.getUseAsTitle() as boolean) ? LabelDesign.Bold : LabelDesign.Standard
        });
        this.setAggregation("_text", titleInput);

        this.setAggregation("_input",
            new Input({
                value: this.getText(),
                visible: false,
                change: this._textChanged.bind(this)
            })
        );
    }

    onBeforeRendering(): void {
        (this.getAggregation('_prefix') as Label).setText(this.getPrefix());
        (this.getAggregation('_prefix') as Label).setDesign((this.getUseAsTitle() as boolean) ? LabelDesign.Bold : LabelDesign.Standard);
        (this.getAggregation('_text') as Label).setText(this.getText());
        (this.getAggregation('_text') as Label).setDesign((this.getUseAsTitle() as boolean) ? LabelDesign.Bold : LabelDesign.Standard);
        (this.getAggregation('_input') as Input).setValue(this.getText());
    }

    private _toEdit() {
        (this.getAggregation("_toEdit") as Button).setVisible(false);
        (this.getAggregation("_toShow") as Button).setVisible(true);
        (this.getAggregation('_prefix') as Label).setVisible(false);
        (this.getAggregation('_text') as Label).setVisible(false);
        (this.getAggregation("_input") as Input).setVisible(true);

    }

    private _toShow() {
        (this.getAggregation("_toEdit") as Button).setVisible(true);
        (this.getAggregation("_toShow") as Button).setVisible(false);
        (this.getAggregation('_prefix') as Label).setVisible(true);
        (this.getAggregation('_text') as Label).setVisible(true);
        (this.getAggregation("_input") as Input).setVisible(false);
    }

    private _textChanged(oEvent: InputBase$ChangeEvent) {
        const newText: string = oEvent.getParameter('value');
        this.setText(newText);
        (this.getAggregation("_input") as Input).setValue(newText);
        (this.getAggregation('_text') as Label).setText(newText);

        this.fireEvent("change", {
            value: this.getText()
        });
    }

    static renderer: typeof EditableTextRenderer = EditableTextRenderer;
}