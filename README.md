[![Logo of UI5 test recorder](images/icon.png)](http://msg-systems.github.io/ui5-testrecorder/)

# UI5 Test Recorder

The *UI5 Test Recorder* is intended to use for your daily testing of UI5 applications.
The tool enables efficient test automation for SAP UI5 and OpenUI5 applications, by enabling the user to record test scenarios with only simple tools.
While recording, the tool supports you in setting the perfect combination of unique attributes to allow a stable and reproducible test execution.

UI5 test recorder is able to generate the test code either for integration tests with [OPA5](https://sap.github.io/openui5-docs/#/Integration_Testing_with_One_Page_Acceptance_Tests_%28OPA5%29_2696ab5) or end-to-end tests with [UIVeri5](https://github.com/SAP/ui5-uiveri5) or [TestCafé](https://devexpress.github.io/testcafe/).

## Documentation

There are several points of interest for users:

- The official website of the UI5 test recorder http://msg-systems.github.io/ui5-testrecorder/.
- Usage documentation can be found [here](http://msg-systems.github.io/ui5-testrecorder/docs/documentation.html).
- The changelog is documented in the file [CHANGELOG.md](CHANGELOG.md).

## Install

The UI5 Test-Recorder is [available through the Chrome Web Store](https://chrome.google.com/webstore/detail/hcpkckcanianjcbiigbklddcpfiljmhj).

*Note*: Right now, only Chrome is supported, further browsers are under investigation.

### Manually install development version

If you want to get the latest version that is not published, you can perform the following steps:

- Checkout the repository at either the `master` or `dev` branch.
- Add an folder `ui5/` directly inside the repository folder created during checkout.
- [Download the latest OpenUI5 runtime](https://openui5.org/releases/).
- Extract the downloaded archive into the folder `ui5/` created before.
- Load the UI5 test recorder (i.e., the checked-out repository folder) as an *unpacked extension* inside Chrome. (See the Chrome developer guide [on how to do that](https://developer.chrome.com/extensions/getstarted#manifest).)

> In the future, we will use a self-contained build provided by [ui5-tooling](https://sap.github.io/ui5-tooling/).
> This will simplify the development workflow significantly.

## Test apps

Testing is important, testing – and using! – the UI5 test recorder even more.
You can test the UI5 test recorder with every app provided with [the OpenUI5 Samples](https://openui5.hana.ondemand.com/#/controls).

You can also use our [presentation at the UI5con 2019](https://msg-systems.github.io/ui5-testrecorder/presentation2019/index.html).
Additionally, we provide [a corresponding download package](https://msg-systems.github.io/ui5-testrecorder/downloads/presentation2019.7z) for offline usage.

## Contributing

> The contribution guide is still under construction. For now, please just open a pull request against the branch `dev` or open an issue.

## License

The UI5 test recorder is licensed under the Apache License 2.0.
See the file [LICENSE](https://github.com/msg-systems/ui5-testrecorder/blob/master/LICENSE) for more details.
