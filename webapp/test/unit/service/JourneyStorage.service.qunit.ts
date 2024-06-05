import Journey from "com/ui5/journeyrecorder/model/class/Journey.class";
import { ClickStep, Control, InputStep, KeyPressStep, ValidationStep } from "com/ui5/journeyrecorder/model/class/Step.class";
import JourneyStorageService from "com/ui5/journeyrecorder/service/JourneyStorage.service";

QUnit.module("JourneyStorageService");

QUnit.test("The JourneyStorageService generates a correct InputStep from a Select and KeyPress Step", function(assert) {
    const stepControl: Control = {
        controlId: {
            id: "control",
            use: true
        },
        type: "Input"
    };
    const location = "DummyURL";
    const viewInfo = {
        absoluteViewName: "test.whatever.View",
        relativeViewName: "View"
    };

    const valStep = new ValidationStep();
    valStep.control = stepControl;
    valStep.actionLocation = location;
    valStep.viewInfos = viewInfo;

    const keyPress1Step = new KeyPressStep();
    keyPress1Step.control = stepControl;
    keyPress1Step.actionLocation = location;
    keyPress1Step.viewInfos = viewInfo;
    keyPress1Step.key = "1"
    keyPress1Step.keyCode = 49
    
    const keyPress2Step = new KeyPressStep();
    keyPress2Step.control = stepControl;
    keyPress2Step.actionLocation = location;
    keyPress2Step.viewInfos = viewInfo;
    keyPress2Step.key = "2"
    keyPress2Step.keyCode = 50

    const recording = {
        id: "123",
        created: Date.now(),
        steps: [
            valStep,
            keyPress1Step,
            keyPress2Step
        ]
    };

    const genJourney = JourneyStorageService.createJourneyFromRecording(recording);
    assert.ok(genJourney instanceof Journey);
    assert.ok(genJourney.id);
    assert.ok(genJourney.created <= Date.now());
    assert.ok(genJourney.steps[0] instanceof InputStep);
});



QUnit.test("The JourneyStorageService generates a correct InputStep from a Click and KeyPress Step", function(assert) {
    const stepControl: Control = {
        controlId: {
            id: "control",
            use: true
        },
        type: "Input"
    };
    const location = "DummyURL";
    const viewInfo = {
        absoluteViewName: "test.whatever.View",
        relativeViewName: "View"
    };

    const valStep = new ClickStep();
    valStep.control = stepControl;
    valStep.actionLocation = location;
    valStep.viewInfos = viewInfo;

    const keyPress1Step = new KeyPressStep();
    keyPress1Step.control = stepControl;
    keyPress1Step.actionLocation = location;
    keyPress1Step.viewInfos = viewInfo;
    keyPress1Step.key = "1"
    keyPress1Step.keyCode = 49
    
    const keyPress2Step = new KeyPressStep();
    keyPress2Step.control = stepControl;
    keyPress2Step.actionLocation = location;
    keyPress2Step.viewInfos = viewInfo;
    keyPress2Step.key = "2"
    keyPress2Step.keyCode = 50

    const recording = {
        id: "123",
        created: Date.now(),
        steps: [
            valStep,
            keyPress1Step,
            keyPress2Step
        ]
    };

    const genJourney = JourneyStorageService.createJourneyFromRecording(recording);
    assert.ok(genJourney instanceof Journey);
    assert.ok(genJourney.id);
    assert.ok(genJourney.created <= Date.now());
    assert.ok(genJourney.steps[0] instanceof InputStep);
});