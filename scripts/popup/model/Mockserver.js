sap.ui.define([
    "sap/ui/base/Object",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/odata/v2/ODataModel",
    "com/ui5/testing/model/Communication"
], function (UI5Object, JSONModel, ODataModel, Communication) {
    "use strict";

    var Mockserver = UI5Object.extend("com.ui5.testing.model.Mockserver", {
        constructor: function () {
            var oJSON = {
            };

            this._oFakerSettings = {
                "city": "address.city",
                "country": "address.country",
                "geo-lat": "address.latitude",
                "geo-lon": "address.longitude",
                "region": "address.state",
                "street": "address.streetAddress",
                "zip": "address.zipCode",
                "org": "company.companyName",
                "currency-code": "finance.currencyCode",
                "photo": "internet.email",
                "bcc": "internet.email",
                "cc": "internet.email",
                "email": "internet.email",
                "from": "internet.email",
                "sender": "internet.email",
                "to": "internet.email",
                "url": "internet.url",
                "body": "lorem.paragraphs",
                "subject": "lorem.sentence",
                "name": "name.findName",
                "givenname": "name.firstName",
                "middlename": "name.firstName",
                "title": "name.jobTitle",
                "familyname": "name.lastName",
                "honorific": "name.prefix",
                "suffix": "name.suffix",
                "tel": "phone.phoneNumber"
            };

            this._oModel = new JSONModel(oJSON);
            this._oViewModel = new JSONModel({ components: [] });
            this._oServiceUrls = {};
            this._oSearchDialog = sap.ui.xmlfragment(
                "com.ui5.testing.fragment.SelectComponent",
                this
            );
            this._oSearchDialog.setModel(this._oViewModel, "viewModel");
        }
    });

    Mockserver.prototype._selectFromComponents = function (aComponents) {
        return new Promise(function (resolve, reject) {
            this._oSearchDialog.open();
            this._oViewModel.setProperty("/components", aComponents);
            this._oSearchDialog.attachEventOnce("confirm", function (e) {
                var aSelected = e.getParameter("selectedContexts");
                if (aSelected.length === 0) {
                    reject();
                } else {
                    resolve(aSelected[0].getObject());
                }
            }.bind(this));
        }.bind(this));
    };

    Mockserver.prototype.load = function () {
        return new Promise(function (resolve, reject) {
            Communication.fireEvent("mockserver").then(function (e) {
                var aComponents = [];
                for (var sComponent in e) {
                    aComponents.push({
                        name: sComponent
                    });
                }
                if (aComponents.length === 1) {
                    this._setDataFromReturn(e[aComponents[0].name]).then(function () {
                        resolve();
                    })
                } else {
                    this._selectFromComponents(aComponents).then(function (comp) {
                        this._setDataFromReturn(e[comp.name]).then(function () {
                            resolve();
                        })
                    }.bind(this), reject);
                }
            }.bind(this));
        }.bind(this));
    };

    Mockserver.prototype._initializeODataModel = function (oMetadata, oStoredData) {
        return new Promise(function (resolve, reject) {
            var iPromises = oMetadata.services.length;
            for (var i = 0; i < oMetadata.services.length; i++) {
                var sServiceUrl = oMetadata.services[i].serviceUrl;
                if (this._oServiceUrls[sServiceUrl]) {
                    iPromises -= 1;
                    continue;
                }
                this._oServiceUrls[sServiceUrl] = new ODataModel(sServiceUrl);
                this._oServiceUrls[sServiceUrl].metadataLoaded().then(function (oBound) {
                    this._getMetaModelFromManifest(this._oServiceUrls[oBound.sServiceUrl], oMetadata.services[oBound.iIndex]).then(function (oBound, oData) {
                        oMetadata.services[oBound.iIndex].service = oData;
                        iPromises -= 1;
                        if (iPromises <= 0) {
                            resolve();
                        }
                    }.bind(this, oBound));
                }.bind(this, { iIndex: i, sServiceUrl: sServiceUrl }));
            }
            if (iPromises <= 0) {
                resolve();
            }
        }.bind(this));
    };

    Mockserver.prototype._setDataFromReturn = function (oMetadata, oStoredData) {
        //preformat the data for easier consumption, and add the "formatters"
        ///services/0/service/entitySet/4
        oStoredData = typeof oStoredData === "undefined" ? {} : oStoredData;

        return new Promise(function (resolve, reject) {

            this._initializeODataModel(oMetadata, oStoredData).then(function () {
                for (var iService = 0; iService < oMetadata.services.length; iService++) {
                    var oService = oMetadata.services[iService];
                    for (var j = 0; j < oService.service.entitySet.length; j++) {
                        var oEntitySet = oService.service.entitySet[j];
                        oEntitySet.attributes = oStoredData.attributes ? oStoredData.attributes : [];
                        oEntitySet.association = oStoredData.association ? oStoredData.association : [];
                        oEntitySet.genLogic = "backend";
                        oEntitySet.readLogic = "standard";

                        //---- navigation associations.. clean up..

                        if (oEntitySet.entity.navigationProperty) {
                            for (var x = 0; x < oEntitySet.entity.navigationProperty.length; x++) {
                                var oNavProp = oEntitySet.entity.navigationProperty[x];
                                var sMultiplicity = "";

                                var sEntityPartner = "";
                                var sRefConstraintAttribute = "";
                                var bCurrentIsTarget = false;
                                var sMultiplicityOwn = "";
                                var sMultiplictyPartner = "";
                                if (oEntitySet.entity.namespace + "." + oEntitySet.entity.name === oNavProp.association.end[0].type) {
                                    sEntityPartner = oNavProp.association.end[1].type;
                                    sRefConstraintAttribute = oNavProp.association.end[1].role;
                                    sMultiplicity = oNavProp.association.end[0].multiplicity + "/" + oNavProp.association.end[1].multiplicity;
                                    sMultiplicityOwn = oNavProp.association.end[0].multiplicity;
                                    sMultiplictyPartner = oNavProp.association.end[1].multiplicity;
                                } else {
                                    sEntityPartner = oNavProp.association.end[0].type;
                                    sRefConstraintAttribute = oNavProp.association.end[0].role;
                                    sMultiplicity = oNavProp.association.end[1].multiplicity + "/" + oNavProp.association.end[0].multiplicity;
                                    sMultiplicityOwn = oNavProp.association.end[1].multiplicity;
                                    sMultiplictyPartner = oNavProp.association.end[0].multiplicity;
                                    bCurrentIsTarget = true;
                                }
                                if (sEntityPartner.indexOf(oEntitySet.entity.namespace) !== -1) {
                                    sEntityPartner = sEntityPartner.substr(oEntitySet.entity.namespace.length + 1);
                                }

                                //get the relevant information from the partner, for later on easier model view binding..
                                var oRefEntity = null;
                                for (var y = 0; y < oService.service.entitySet.length; y++) {
                                    if (oService.service.entitySet[y].entity.name === sEntityPartner) {
                                        oRefEntity = oService.service.entitySet[y].entity;
                                        break;
                                    }
                                }

                                //define POSSIBLE relations, for our combobox (not necassarily same name..)
                                //for "..1" relations, in general the value is always a key..
                                var aPossibleStart = [];
                                var aPossibleEnd = [];
                                var aPossibleStartF = [];
                                var aPossibleEndF = [];
                                if (sMultiplicityOwn === "1") {
                                    aPossibleStart = JSON.parse(JSON.stringify(oEntitySet.entity.key.propertyRef));
                                    aPossibleStartF = JSON.parse(JSON.stringify(oEntitySet.entity.property));
                                } else {
                                    aPossibleStart = JSON.parse(JSON.stringify(oEntitySet.entity.property));
                                    aPossibleStartF = JSON.parse(JSON.stringify(oEntitySet.entity.property));
                                }
                                if (sMultiplictyPartner === "1") {
                                    aPossibleEnd = JSON.parse(JSON.stringify(oRefEntity.key.propertyRef));
                                    aPossibleEndF = JSON.parse(JSON.stringify(oRefEntity.property));
                                } else {
                                    aPossibleEnd = JSON.parse(JSON.stringify(oRefEntity.property));
                                    aPossibleEndF = JSON.parse(JSON.stringify(oRefEntity.property));
                                }

                                //add the referential constraints..
                                var aOwnReferentialConstraints = [];
                                var aOtherReferentialConstraints = [];
                                var bAdjusted = false;
                                if (oNavProp.association.referentialConstraint) {
                                    for (var sConstraintType in oNavProp.association.referentialConstraint) {
                                        if (oNavProp.association.referentialConstraint[sConstraintType].role === sRefConstraintAttribute) {
                                            for (var y = 0; y < oNavProp.association.referentialConstraint[sConstraintType].propertyRef.length; y++) {
                                                aOtherReferentialConstraints.push(oNavProp.association.referentialConstraint[sConstraintType].propertyRef[y].name);
                                            }
                                        } else {
                                            for (var y = 0; y < oNavProp.association.referentialConstraint[sConstraintType].propertyRef.length; y++) {
                                                aOwnReferentialConstraints.push(oNavProp.association.referentialConstraint[sConstraintType].propertyRef[y].name);
                                            }
                                        }
                                    }
                                } else {
                                    //try to generate, from identical IDs..
                                    for (var y = 0; y < aPossibleStart.length; y++) {
                                        if (aPossibleEnd.filter(function (f) { return f.name === aPossibleStart[y].name }).length > 0) {
                                            aOwnReferentialConstraints.push(aPossibleStart[y].name);
                                            aOtherReferentialConstraints.push(aPossibleStart[y].name);
                                        }
                                    }
                                    bAdjusted = true;
                                }

                                //ensure that possibles, are at least including the constraints (even though ofc incorrect metadata..)
                                for (var y = 0; y < aOwnReferentialConstraints.length; y++) {
                                    if (aPossibleStart.filter(function (f) { return f.name === aOwnReferentialConstraints[y] }).length === 0) {
                                        if (aPossibleStartF.filter(function (f) { return f.name === aOwnReferentialConstraints[y] }).length === 0) {
                                            aOwnReferentialConstraints.splice(y, 1);
                                            bAdjusted = true;
                                        } else {
                                            aPossibleStart = aPossibleStartF;
                                        }
                                    }
                                }
                                for (var y = 0; y < aOtherReferentialConstraints.length; y++) {
                                    if (aPossibleEnd.filter(function (f) { return f.name === aOtherReferentialConstraints[y] }).length === 0) {
                                        if (aPossibleEndF.filter(function (f) { return f.name === aOtherReferentialConstraints[y] }).length === 0) {
                                            aOtherReferentialConstraints.splice(y, 1);
                                            bAdjusted = true;
                                        } else {
                                            aPossibleEnd = aPossibleEndF;
                                        }
                                    }
                                }

                                //remove navigation attributes in associations (wtf?)
                                for (var y = 0; y < aOwnReferentialConstraints.length; y++) {
                                    if (oEntitySet.entity.navigationProperty.filter(function (f) { return f.name === aOwnReferentialConstraints[y] }).length > 0) {
                                        aOwnReferentialConstraints.splice(y, 1);
                                        bAdjusted = true;
                                    }
                                }
                                for (var y = 0; y < aOwnReferentialConstraints.length; y++) {
                                    if (!oRefEntity.navigationProperty) {
                                        continue;
                                    }
                                    if (oRefEntity.navigationProperty.filter(function (f) { return f.name === aOwnReferentialConstraints[y] }).length > 0) {
                                        aOwnReferentialConstraints.splice(y, 1);
                                        bAdjusted = true;
                                    }
                                }

                                //try to identify if we are parent, or if we are child
                                //for one --> one relation ships that is not always 100% clear
                                var bToParent = sMultiplictyPartner === "1" && (sMultiplicityOwn === "0..1" || sMultiplicityOwn === "*" );

                                oEntitySet.association.push({
                                    name: oNavProp.name,
                                    multiplicity: sMultiplicity,
                                    partnerEntity: sEntityPartner,
                                    refStart: aOwnReferentialConstraints,
                                    refEnd: aOtherReferentialConstraints,
                                    possibleStart: aPossibleStart,
                                    possibleEnd: aPossibleEnd,
                                    refEntity: oRefEntity,
                                    toParent: bToParent,
                                    multiplicityOwn: sMultiplicityOwn,
                                    multiplicityPartner: sMultiplictyPartner,
                                    currentIsTarget: bCurrentIsTarget,
                                    gen: {
                                        atLeast: 0,
                                        atMost: 0
                                    },
                                    adjusted: bAdjusted
                                });
                            }
                        }

                        oEntitySet.associationLength = oEntitySet.association.length;
                        oEntitySet.attributeLength = oEntitySet.entity.property.length;

                        //(1): remove those attributes, which are not existing anymore..
                        for (var x = 0; x < oEntitySet.attributes.length; x++) {
                            if (oMetadata.entity.property.filter(function (e) { return e.name === oEntitySet.attributes[x].name; }).length === 0) {
                                oEntitySet.attributes.splice(x, 1);
                                x = x - 1;
                            }
                        }

                        //(2) add the new attributes..
                        for (var x = 0; x < oEntitySet.entity.property.length; x++) {
                            var oAttr = oEntitySet.entity.property[x];
                            var aFound = oEntitySet.attributes.filter(function (e) { return e.name === oAttr.name; });
                            if (aFound.length === 0) {
                                oEntitySet.attributes.push({
                                    name: oAttr.name
                                });
                                aFound = oEntitySet.attributes.filter(function (e) { return e.name === oAttr.name; });
                            }
                            var oFound = aFound[0];
                            oFound.type = oAttr.type;
                            if (oAttr.maxLength) {
                                oFound.type += "(" + oAttr.maxLength + ")";
                            }
                            oFound.isKey = oEntitySet.entity.key.propertyRef.filter(function (e) { return e.name === oAttr.name; }).length !== 0;

                            var sFakerSettings = "";
                            if (oAttr.type === "Edm.String") {
                                sFakerSettings = "random.word";
                            } else if (oAttr.type === "Edm.Boolean") {
                                sFakerSettings = "random.boolean";
                            } else if (oAttr.type === "Edm.Decimal" || oAttr.type == "Edm.Double" || oAttr.type === "Edm.Float") {
                                sFakerSettings = "random.number";
                            } else if (oAttr.type === "Edm.DateTime") {
                                sFakerSettings = "date.past"
                            } else if (oAttr.type === "Edm.Int16" || oAttr.type === "Edm.Int32" || oAttr.type === "Edm.Int64") {
                                sFakerSettings = "random.number"
                            } else {
                                sFakerSettings = "random.word";
                            }

                            //check if we are generated?
                            oFound.features = [];
                            if (oAttr["Org.OData.Core.V1.Computed"] && oAttr["Org.OData.Core.V1.Computed"].Bool === "true") {
                                //we are most likely a number generator..
                                var sLower = oAttr.name.toLowerCase();
                                if (sLower.indexOf("lastchanged") !== -1 || sLower.indexOf("lchg") !== -1) {
                                    oFound.features.push("lastchanged");
                                } else if (sLower.indexOf("crea") !== -1) {
                                    oFound.features.push("createdAt");
                                }
                            }

                            if (oAttr["com.sap.vocabularies.Common.v1.IsDigitSequence"] && oAttr["com.sap.vocabularies.Common.v1.IsDigitSequence"].Bool === "true") {
                                oFound.features.push("numericDigit");
                                sFakerSettings = "random.number";
                            }
                            if (oAttr["sap-semantics"]) {
                                if (this._oFakerSettings[oAttr["sap-semantics"]]) {
                                    sFakerSettings = this._oFakerSettings[oAttr["sap-semantics"]];
                                }
                            }
                            oFound.changeIndicator = '';
                            oFound.faker = sFakerSettings;
                            oFound.valueGen = "FKR";
                            oFound.readFormula = "CURRENT_FIELD";
                            oFound.fixedValue = "";
                            oFound.generationPool = "GLOBAL";
                            oFound.multipleValues = [];
                        }
                        oEntitySet.attributes = oEntitySet.attributes.sort(function (a, b) { if (a.isKey === b.isKey) { return 0; } if (a.isKey === true) { return -1; } if (b.isKey === true) { return 1; } })

                        //search for corresponding function imports for that entity or entityset
                        oEntitySet.functionImport = [];
                        for (var i = 0; i < oService.service.functionImport.length; i++) {
                            var oFuncImport = oService.service.functionImport[i];
                            if (oFuncImport.entitySet !== oEntitySet.name) {
                                continue;
                            }
                            oFuncImport.functionImpl = "RDM";

                            oEntitySet.functionImport.push(oFuncImport);
                        }
                        oEntitySet.functionImportLength = oEntitySet.functionImport.length;
                    }
                }

                this._oBackup = JSON.parse(JSON.stringify(oMetadata));
                this._oModel.setProperty("/", oMetadata);
                resolve();
            }.bind(this));
        }.bind(this));
    };

    Mockserver.prototype._getMetaModelFromManifest = function (oModel) {
        var oReturn = {
            entitySet: [],
            entityType: [],
            functionImport: []
        };
        return new Promise(function (resolve, reject) {
            if (!oModel) {
                resolve(null);
                return;
            }
            oModel.getMetaModel().loaded().then(function () {
                var oMetadata = oModel.getMetaModel().oMetadata;
                var oEntityContainer = oModel.getMetaModel().getODataEntityContainer();
                for (var i = 0; i < oEntityContainer.entitySet.length; i++) {
                    var oEntitySet = oModel.getMetaModel().getODataEntitySet(oEntityContainer.entitySet[i].name);
                    if (!oEntitySet) {
                        continue;
                    }
                    var oEntityType = oModel.getMetaModel().getODataEntityType(oEntitySet.entityType);
                    if (oEntityType.navigationProperty) {
                        for (var j = 0; j < oEntityType.navigationProperty.length; j++) {
                            var oNavProp = oEntityType.navigationProperty[j];
                            //get association information..
                            var aSchema = oModel.getMetaModel().oModel.oData.dataServices.schema;
                            for (var x = 0; x < aSchema.length; x++) {
                                if (aSchema[x].namespace === oEntityType.namespace) {
                                    for (var y = 0; y < aSchema[x].association.length; y++) {
                                        var oAssoc = aSchema[x].association[y];
                                        if (oAssoc.namespace + "." + oAssoc.name === oNavProp.relationship) {
                                            oNavProp.association = oAssoc;
                                            break;
                                        }
                                    }
                                }
                                if (oNavProp.association) {
                                    break;
                                }
                            }
                        }
                    }
                    oEntitySet.entity = oEntityType;
                    oReturn.entitySet.push(oEntitySet);
                    oReturn.entityType.push(oEntityType);
                }
                if (oEntityContainer.functionImport) {
                    for (var i = 0; i < oEntityContainer.functionImport.length; i++) {
                        oReturn.functionImport.push(oEntityContainer.functionImport[i]);
                    }
                }
                resolve(oReturn);
            }, resolve);
        }.bind(this));
    };

    Mockserver.prototype.getServiceModel = function (sServiceUrl) {
        var oModel = this._oServiceUrls[sServiceUrl];
        return oModel;
    };

    Mockserver.prototype.executeGETMultiple = function (sServiceUrl, oEntitySet) {
        return new Promise(function (resolve, reject) {
            var oModel = this._oServiceUrls[sServiceUrl];
            var sPath = "/" + oEntitySet.name;
            oModel.read(sPath, {
                success: function (aResult) {
                    resolve(aResult);
                },
                error: function (e) {
                    reject(e);
                }
            });
        }.bind(this))
    };


    Mockserver.prototype.getBackup = function () {
        return this._oBackup;
    };

    Mockserver.prototype.getModel = function () {
        return this._oModel;
    };

    return new Mockserver();
});