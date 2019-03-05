sap.ui.define([
    "com/ui5/testing/controller/BaseController",
    "com/ui5/testing/model/Communication",
    "com/ui5/testing/model/RecordController",
    "com/ui5/testing/model/GlobalSettings",
    "com/ui5/testing/model/Navigation",
    "com/ui5/testing/model/Mockserver",
    "com/ui5/testing/model/ChromeStorage",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    'sap/ui/model/Filter'
], function (BaseController, Communication, RecordController, GlobalSettings, Navigation, Mockserver, ChromeStorage, JSONModel, MessageToast, Filter) {
    "use strict";

    return BaseController.extend("com.ui5.testing.controller.Settings", {

        onInit: function () {
            this._oModel = this._createViewModel();
            this.getView().setModel(this._oModel, "viewModel");
            this.getView().setModel(Mockserver.getModel(), "mockserver");
            this.getRouter().getRoute("mockserver").attachPatternMatched(this._onObjectMatched, this);
            this._initFragments();
        },

        _initFragments: function () {
            this._oFakerDialog = sap.ui.xmlfragment(
                "com.ui5.testing.fragment.SelectFaker",
                this
            );
            this._oFakerDialog.setModel(this._oModel, "viewModel");
            this._oFixedValueDialog = sap.ui.xmlfragment(
                "com.ui5.testing.fragment.SelectFixedValue",
                this
            );
            this._oFixedValueDialog.setModel(this._oModel, "viewModel");
            this._oMultipleValueDialog = sap.ui.xmlfragment("multiple_dialog",
                "com.ui5.testing.fragment.SelectMultipleValues",
                this
            );
            this._oMultipleValueDialog.setModel(this._oModel, "viewModel");
            this._oMultipleValueDialogTable = sap.ui.core.Fragment.byId("multiple_dialog", "tbl");

            this._oAssocGenerateDialog = sap.ui.xmlfragment("multiple_dialog",
                "com.ui5.testing.fragment.SelectAssociationGeneration",
                this
            );
            this._oAssocGenerateDialog.setModel(this._oModel, "viewModel");

            this._oFormulaDialog = sap.ui.xmlfragment("formula_dialog",
                "com.ui5.testing.fragment.SelectFormula",
                this
            );
            this._oFormulaDialog.setModel(this._oModel, "viewModel");
        },

        onAfterRendering: function () {
            var that = this;
            document.getElementById("importOrigHelper2").addEventListener("change", function (e) {
                var files = e.target.files, reader = new FileReader();
                var fnImportDone = function () {
                    that._importDone(JSON.parse(this.result));
                }
                reader.onload = fnImportDone;
                reader.readAsText(files[0]);
            }, false);
        },

        onSearch: function (oEvent) {
            var aFilters = [];
            var sQuery = oEvent.getSource().getValue();
            if (sQuery && sQuery.length > 0) {
                var filter = new Filter("entity/name", sap.ui.model.FilterOperator.Contains, sQuery);
                aFilters.push(filter);
                filter = new Filter("name", sap.ui.model.FilterOperator.Contains, sQuery);
                aFilters.push(filter);
                aFilters = [new Filter({
                    filters: aFilters,
                    and: false
                })];
            }

            var oList = oEvent.getSource();
            while (oList) {
                if (oList.getMetadata().getElementName() === "sap.m.List") {
                    oList.getBinding("items").filter(aFilters);
                    break;
                }
                oList = oList.getParent();
            }
        },

        onImport: function () {
            document.getElementById("importOrigHelper2").click();
        },

        _onObjectMatched: function () {
            if (RecordController.isInjected()) {
                this._loadMockServer();
                return;
            }

            RecordController.injectScript().then(function () {
                this._loadMockServer();
            }.bind(this));
        },

        _loadMockServer: function () {
            Mockserver.load().then(function () {
                //adjust the selection to the first selected item..
                var aServices = this.getModel("mockserver").getProperty("/services");
                if (aServices.length === 0) {
                    return;
                } else {
                    this.byId("listSelect").setSelectedKey(aServices[0].name);
                    this._setSelectedService();
                    this._loadFromLocalStorage();
                }
            }.bind(this));
        },

        _setSelectedService: function () {
            this.byId("partList").setBindingContext(this.byId("listSelect").getSelectedItem().getBindingContext("mockserver"), "mockserver");
            var oSel = this.byId("listSelect").getSelectedItem().getBindingContext("mockserver").getObject();
            this._oModel.setProperty("/currentService", oSel.service);
            this.byId("entityList").setSelectedItem(this.byId("entityList").getItems()[0]);
            this.byId("entityList").fireSelectionChange();

            this._updateGenPool();
        },

        _updateGenPool: function() {
            var aPool = {};
            var oServiceSelected = this._getService();
            var oService = this.getModel("mockserver").getData().services.filter(function(e) {
                return e.serviceUrl === oServiceSelected.serviceUrl;
            })[0];
            for (var i = 0; i < oService.service.entitySet.length;i++) {
                for (var j = 0; j < oService.service.entitySet[i].attributes.length;j++) {
                    var oAttr = oService.service.entitySet[i].attributes[j];
                    if ( oAttr.generationPool && !aPool[oAttr.generationPool]) {
                        aPool[oAttr.generationPool] = oAttr;
                    }
                }
            }
            var aPoolReal = [];
            for ( var sPool in aPool ) {
                aPoolReal.push({
                    name: sPool,
                    attr: aPool[sPool]
                });
            }
            this._oModel.setProperty("/genPools", aPoolReal);
        },

        onUpdateGenPools: function(oEvent) {
            //is that a new pool?
            var oCtx = oEvent.getSource().getBindingContext("mockserver");
            var oObj = oCtx.getObject();
            var aExisting = this._oModel.getProperty("/genPools").filter(function (e) { return e.name === oObj.generationPool; });
            this._updateGenPool();
            if ( aExisting.length ) {
                var oExst = aExisting[0];
                oObj.faker = oExst.attr.faker;
                oObj.fixedValue = oExst.attr.fixedValue;
                oObj.valueGen = oExst.attr.valueGen;
                oObj.multipleValues = oExst.attr.multipleValues;
                oObj.readFormula = oExst.attr.readFormula;

                this.getModel("mockserver").setProperty(oCtx.getPath(), oObj);
            }
        },

        onServiceSelectionChange: function (oEvent) {
            this._setSelectedService(oEvent.getSource().getSelectedItem().getKey());
        },

        onSelReadEntityChange: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext("mockserver");
            this._oModel.setProperty("/currentEntityMaps", oCtx.getObject());
        },

        onPlayEntity: function (oEvent) {
            this._selectEntity(oEvent.getSource().getBindingContext("mockserver").getObject().entity.name);
            this._oModel.setProperty("/entityMode", "play");
            this.byId("tabPlay").setSelectedItem(this.byId("tabPlay").getItems()[0]);
        },

        _selectEntity: function (sEntitySet) {
            var oItems = this.byId("entityList").getItems();
            for (var i = 0; i < oItems.length; i++) {
                if (oItems[i].getBindingContext("mockserver").getObject().entity.name === sEntitySet) {
                    this.byId("entityList").setSelectedItem(oItems[i]);
                    var oCtx = this.byId("entityList").getSelectedItem().getBindingContext("mockserver");
                    this._oModel.setProperty("/currentEntityMaps", oCtx.getObject());
                    this.byId("partContent").setBindingContext(oCtx, "mockserver");
                    if (this._oModel.getProperty("/entityMode") === "play") {
                        this.onExecuteGetMultiple();
                        this._renderDetails(oItems[i].getBindingContext("mockserver").getObject(), {});
                    }
                    return;
                }
            }
        },

        onNavigateToDetails: function (oEvent) {
            this.byId("tabPlay").setSelectedItem(this.byId("tabPlay").getItems()[1]);
            var oItem = oEvent.getSource().getBindingContext("data").getObject();
            this._onLoadDetails(oItem);
        },


        onSelectionChange: function () {
            this._oModel.setProperty("/entityMode", "display");
            this.byId("partContent").setBindingContext(null, "mockserver");
            this.byId("partContent").setBindingContext(this.byId("entityList").getSelectedItem().getBindingContext("mockserver"), "mockserver");
        },

        _importDone: function (oData) {
            //apply everything to our current data
            var oDataStored = this.getModel("mockserver").getData();

            //check if the service is available currently - otherwise ignore
            var aServices = oDataStored.services.filter(function (e) { return e.serviceUrl === oData.serviceUrl; });
            if (!aServices.length) {
                return;
            }
            var oServiceStored = aServices[0];
            var oService = oData;
            oServiceStored.outdir = oService.outdir;

            for (var sEntity in oService.entitySet) {
                var aEntities = oServiceStored.service.entitySet.filter(function (e) { return e.name === sEntity; });
                if (!aEntities.length) {
                    continue;
                }
                var oEntitySetStored = aEntities[0];
                var oEntitySet = oService.entitySet[sEntity];

                oEntitySetStored.genLogic = oEntitySet.genLogic;
                oEntitySetStored.readLogic = oEntitySet.readLogic;
                oEntitySetStored.readEntitySet = oEntitySet.readEntitySet;

                for (var sAttribute in oEntitySet.attributes) {
                    var aAttributes = oEntitySetStored.attributes.filter(function (e) { return e.name === sAttribute; });
                    if (!aAttributes.length) {
                        continue;
                    }
                    var oAttributeStored = aAttributes[0];
                    var oAttribute = oEntitySet.attributes[sAttribute];

                    oAttributeStored.features = oAttribute.features;
                    if (oAttribute.features ) {
                        oAttributeStored.features = oAttribute.features;
                    }
                    if (oAttribute.faker) {
                        oAttributeStored.faker = oAttribute.faker;
                    }
                    if (oAttribute.fixedValue) {
                        oAttributeStored.fixedValue = oAttribute.fixedValue;
                    }
                    if (oAttribute.valueGen) {
                        oAttributeStored.valueGen = oAttribute.valueGen;
                    }
                    if (oAttribute.generationPool) {
                        oAttributeStored.generationPool = oAttribute.generationPool;
                    }
                    if (oAttribute.multipleValues) {
                        oAttributeStored.multipleValues = oAttribute.multipleValues;
                    }
                    if (oAttribute.readFormula) {
                        oAttributeStored.readFormula = oAttribute.readFormula;
                    }
                }
                for (var sAssociation in oEntitySet.associations) {
                    var aAssociations = oEntitySetStored.association.filter(function (e) { return e.name === sAssociation; });
                    if (!aAssociations.length) {
                        continue;
                    }
                    var oAssociationStored = aAssociations[0];
                    var oAssociation = oEntitySet.associations[sAssociation];

                    oAssociationStored.partnerEntity = oAssociation.partnerEntity;
                    oAssociationStored.refStart = oAssociation.refOwn;
                    oAssociationStored.refEnd = oAssociation.refPartner;
                    oAssociationStored.currentIsTarget = oAssociation.currentIsTarget;
                    oAssociationStored.multiplicityOwn = oAssociation.multiplicityOwn;
                    oAssociationStored.multiplicityPartner = oAssociation.multiplicityPartner;
                    oAssociationStored.toParent = oAssociation.toParent;
                    oAssociationStored.gen = oAssociation.gen;
                }
            }
            this.getModel("mockserver").setData(oDataStored);
            MessageToast.show("Applied stored settings");
        },

        _genValueMode: function (sValueGen,sFaker,sFixedValue,sMultipleValues) {
            if (sValueGen === "FKR") {
                return "Faker:" + sFaker;
            } else if (sValueGen === "FIX") {
                return "Fixed: " + sFixedValue;
            } else if (sValueGen === "FIX_MULTIPLE") {
                return "Multiple (" + sMultipleValues.length + ")";
            }
            return "";
        },

        onValueFromFixed: function (oEvent) {
            var oCtx = this._oCurrentGenSource.getBindingContext("mockserver");
            this._oFixedValueDialog.setModel(this.getModel("mockserver"), "mockserver");
            this._oFixedValueDialog.setBindingContext(oCtx, "mockserver");
            this._oFixedValueDialog.open();
        },

        onSaveFixedValue: function (oEvent) {
            var sPath = this._oFixedValueDialog.getBindingContext("mockserver").getPath();
            this.getModel("mockserver").setProperty(sPath + "/valueGen", "FIX");
            this._oFixedValueDialog.close();
        },

        onValueFromMultiple: function (oEvent) {
            this._oMultipleValueDialog.setModel(this.getModel("mockserver"), "mockserver");
            this._oMultipleValueDialog.setBindingContext(this._oCurrentGenSource.getBindingContext("mockserver"), "mockserver");
            this._oMultipleValueDialog.open();
        },

        onSaveMultipleValues: function (oEvent) {
            var sPath = this._oMultipleValueDialog.getBindingContext("mockserver").getPath();
            this.getModel("mockserver").setProperty(sPath + "/valueGen", "FIX_MULTIPLE");
            this._oMultipleValueDialog.close();
        },

        onOpenReadFormula: function (oEvent) {
            this._oFormulaDialog.setModel(this.getModel("mockserver"), "mockserver");
            this._oFormulaDialog.setBindingContext(oEvent.getSource().getBindingContext("mockserver"), "mockserver");
            this._oFormulaDialog.open();
        },

        onSaveFormula: function() {
            this._oFormulaDialog.close();
        },

        onAddFixedValue: function (oEvent) {
            var sPath = this._oMultipleValueDialog.getBindingContext("mockserver").getPath();
            var oCur = this.getModel("mockserver").getProperty(sPath);
            if (!oCur.multipleValues) {
                oCur.multipleValues = [];
            }
            oCur.multipleValues.push({
                value: "",
                weight: 100
            });
            this.getModel("mockserver").setProperty(sPath, oCur);
        },

        onDeleteFixedValues: function (oEvent) {
            var sPath = this._oMultipleValueDialog.getBindingContext("mockserver").getPath();
            var oSelected = this._oMultipleValueDialogTable.getSelectedContexts();
            if (!oSelected.length) {
                return;
            }
            var iId = oSelected[0].getPath().split("/");
            iId = parseInt(iId[iId.length - 1], 10);

            var oCur = this.getModel("mockserver").getProperty(sPath);
            oCur.multipleValues.splice(iId, 1);
            this.getModel("mockserver").setProperty(sPath, oCur);
        },

        onValueFromFaker: function (oEvent) {
            this._oFakerDialog.open();

            this._oFakerDialog.attachEventOnce("confirm", function (e) {
                var aSelected = e.getParameter("selectedContexts");
                if (aSelected.length === 0) {
                    return;
                }
                var oObj = aSelected[0].getObject();
                var sPath = this._oCurrentGenSource.getBindingContext("mockserver").getPath();
                this.getModel("mockserver").setProperty(sPath + "/faker", oObj.name);
                this.getModel("mockserver").setProperty(sPath + "/valueGen", "FKR");

            }.bind(this));
        },

        onOpenRule: function (oEvent) {
            this._oAssocGenerateDialog.setModel(this.getModel("mockserver"), "mockserver");
            this._oAssocGenerateDialog.setBindingContext(oEvent.getSource().getBindingContext("mockserver"));
            this._oAssocGenerateDialog.openBy(oEvent.getSource());
        },

        onSaveAssocGeneration: function () {
            this._oAssocGenerateDialog.close();
        },

        onOpenValueMode: function (oEvent) {
            var oSource = oEvent.getSource();
            this._oCurrentGenSource = oSource;

            // create action sheet only once
            if (!this._oSelectActionSheet) {
                this._oSelectActionSheet = sap.ui.xmlfragment(
                    "com.ui5.testing.fragment.ValueSelectionActionSheet",
                    this
                );
                this.getView().addDependent(this._oSelectActionSheet);
            }

            this._oSelectActionSheet.openBy(oSource);
        },

        _getLocalStorageUrl : function() {
            var sSrc = "mock_" + this._getServiceUrl();
            return sSrc;
        },

        onSave: function (oEvent) {
            var oResult = this._getExportResult();

            var oStore = {};
            oStore[this._getLocalStorageUrl()] = JSON.stringify(oResult);
            ChromeStorage.set({
                key: this._getLocalStorageUrl(),
                data: JSON.stringify(oResult),
                success: function(){
                    MessageToast.show("Saved in local Storage");
                }
            })
            /* left until refactoring is finished
            chrome.storage.local.set(oStore, function () {
                MessageToast.show("Saved in local Storage");
            });*/
        },

        _loadFromLocalStorage: function() {
            var storageUrl = this._getLocalStorageUrl();
            ChromeStorage.get({
                key: storageUrl,
                success: function(items) {
                    if (!items[storageUrl]) {
                        return;
                    }

                    this._importDone(JSON.parse(items[storageUrl]) );
                }.bind(this)
            });
            /*
            chrome.storage.local.get([this._getLocalStorageUrl()], function (items) {
                if (!items[this._getLocalStorageUrl()]) {
                    return;
                }

                this._importDone(JSON.parse(items[this._getLocalStorageUrl()]) );
            }.bind(this));*/
        },

        _getExportResult: function() {
            var oData = this.getModel("mockserver").getData();
            var oBackup = Mockserver.getBackup();
            oData = JSON.parse(JSON.stringify(oData));

            var oResult = {};
            var sCurrentServiceUrl = this._getServiceUrl();

            for (var i = 0; i < oData.services.length; i++) {
                var oService = oData.services[i];
                var oBackupService = oBackup.services[i];

                if (oService.serviceUrl !== sCurrentServiceUrl ) {
                    continue;
                }

                oResult = {
                    serviceUrl: oService.serviceUrl,
                    outdir: oService.outdir,
                    componentName: oService.componentName,
                    modulePath: oService.modulePath,
                    entitySet: {}
                };
                for (var j = 0; j < oService.service.entitySet.length; j++) {
                    var oEntitySet = oService.service.entitySet[j];
                    var oEntitySetBackup = oBackupService.service.entitySet[j];
                    var oSaveEntity = {
                        attributes: {},
                        associations: {}
                    };

                    if (oEntitySetBackup.genLogic !== oEntitySet.genLogic) {
                        oSaveEntity.genLogic = oEntitySet.genLogic;
                    }

                    if (oEntitySetBackup.readLogic !== oEntitySet.readLogic) {
                        oSaveEntity.readLogic = oEntitySet.readLogic;
                    }

                    if (oEntitySetBackup.readEntitySet !== oEntitySet.readEntitySet) {
                        oSaveEntity.readEntitySet = oEntitySet.readEntitySet;
                    }


                    if (oEntitySetBackup.readEntitySet !== oEntitySet.readEntitySet) {
                        oSaveEntity.readEntitySet = oEntitySet.readEntitySet;
                    }

                    if (oEntitySet.association) {
                        for (var x = 0; x < oEntitySet.association.length; x++) {
                            var oAssoc = oEntitySet.association[x];
                            var oAssocBackup = oEntitySetBackup.association[x];

                            if (oAssoc.adjusted === true ||
                                !($(oAssoc.refStart).not(oAssocBackup.refStart).length === 0 && $(oAssocBackup.refStart).not(oAssoc.refStart).length === 0) ||
                                !($(oAssoc.refEnd).not(oAssocBackup.refEnd).length === 0 && $(oAssocBackup.refEnd).not(oAssoc.refEnd).length === 0)) {
                                oSaveEntity.associations[oAssoc.name] = {
                                    name: oAssoc.name,
                                    partnerEntity: oAssoc.partnerEntity,
                                    refOwn: oAssoc.refStart,
                                    refPartner: oAssoc.refEnd,
                                    toParent: oAssoc.toParent,
                                    multiplicityOwn: oAssoc.multiplicityOwn,
                                    multiplicityPartner: oAssoc.multiplicityPartner,
                                    gen: oAssoc.gen
                                };
                            }
                        }
                    }
                    for (var x = 0; x < oEntitySet.attributes.length; x++) {
                        var oProp = oEntitySet.attributes[x];
                        var oPropBackup = oEntitySetBackup.attributes[x];
                        if (!($(oProp.features).not(oPropBackup.features).length === 0 && $(oPropBackup.features).not(oProp.features).length === 0)) {
                            oSaveEntity.attributes[oProp.name] = {};
                            if (oProp.features) {
                                oSaveEntity.attributes[oProp.name].features = oProp.features;
                            }
                        }

                        if (oProp.changeIndicator !== oPropBackup.changeIndicator) {
                            oSaveEntity.attributes[oProp.name] = oSaveEntity.attributes[oProp.name] || {};
                            oSaveEntity.attributes[oProp.name].changeIndicator = oProp.changeIndicator;
                        }

                        if (oProp.faker !== oPropBackup.faker) {
                            oSaveEntity.attributes[oProp.name] = oSaveEntity.attributes[oProp.name] || {};
                            oSaveEntity.attributes[oProp.name].faker = oProp.faker;
                        }

                        if (oProp.generationPool !== oPropBackup.generationPool) {
                            oSaveEntity.attributes[oProp.name] = oSaveEntity.attributes[oProp.name] || {};
                            oSaveEntity.attributes[oProp.name].generationPool = oProp.generationPool;
                        }

                        if (oProp.valueGen !== oPropBackup.valueGen) {
                            oSaveEntity.attributes[oProp.name] = oSaveEntity.attributes[oProp.name] || {};
                            oSaveEntity.attributes[oProp.name].valueGen = oProp.valueGen;
                        }

                        if (oProp.fixedValue !== oPropBackup.fixedValue) {
                            oSaveEntity.attributes[oProp.name] = oSaveEntity.attributes[oProp.name] || {};
                            oSaveEntity.attributes[oProp.name].fixedValue = oProp.fixedValue;
                        }

                        if (oProp.readFormula !== oPropBackup.readFormula) {
                            oSaveEntity.attributes[oProp.name] = oSaveEntity.attributes[oProp.name] || {};
                            oSaveEntity.attributes[oProp.name].readFormula = oProp.readFormula;
                        }

                        if (!($(oProp.multipleValues).not(oPropBackup.multipleValues).length === 0 && $(oPropBackup.multipleValues).not(oProp.multipleValues).length === 0)) {
                            oSaveEntity.attributes[oProp.name] = oSaveEntity.attributes[oProp.name] || {};
                            oSaveEntity.attributes[oProp.name].multipleValues = oProp.multipleValues;
                        }
                    }
                    oResult.entitySet[oEntitySet.name] = oSaveEntity;
                }
            }

            return oResult;
        },

        onExport: function () {
            var oResult = this._getExportResult();
            //remove data, which is not applicable for exporting..
            var vLink = document.createElement('a'),
                vBlob = new Blob([JSON.stringify(oResult, null, 2)], { type: "octet/stream" }),
                vName = 'mockconfig.json',
                vUrl = window.URL.createObjectURL(vBlob);
            vLink.setAttribute('href', vUrl);
            vLink.setAttribute('download', vName);
            vLink.click();
        },

        onGoToEntity: function (oEvent) {
            var oObj = oEvent.getSource().getBindingContext("mockserver").getObject();
            this._selectEntity(oObj.partnerEntity);
        },

        onAddAttribute: function (oEvent) {
            var sPath = oEvent.getSource().getBindingContext("mockserver").getPath();
            var oObj = this.getModel("mockserver").getProperty(sPath);
            oObj.attributes.push({
                changeIndicator: "C"
            });
            this.getModel("mockserver").setProperty(sPath, oObj);
        },

        onRemoveAttribute: function (oEvent) {
            var oSel = this.byId("tblAttr").getSelectedContexts();
            if (!oSel.length) {
                return;
            }
            oSel = oSel[0];
            var iId = oSelected[0].getPath().split("/");
            iId = parseInt(iId[iId.length - 1], 10);

            var sPath = oEvent.getSource().getBindingContext("mockserver").getPath();
            var oObj = this.getModel("mockserver").getProperty(sPath);
            if (oSel.getObject().changeIndicator === "C") {
                oObj.attributes.splice(iId, 1);
            } else {
                oObj.attributes[iId].changeIndicator = "D";
            }
            this.getModel("mockserver").setProperty(sPath, oObj);
        },

        onFilterFaker: function (oEvent) {
            var sSearch = oEvent.getParameter("newValue") || oEvent.getParameter("value");
            if (!sSearch || !sSearch.length) {
                this._oFakerDialog.getBinding("items").filter([]);
            } else {
                this._oFakerDialog.getBinding("items").filter([
                    new sap.ui.model.Filter({
                        and: false,
                        filters: [
                            new sap.ui.model.Filter({
                                path: "name",
                                operator: sap.ui.model.FilterOperator.Contains,
                                value1: sSearch
                            })]
                    })
                ]);
            }
        },

        onApplyLogicIdToAll: function (oEvent) {
            var oObj = oEvent.getSource().getBindingContext("mockserver").getObject();
            //apply that to all parents..
            var aPath = oEvent.getSource().getBindingContext("mockserver").getPath().split("/");
            aPath.pop();
            aPath.pop();
            var oCtx = this.getModel("mockserver").getContext(aPath.join("/"));
            var oTarget = oCtx.getObject();
            for (var i = 0; i < oTarget.entitySet.length; i++) {
                oTarget.entitySet[i].genLogic = oObj.genLogic;
            }
            this.getModel("mockserver").setProperty(oCtx.getPath(), oTarget);
        },

        _getServiceUrl: function () {
            return this.byId("listSelect").getSelectedItem().getBindingContext("mockserver").getObject().serviceUrl;
        },

        _getService: function () {
            return this.byId("listSelect").getSelectedItem().getBindingContext("mockserver").getObject();
        },

        _getSelectedEntity: function () {
            return this.byId("partContent").getBindingContext("mockserver").getObject();
        },

        _onLoadDetails: function (oItem) {
            var oEntitySet = this._getSelectedEntity();
            var oModel = Mockserver.getServiceModel(this._getServiceUrl());

            var oKeyValue = {};
            for (var i = 0; i < oEntitySet.attributes.length; i++) {
                if (oEntitySet.attributes[i].isKey === true) {
                    oKeyValue[oEntitySet.attributes[i].name] = oItem[oEntitySet.attributes[i].name];
                }
            }

            var oUrlParameters = {};
            if (oEntitySet.association) {
                var aExpand = [];
                for (var i = 0; i < oEntitySet.association.length; i++) {
                    aExpand.push(oEntitySet.association[i].name);
                }
                oUrlParameters["$expand"] = aExpand.join(",");
            }

            var sKey = oModel.createKey("/" + oEntitySet.name, oKeyValue);
            oModel.read(sKey, {
                urlParameters: oUrlParameters,
                success: function (e) {
                    this._oSingleContext = oModel.getContext(sKey);
                    this._renderDetails(oEntitySet, e);
                }.bind(this)
            });
        },

        _onNavToNavProperty: function (oEvent) {
            var oTarget = oEvent.getSource().getBindingContext("data").getObject();

            //get the assoc from the current entity..
        },

        _renderDetails: function (oEntitySet, oEntity) {
            var oVBox = this.byId("singleContent");
            var oService = this._getService();
            oVBox.destroyItems();
            var oJSON = new sap.ui.model.json.JSONModel(oEntity);
            oVBox.setModel(oJSON, "data");

            //add single Form first..
            var aContent = [];
            for (var i = 0; i < oEntitySet.attributes.length; i++) {
                aContent.push(
                    new sap.m.Label({ text: oEntitySet.attributes[i].name })
                );
                aContent.push(
                    this._getInputFromColumn(oEntitySet, oEntitySet.attributes[i].name)
                );
            }
            var oSimpleForm = new sap.ui.layout.form.SimpleForm({ editable: true, layout: "ColumnLayout", columnsM: 2, columnsL: 3, columnsXL: 4, content: aContent });
            var oPanel = new sap.m.Panel({
                expandable: true,
                expanded: true,
                width: "auto",
                headerToolbar: new sap.m.Toolbar({
                    height: "3rem",
                    content: [
                        new sap.m.Title({ titleStyle: "H5", text: "Details" }),
                    ]
                })
            });
            oPanel.addContent(oSimpleForm);
            oVBox.addItem(oPanel);

            //next: add the grid tables for all of our fancy associations...
            for (var i = 0; i < oEntitySet.association.length; i++) {
                var oAssoc = oEntitySet.association[i];
                var oEntitySetPartner = oService.service.entitySet.filter(function (e) { return e.entity.name === oAssoc.partnerEntity; })[0];
                var oProp = oJSON.getProperty("/" + oAssoc.name);
                var sTitle = oAssoc.name;
                if (oAssoc.multiplicityPartner === "1" || oAssoc.multiplicityPartner === "0..1") {
                    if (!oProp) {
                        sTitle += " (NULL)";
                    }
                } else if (!oProp) {
                    if (!oProp) {
                        sTitle += " (NULL)";
                    }
                } else {
                    sTitle += " (" + oProp.results.length + ")";
                }

                var oPanel = new sap.m.Panel({
                    expandable: true,
                    expanded: false,
                    width: "auto",
                    headerToolbar: new sap.m.Toolbar({
                        height: "3rem",
                        content: [
                            new sap.m.Title({ titleStyle: "H5", text: sTitle }),
                        ]
                    })
                });

                //depending if we are a "multi" association, render a grid table or a simple form..
                if (oProp) {
                    if (oAssoc.multiplicityPartner === "1" || oAssoc.multiplicityPartner === "0..1") {
                        oPanel.getHeaderToolbar().addContent(
                            new sap.m.Button({
                                icon: "sap-icon://navigation-right-arrow", press: function (oAssoc) {
                                    var oObj = oJSON.getProperty("/" + oAssoc.name);
                                    this._selectEntity(oAssoc.partnerEntity);
                                    this._onLoadDetails(oObj);
                                }.bind(this, oAssoc)
                            })
                        );

                        var oSimpleForm = new sap.ui.layout.form.SimpleForm({ editable: true, layout: "ColumnLayout", columnsM: 2, columnsL: 3, columnsXL: 4 });
                        for (var j = 0; j < oEntitySetPartner.attributes.length; j++) {
                            oSimpleForm.addContent(
                                new sap.m.Label({ text: oEntitySetPartner.attributes[j].name })
                            );
                            oSimpleForm.addContent(
                                new sap.m.Input({ value: "{data>/" + oAssoc.name + "/" + oEntitySetPartner.attributes[j].name + "}" })
                            );
                        }
                        oPanel.addContent(oSimpleForm);
                    } else {
                        var oTable = new sap.ui.table.Table({ alternateRowColors: true, showColumnVisibilityMenu: true, rowActionCount: 1, visibleRowCount: 10, width: "100%" });
                        oTable.setBindingContext(oJSON.getContext("/" + oAssoc.name + "/results/"), "data");
                        for (var j = 0; j < oEntitySetPartner.attributes.length; j++) {
                            oTable.addColumn(
                                new sap.ui.table.Column({
                                    label: new sap.m.Label({ text: oEntitySetPartner.attributes[j].name }),
                                    template: new sap.m.Text({
                                        text: {
                                            path: "data>" + oEntitySetPartner.attributes[j].name,
                                        }
                                    })
                                })
                            );

                            oTable.setRowActionTemplate(new sap.ui.table.RowAction({
                                items: [
                                    new sap.ui.table.RowActionItem({
                                        type: "Navigation", press: function (oAssoc, oEvent) {
                                            var oObj = oEvent.getSource().getBindingContext("data").getObject();
                                            this._selectEntity(oAssoc.partnerEntity);
                                            this._onLoadDetails(oObj);
                                        }.bind(this, oAssoc)
                                    })
                                ]
                            }));
                        }

                        oTable.bindRows("data>/" + oAssoc.name + "/results/");
                        oPanel.addContent(oTable);
                    }
                }
                oVBox.addItem(oPanel);
            }
        },

        onCreateEntry: function (oEvent) {
            var oModel = Mockserver.getServiceModel(this._getServiceUrl());
            //reduce on the relevant attributes, without navigation attributes, to avoid a DEEP Update..
            var oEntity = this._getSelectedEntity();
            var oData = this.byId("singleContent").getModel("data").getProperty("/");
            oModel.create("/" + oEntity.name, oData, {
                success: function () {
                    //reload data..
                    this._onLoadDetails(oData);
                    MessageToast.show("Create Successful...");
                }.bind(this),
                error: function (e) {
                    MessageToast.show("Failure during create...");
                }
            });
        },

        onUpdateEntry: function (oEvent) {
            var oModel = Mockserver.getServiceModel(this._getServiceUrl());
            var oCtx = this._oSingleContext;
            //reduce on the relevant attributes, without navigation attributes, to avoid a DEEP Update..
            var oEntity = this._getSelectedEntity();
            var oData = this.byId("singleContent").getModel("data").getProperty("/");
            var oUpdate = {};
            for (var i = 0; i < oEntity.attributes.length; i++) {
                oUpdate[oEntity.attributes[i].name] = oData[oEntity.attributes[i].name];
            }
            oModel.update(oCtx.getPath(), oUpdate, {
                success: function () {
                    //reload data..
                    this._onLoadDetails(oUpdate);
                    MessageToast.show("Update Successful...");
                }.bind(this),
                error: function (e) {
                    MessageToast.show("Failure during update...");
                }
            });
        },

        onDeleteEntry: function (oEvent) {
            //delete the currently selected entry..
            var oModel = Mockserver.getServiceModel(this._getServiceUrl());
            var oCtx = this._oSingleContext;
            oModel.remove(oCtx.getPath(), {
                success: function () {
                    this.byId("tabPlay").setSelectedItem(this.byId("tabPlay").getItems()[0]);
                    this.onExecuteGetMultiple();
                    MessageToast.show("Removal Successful...");
                }.bind(this),
                error: function () {
                    MessageToast.show("Error during update...");
                }
            });
        },

        _optimizeColWidth: function (oTable) {
            var iLength = oTable.getColumns().length;
            for (var i = iLength - 1; i >= 0; i--) {
                oTable.autoResizeColumn(i);
            }
        },

        _getTypeFromColumn: function (oEntitySet, sCol) {
            var oCol = oEntitySet.attributes.filter(function (e) { return e.name === sCol; })[0];
            switch (oCol.type) {
                case "Edm.DateTime": {
                    return new sap.ui.model.type.DateTime();
                }
                default: {
                    return null;
                }
            }
        },

        _getInputFromColumn: function (oEntitySet, sCol) {
            var oCol = oEntitySet.attributes.filter(function (e) { return e.name === sCol; })[0];
            var oType = this._getTypeFromColumn(oEntitySet, sCol);
            switch (oCol.type) {
                case "Edm.DateTime": {
                    return new sap.m.DateTimePicker({ dateValue: "{data>/" + oCol.name + "}" });
                }
                default: {
                    return new sap.m.Input({ value: "{data>/" + oCol.name + "}" });
                }
            }
        },

        onExecuteGetMultiple: function (oEvent) {
            var oEntitySet = this._getSelectedEntity();
            var oModel = Mockserver.getServiceModel(this._getServiceUrl());

            var oTable = this.byId("previewResults");
            oTable.setModel(oModel, "data");
            oTable.bindRows("data>/" + oEntitySet.name);

            var aCols = oTable.getColumns();
            for (var i = 0; i < aCols.length; i++) {
                var sBindingPath = "data>" + aCols[i].getFilterProperty();

                aCols[i].setTemplate(
                    new sap.m.Text({
                        wrapping: false,
                        text: {
                            type: this._getTypeFromColumn(oEntitySet, aCols[i].getFilterProperty()),
                            path: sBindingPath
                        }
                    }));
            }

            oTable.getBinding("rows").attachEvent("change", function () {
                this._optimizeColWidth(oTable);
            }.bind(this));
        },

        _createViewModel: function () {
            var oJSON = {
                addToBatch: false,
                multiplicity: [{ name: "0" }, { name: "1" }, { name: "*" }, { name: "0..1" }],
                features: [{
                    feature: "Last-Change-Date",
                    featureId: "lastchanged"
                }, {
                    feature: "Creation Date",
                    featureId: "createdAt"
                }, {
                    feature: "Number-Range Generator",
                    featureId: "numberRangeGenerator"
                }, {
                    feature: "Digit-Sequence",
                    featureId: "numericDigit"
                }],
                entityMode: "display",

                functionImport: [{
                    function: "Random Entity/Set",
                    functionId: "random"
                }, {
                    function: "Fixed Data",
                    functionId: "fixed"
                }, {
                    function: "Event/Custom Implementation",
                    functionId: "custom"
                }],
                genPools: [],

                genLogic: [{
                    genLogicId: "backend",
                    genLogic: "Backend"
                }, {
                    genLogicId: "generate",
                    genLogic: "Generate"
                }, {
                    genLogicId: "generateEmpty",
                    genLogic: "Generate Empty File"
                }, {
                    genLogicId: "fixed",
                    genLogic: "Fixed"
                }],
                readLogic: [{
                    readLogicId: "standard",
                    readLogic: "Standard"
                }, {
                    readLogicId: "fromOther",
                    readLogic: "From Other Entity-Set(s)"
                }, {
                    readLogicId: "custom",
                    readLogic: "Event/Custom Implementation"
                }],
                faker: []
            };
            var aFaker = [];
            var aRelevant = ["address", "commerce", "company", "database", "date", "finance", "hacker", "helpers", "image", "internet", "lorem", "name", "phone", "random", "system"];
            for (var i = 0; i < aRelevant.length; i++) {
                for (var sMethod in faker[aRelevant[i]]) {
                    try {
                        var sSampleValue = faker[aRelevant[i]][sMethod]();
                        sSampleValue = sSampleValue.toString();
                        if (sSampleValue.length > 30) {
                            sSampleValue = sSampleValue.substr(0, 25) + "(..)";
                        }
                    } catch (e) {
                        sSampleValue = "";
                    }
                    aFaker.push({
                        name: aRelevant[i] + "." + sMethod,
                        exampleValue: sSampleValue
                    });
                }
            }
            oJSON.faker = aFaker;

            var oModel = new JSONModel(oJSON);
            oModel.setSizeLimit(100000);
            return oModel;
        }
    });
});