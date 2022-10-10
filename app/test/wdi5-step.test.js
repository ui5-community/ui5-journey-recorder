const { describe, it } = require("node:test");
const assert = require("node:assert").strict;
const Wdi5CodeStrategy = require("../dist-codeservice/src/app/scenario/codeService/strategies/wdi5/Wdi5CodeStrategy.js").default;
const {
  TestScenario,
} = require("../dist-codeservice/src/app/classes/testScenario.js");
const Step = require("../dist-codeservice/src/app/classes/Step.js")

const _scenario = require("./Journey_220922_22_22.json");
describe("wdi5 step generation", () => {
  it("click", () => {
    assert.ok(false)
  });
});


