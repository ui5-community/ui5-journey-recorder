[![Logo of UI5 test recorder](../images/icon.png)](http://msg-systems.github.io/ui5-testrecorder/)

# UI5 Test Recorder – A user guide

The UI5 Test Recorder is and will always be a work in progress!
Therefore, please be aware that you may run into issues or miss features.
Instead of getting frustrated, please report them and we try to resolve them as fast as possible.

## Intended usage

We created the UI5 Test Recorder to easily record and replay the usage of a UI5 application.
Furthermore, we target to support tests with [UIVeri5](https://github.com/SAP/ui5-uiveri5), [OPA5](https://sap.github.io/openui5-docs/#/Integration_Testing_with_One_Page_Acceptance_Tests_%28OPA5%29_2696ab5) and [TestCafé](https://devexpress.github.io/testcafe/).

## How to start

After [installation](../README.md#install), you will find a new toolbar icon near the address bar of your browser:

![UI5 test recorder – Toolbar icon](./img/ExtIcon.png)

By clicking on this icon, you start the UI5 test recorder and its front page is shown:

![UI5 test recorder – Start Page](./img/StartPage.png)

Voilá, you can start testing and recording!

## Start page

On the start page, you have the choice to start a new recording or review your existing ones.

### Start a new recording

To start a new recording, just select a tab from the list shown on the start page and the UI5 test recorder will initiate the recording process.

For a more detailed description of the recording process, see the [corresponding documentation](recordTest.md).

#### Additional buttons and functions
On the start page, we provode some additional functionalities, which may be not interesting for you.

There is a glasses button ![View button](./img/ViewButton.png) for each entry in the list.
This button can be used to switch to the tab of the page that corresponds to the respective list entry.

The switch ![Filter for UI5 context](./img/FilterUI5.png) triggers a new search across all open tabs of your browser – to find only tabs running a page using the UI5 framework.
If this option is deselected, the extension shows only active tabs within open browser windows, regardless of whether they contain a UI5 application or not.

There is a reload button ![Reload button](./img/ReloadButton.png) within the table toolbar to reload the table.
The reload functionality is necessary because the UI5 test recorder checks only at startup for tabs to show.
If new tabs are created or opened, the UI5 test recorder will not be informed automatically.
Therefore, we implemented the reload button so you can trigger the search manually.

### Review recorded tests

With the UI5 test recorder, you can save tests you have recorded for further inspection and even a replay.
To open an saved record, just click on the respective list items.

For a more detailed description of the inspection and replaying process, see the [corresponding documentation](testDetailPage.md).
