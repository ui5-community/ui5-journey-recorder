const { describe, it } = require("node:test");
const assert = require("node:assert").strict;
const Wdi5CodeStrategy = require("../dist-codeservice/src/app/scenario/codeService/strategies/wdi5/Wdi5CodeStrategy.js").default;
const {
  TestScenario,
} = require("../dist-codeservice/src/app/classes/testScenario.js");


const _scenario = require("./Journey_220922_22_22.json");
describe("wdi5 scenario generation", () => {
  it("scenario", () => {
    const scenario = TestScenario.fromJSON(JSON.stringify(_scenario));
    const result = new Wdi5CodeStrategy().generateTestCode(scenario);
    assert.ok(false)
  });
});


