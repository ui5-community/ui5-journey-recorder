sap.ui.define([
    "sap/ui/core/util/MockServer"
], function (MockServer) {
    "use strict";

    return {
        init: function (oParameters) {
            console.log('MA - Mockserver starting up.');
            var sMetadataUrl = jQuery.sap.getModulePath("sap/ui/demo/todo/localService/metadata", ".xml"),
                sManifestUrl = jQuery.sap.getModulePath("sap/ui/demo/todo/manifest", ".json"),
                sJsonFilesUrl = jQuery.sap.getModulePath("sap/ui/demo/todo/localService/mockdata"),
                oManifest = jQuery.sap.syncGetJSON(sManifestUrl).data,
                oCommonDataSource = oManifest['sap.app'].dataSources.mainService,
                // ensure there is a trailing slash
                sMockServerUrl = /.*\/$/.test(oCommonDataSource.uri) ? oCommonDataSource.uri : oCommonDataSource.uri + '/';

            console.log('MA - Mockserver finished reading local resources.');
            // init the inner mockserver
            this._oMockServer = new MockServer({
                rootUri: sMockServerUrl
            });

            // configure mock server with a delay of 1s
            MockServer.config({
                autoRespond: true,
                autoRespondAfter: (1)
            });

            // load local mock data
            this._oMockServer.simulate(sMetadataUrl, {
                sMockdataBaseUrl: sJsonFilesUrl
            });

            if (oParameters.get("mock-debug") === "true") {
                // Trace requests
                Object.keys(MockServer.HTTPMETHOD).forEach(function (sMethodName) {
                    var sMethod = MockServer.HTTPMETHOD[sMethodName];
                    this._oMockServer.attachBefore(sMethod, function (oEvent) {
                        var oXhr = oEvent.getParameters().oXhr;
                        console.log("MockServer::before", sMethod, decodeURIComponent(oXhr.url), oXhr); // eslint-disable-line no-console
                    });
                    this._oMockServer.attachAfter(sMethod, function (oEvent) {
                        var oXhr = oEvent.getParameters().oXhr;
                        console.log("MockServer::after", sMethod, decodeURIComponent(oXhr.url), oXhr); // eslint-disable-line no-console
                    });
                }.bind(this));
            }

            var aRequests = this._oMockServer.getRequests();
            /*
            var fnHandleXsrfTokenHeader = function (oXhr, mHeaders) {
                if (oXhr.requestHeaders["x-csrf-token"] === "Fetch") {
                    mHeaders["X-CSRF-Token"] = "42424242424242424242424242424242";
                }
            };*/

            this._oMockServer.setRequests(aRequests);

            console.log('MA - Mockserver finally configured, starting ...');
            this._oMockServer.start();
        },

        shutdown: function () {
            this._oMockServer.stop();
            this._oMockServer = null;
        },

        getMockServer: function () {
            return this._oMockServer;
        }
    };
});