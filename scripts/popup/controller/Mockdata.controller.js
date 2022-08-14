sap.ui.define([
    "com/ui5/testing/controller/BaseController",
    "com/ui5/testing/model/RecordController",
    "com/ui5/testing/model/Connection",
    "com/ui5/testing/model/ConnectionMessages",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment"
], function (
    BaseController,
    RecordController,
    Connection,
    ConnectionMessages,
    JSONModel,
    Fragment) {
    "use strict";

    return BaseController.extend("com.ui5.testing.controller.Mockdata", {

        /**
         *
         */
        onInit: function () {
            this.getView().setModel(new JSONModel({}), "mockdataModel");
            this.getRouter().getRoute("mockdata").attachPatternMatched(this._onObjectMatched, this);
        },

        /**
         *
         */
        _onObjectMatched: function () {
            Fragment.load({
                name: "com.ui5.testing.fragment.ComponentDialog",
                controller: this
            }).then(function (oWaitDialog) {
                this._oWaitingDialog = oWaitDialog;
                /* this._oRecordDialog.attachClose(this.onStopRecord, this); */
                var iTimeoutID = setTimeout(function () {
                    this._oWaitingDialog.open();
                }.bind(this), 1000 /* 1 sec enough? */ );
                ConnectionMessages.rootComponentAvailable(Connection.getInstance()).then(function (oData) {
                    clearTimeout(iTimeoutID);
                    this._oWaitingDialog.close();
                }.bind(this));
            }.bind(this));
        },

        /**
         * 
         * @param {*} oData 
         */
        _refactorMetadata: function (oData) {
            var namespaces = {};
            oData[0].metadata.dataServices.schema.forEach(oSch => {
                if (!namespaces[oSch.namespace]) {
                    namespaces[oSch.namespace] = {};
                }
                namespaces[oSch.namespace].lengthETypes = oSch.entityType ? oSch.entityType.length : 0;
                namespaces[oSch.namespace].entityTypes = {};
                if (oSch.entityType) {
                    oSch.entityType.forEach(oET => {
                        namespaces[oSch.namespace].entityTypes[oET.name] = {};
                        namespaces[oSch.namespace].entityTypes[oET.name].key = oET.key;
                        namespaces[oSch.namespace].entityTypes[oET.name].properties = oET.property;
                        namespaces[oSch.namespace].entityTypes[oET.name].navigationPropertyies = oET.navigationProperty;
                    });
                }
                namespaces[oSch.namespace].associations = oSch.association;
                namespaces[oSch.namespace].entitySets = oSch.entityContainer ? oSch.entityContainer.map(oC => oC.entitySet.map(oS => {
                    return {
                        name: oS.name,
                        typeNamespace: oS.entityType.substring(0, oS.entityType.lastIndexOf('.')),
                        type: oS.entityType.substring(oS.entityType.lastIndexOf('.') + 1)
                    };
                })).reduce((a, b) => a.concat(b), []) : [];
                namespaces[oSch.namespace].lengthESets = namespaces[oSch.namespace].entitySets.length;
                namespaces[oSch.namespace].associationSets = oSch.entityContainer ? oSch.entityContainer.map(oC => oC.associationSet).reduce((a, b) => a.concat(b), []) : [];
            });
            return namespaces;
        },

        /**
         *
         */
        retrieveODataV2: function () {
            sap.ui.core.BusyIndicator.show();
            var sTimeout = setTimeout(function () {
                sap.ui.core.BusyIndicator.hide();
            }, 5000);
            ConnectionMessages.getODataV2Models(Connection.getInstance()).then(function (oData) {
                var oMetadata = this._refactorMetadata(oData);

                var aViewConstruct = Object.keys(oMetadata)
                    .filter(sK => oMetadata[sK].lengthESets > 0)
                    .map(sKey => oMetadata[sKey].entitySets)
                    .reduce((cSet, aSet) => cSet.concat(aSet), [])
                    .map(oESet => {
                        oESet.lineType = oMetadata[oESet.typeNamespace].entityTypes[oESet.type];
                        var aKeys = oESet.lineType.key.propertyRef.map(function (o) {
                            return o.name;
                        });
                        oESet.lineType.properties.forEach(function (p) {
                            p.isKey = aKeys.includes(p.name);
                        });
                        return oESet;
                    });
                this.getView().getModel('mockdataModel').setProperty('/eSets', aViewConstruct);
                clearTimeout(sTimeout);
                sap.ui.core.BusyIndicator.hide();
            }.bind(this));
        },

        /**
         * 
         * @param {*} sName 
         * @param {*} aKeys 
         */
        checkForKey: function (bIsKey) {
            return bIsKey ? sap.m.LabelDesign.Bold : sap.m.LabelDesign.Standard;
        },

        /**
         * 
         * @param {*} oEvent 
         */
        addLine: function (oEvent) {
            debugger;
            //eSETContext.getObject().lineType.properties.map(t => { var o = {}; if(t.isKey) { 
        }
    });
});