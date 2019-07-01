describe('test' , function () {

    it('Test 0', function () {
        var searchField = element(by.control( { controlType : "sap.m.SearchField", id : /searchField$/, interaction: { idSuffix : "I" } }));
        var columnListItem = element(by.control( { controlType : "sap.m.ColumnListItem", bindingPath: { path : "/Posts('PostID_17')", model : "mainData" } }));
        var postDescriptionLabelText = element(by.control( { controlType : "sap.m.Text", id : /descriptionText$/ }));
        searchField.clear();
        searchField.sendKeys('Car');
        searchField.click();
        columnListItem.click();
        expect(postDescriptionLabelText.asControl().getProperty("text")).toBe("Only 160.000 km and in really good shape, grip shift, contact me for appointment and more details.");
    });

});