import { UI5Selector } from "ui5-testcafe-selector";
fixture('UI5con 2019')
  .page('http://localhost:8080/index.html#/p3');

test('UI5con 2019', async t => {
  await t.typeText(UI5Selector({ domChildWith : "-I", metadata: { elementName : "sap.m.SearchField" }, identifier: { ui5LocalId : "searchField" } }),"Car", { paste: false, speed: 1, replace: true });
  await t.click(UI5Selector({ domChildWith : "-search", metadata: { elementName : "sap.m.SearchField" }, identifier: { ui5LocalId : "searchField" } }));
  await t.expect(UI5Selector({ metadata: { elementName : "sap.m.Table" }, identifier: { ui5LocalId : "table" } }).getUI5(({ element }) => element.aggregation.items.length)).eql('2');
  await t.click(UI5Selector({ metadata: { elementName : "sap.m.ColumnListItem" }, context: { mainData: { Title : "Car VW Golf (white)" } } }));

  //new route:#/p4/PostID_17
  await t.expect(UI5Selector("__text26").getUI5(({ element }) => element.property.text)).eql('Only 160.000 km and in really good shape, grip shift, contact me for appointment and more details.');
  await t.expect(UI5Selector({ metadata: { elementName : "sap.m.ObjectNumber" }, identifier: { ui5LocalId : "number" } }).getUI5(({ element }) => element.property.number)).eql('3006.00');
});