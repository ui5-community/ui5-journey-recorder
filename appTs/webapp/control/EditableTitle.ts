import Control from "sap/ui/core/Control";
import { MetadataOptions } from "sap/ui/core/Element";
import EditableTitleRenderer from "./EditableTitleRenderer";
import Button from "sap/m/Button";
import { ButtonType } from "sap/m/library";
import Title from "sap/m/Title";
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
 * @name com.ui5.journeyrecorder.control.EditableTitle
 */
export default class EditableTitle extends Control {// The following three lines were generated and should remain as-is to make TypeScript aware of the constructor signatures
    constructor(idOrSettings?: string | $EditableTitleSettings);
    constructor(id?: string, settings?: $EditableTitleSettings);
    constructor(id?: string, settings?: $EditableTitleSettings) { super(id, settings); }

    static readonly metadata: MetadataOptions = {
        properties: {
            prefix: { type: "string", defaultValue: '', bindable: true },
            text: { type: "string", defaultValue: '', bindable: true },
        },
        aggregations: {
            _prefix: { type: "sap.m.Title", multiple: false, visibility: "hidden" },
            _title: { type: "sap.m.Title", multiple: false, visibility: "hidden" },
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
            new Title({ id: this.getId() + "-prefix", text: this.getPrefix(), visible: true }));

        const titleInput = new Title({ id: this.getId() + "-title", text: this.getText(), visible: true });
        this.setAggregation("_title", titleInput);

        this.setAggregation("_input",
            new Input({
                value: this.getText(),
                visible: false,
                change: this._textChanged.bind(this)
            })
        );
    }

    onBeforeRendering(): void {
        (this.getAggregation('_prefix') as Title).setText(this.getPrefix());
        (this.getAggregation('_title') as Title).setText(this.getText());
        (this.getAggregation('_input') as Input).setValue(this.getText());
    }

    private _toEdit() {
        (this.getAggregation("_toEdit") as Button).setVisible(false);
        (this.getAggregation("_toShow") as Button).setVisible(true);
        (this.getAggregation('_prefix') as Title).setVisible(false);
        (this.getAggregation('_title') as Title).setVisible(false);
        (this.getAggregation("_input") as Input).setVisible(true);

    }

    private _toShow() {
        (this.getAggregation("_toEdit") as Button).setVisible(true);
        (this.getAggregation("_toShow") as Button).setVisible(false);
        (this.getAggregation('_prefix') as Title).setVisible(true);
        (this.getAggregation('_title') as Title).setVisible(true);
        (this.getAggregation("_input") as Input).setVisible(false);
    }

    private _textChanged(oEvent: InputBase$ChangeEvent) {
        const newText: string = oEvent.getParameter('value');
        this.setText(newText);
        (this.getAggregation("_input") as Input).setValue(newText);
        (this.getAggregation('_title') as Title).setText(newText);

        this.fireEvent("change", {
            value: this.getText()
        });
    }

    static renderer: typeof EditableTitleRenderer = EditableTitleRenderer;
}