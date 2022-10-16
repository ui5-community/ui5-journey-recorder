const { describe, it } = require("node:test");
const assert = require("node:assert").strict;
const {
  TestScenario,
} = require("../dist-codeservice/src/app/classes/testScenario.js");

const _scenario = require("./test.json");
const { default: Wdi5SingleStepStrategy } = require("../dist-codeservice/src/app/scenario/codeService/strategies/wdi5/Wdi5SingleStepStrategy.js")
const scenario = TestScenario.fromJSON(JSON.stringify(_scenario));

describe("wdi5 step generation", () => {
  it("click", () => {
    const expected = "await browser.asControl({\n\tselector: {\n\t\tcontrolType: \"sap.ui.core.Icon\",\n\t\tviewName: \"test.Sample.tsapp.view.Other\",\n\t\tproperties: {\n\t\t\tsrc: {\n\t\t\t\tregex: {\n\t\t\t\t\tsource: \"nav-back\",\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n}).press();"
    const clickstep = scenario.pages[1].page_steps[1]
    const code = Wdi5SingleStepStrategy.generateSinglePressStep(clickstep)
    assert.equal(code, expected)
  });

  it("validate/exists", () => {
    const expected = "await browser.asControl({\n\tselector: {\n\t\tid: \"NavFwdButton\",\n\t\tviewName: \"test.Sample.tsapp.view.Main\",\n\t}\n})"
    const existsStep = scenario.pages[1].page_steps[0]
    const code = Wdi5SingleStepStrategy.generateSinglePressStep(existsStep)
    assert.equal(code, expected)
  })

  it.todo("input step")
});


