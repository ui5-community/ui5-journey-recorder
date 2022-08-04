import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { ChromeExtensionService } from 'src/app/services/chromeExtensionService/chrome_extension_service';
import { Observable } from 'rxjs';
import { DialogService } from 'primeng/dynamicdialog';
import { RecordStopDialogComponent } from '../../dialogs/RecordStopDialog/RecordStopDialog.component';
import {
  Page,
  Step,
  TestScenario,
} from 'src/app/services/classes/testScenario';
import { ScenarioService } from 'src/app/services/scenarioService/scenario.service';

@Component({
  selector: 'app-object-page',
  templateUrl: './object_page.component.html',
  styleUrls: ['./object_page.component.css'],
})
export class ObjectPageComponent implements OnInit {
  navigatedPage: string = 'Test';
  tab: chrome.tabs.Tab | undefined;
  recordingObs: Observable<any>;

  steps: any[] = [];
  scenario: TestScenario | undefined;
  scenarioSteps: Step[] = [];

  private page_id: number = 0;

  constructor(
    private location: Location,
    private incommingRoute: ActivatedRoute,
    private chr_ext_srv: ChromeExtensionService,
    private cd: ChangeDetectorRef,
    private router: Router,
    private dialogService: DialogService,
    private scenarioService: ScenarioService
  ) {
    this.recordingObs = this.chr_ext_srv.register_recording_websocket();
  }

  ngOnInit(): void {
    /* this.incommingRoute.params.subscribe((params: Params) => {
      this.page_id = params['tabId'];
      this.chr_ext_srv
        .getTabInfoById(this.page_id)
        .then((tab: chrome.tabs.Tab) => {
          this.tab = tab;
          this.recordingObs.subscribe(this.onRecordStep.bind(this));
          this.openStopDialog();
        });
    }); */
    this.postRecordActions();
  }

  navBack(): void {
    this.chr_ext_srv.disconnect(this.page_id);
    this.router.navigate(['']);
  }

  private onRecordStep(step: any): void {
    this.steps.push(step);
    this.cd.detectChanges();
  }

  private openStopDialog(): void {
    const ref = this.dialogService.open(RecordStopDialogComponent, {
      closable: false,
      styleClass: 'stopDialog',
      showHeader: false,
    });

    ref.onClose.subscribe((_) => {
      this.postRecordActions();
    });
  }

  private postRecordActions(): void {
    this.steps = [
      {
        type: 'clicked',
        control: {
          id: '__button1-img',
          classes: [
            'sapMBtnCustomIcon',
            'sapMBtnIcon',
            'sapMBtnIconLeft',
            'injectClass',
          ],
          domRef:
            '<span id="__button1-img" data-sap-ui="__button1-img" role="presentation" aria-hidden="true" data-sap-ui-icon-content="" class="sapUiIcon sapUiIconMirrorInRTL sapMBtnCustomIcon sapMBtnIcon sapMBtnIconLeft injectClass" style="font-family: SAP-icons;"></span>',
        },
        location:
          'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/index.html?sap-ui-theme=sap_fiori_3#',
      },
      {
        type: 'clicked',
        control: {
          id: 'container-cart---homeView--searchField',
          classes: ['sapMBarChild', 'sapMTBShrinkItem', 'injectClass'],
          domRef:
            '<div id="container-cart---homeView--searchField" data-sap-ui="container-cart---homeView--searchField" class="sapMSF sapMBarChild sapMTBShrinkItem injectClass" style="width: 100%;"><form id="container-cart---homeView--searchField-F" class="sapMSFF"><input id="container-cart---homeView--searchField-I" type="search" autocomplete="off" title="Search" placeholder="Search" value="" aria-describedby="__text2" class="sapMSFI"><div id="container-cart---homeView--searchField-reset" aria-hidden="true" title="Search" class="sapMSFR sapMSFB"></div><div id="container-cart---homeView--searchField-search" aria-hidden="true" title="Search" class="sapMSFS sapMSFB"></div></form></div>',
        },
        location:
          'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/index.html?sap-ui-theme=sap_fiori_3#/categories',
      },
      {
        type: 'keypress',
        key: 'H',
        keyCode: 72,
        control: {
          id: 'container-cart---homeView--searchField',
          classes: [
            'sapMBarChild',
            'sapMTBShrinkItem',
            'injectClass',
            'sapMFocus',
          ],
          domRef:
            '<div id="container-cart---homeView--searchField" data-sap-ui="container-cart---homeView--searchField" class="sapMSF sapMBarChild sapMTBShrinkItem injectClass sapMFocus" style="width: 100%;"><form id="container-cart---homeView--searchField-F" class="sapMSFF"><input id="container-cart---homeView--searchField-I" type="search" autocomplete="off" title="Search" placeholder="Search" value="" aria-describedby="__text2" class="sapMSFI"><div id="container-cart---homeView--searchField-reset" aria-hidden="true" title="Search" class="sapMSFR sapMSFB"></div><div id="container-cart---homeView--searchField-search" aria-hidden="true" title="Search" class="sapMSFS sapMSFB"></div></form></div>',
        },
        location:
          'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/index.html?sap-ui-theme=sap_fiori_3#/categories',
      },
      {
        type: 'keypress',
        key: 'A',
        keyCode: 65,
        control: {
          id: 'container-cart---homeView--searchField',
          classes: [
            'sapMBarChild',
            'sapMTBShrinkItem',
            'injectClass',
            'sapMFocus',
          ],
          domRef:
            '<div id="container-cart---homeView--searchField" data-sap-ui="container-cart---homeView--searchField" class="sapMSF sapMBarChild sapMTBShrinkItem injectClass sapMFocus sapMSFVal" style="width: 100%;"><form id="container-cart---homeView--searchField-F" class="sapMSFF"><input id="container-cart---homeView--searchField-I" type="search" autocomplete="off" title="Search" placeholder="Search" value="" aria-describedby="__text2" class="sapMSFI"><div id="container-cart---homeView--searchField-reset" aria-hidden="true" title="Reset" class="sapMSFR sapMSFB"></div><div id="container-cart---homeView--searchField-search" aria-hidden="true" title="Search" class="sapMSFS sapMSFB"></div></form></div>',
        },
        location:
          'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/index.html?sap-ui-theme=sap_fiori_3#/categories',
      },
      {
        type: 'keypress',
        key: 'L',
        keyCode: 76,
        control: {
          id: 'container-cart---homeView--searchField',
          classes: [
            'sapMBarChild',
            'sapMTBShrinkItem',
            'injectClass',
            'sapMFocus',
          ],
          domRef:
            '<div id="container-cart---homeView--searchField" data-sap-ui="container-cart---homeView--searchField" class="sapMSF sapMBarChild sapMTBShrinkItem injectClass sapMFocus sapMSFVal" style="width: 100%;"><form id="container-cart---homeView--searchField-F" class="sapMSFF"><input id="container-cart---homeView--searchField-I" type="search" autocomplete="off" title="Search" placeholder="Search" value="" aria-describedby="__text2" class="sapMSFI"><div id="container-cart---homeView--searchField-reset" aria-hidden="true" title="Reset" class="sapMSFR sapMSFB"></div><div id="container-cart---homeView--searchField-search" aria-hidden="true" title="Search" class="sapMSFS sapMSFB"></div></form></div>',
        },
        location:
          'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/index.html?sap-ui-theme=sap_fiori_3#/categories',
      },
      {
        type: 'keypress',
        key: 'L',
        keyCode: 76,
        control: {
          id: 'container-cart---homeView--searchField',
          classes: [
            'sapMBarChild',
            'sapMTBShrinkItem',
            'injectClass',
            'sapMFocus',
          ],
          domRef:
            '<div id="container-cart---homeView--searchField" data-sap-ui="container-cart---homeView--searchField" class="sapMSF sapMBarChild sapMTBShrinkItem injectClass sapMFocus sapMSFVal" style="width: 100%;"><form id="container-cart---homeView--searchField-F" class="sapMSFF"><input id="container-cart---homeView--searchField-I" type="search" autocomplete="off" title="Search" placeholder="Search" value="" aria-describedby="__text2" class="sapMSFI"><div id="container-cart---homeView--searchField-reset" aria-hidden="true" title="Reset" class="sapMSFR sapMSFB"></div><div id="container-cart---homeView--searchField-search" aria-hidden="true" title="Search" class="sapMSFS sapMSFB"></div></form></div>',
        },
        location:
          'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/index.html?sap-ui-theme=sap_fiori_3#/categories',
      },
      {
        type: 'keypress',
        key: 'O',
        keyCode: 79,
        control: {
          id: 'container-cart---homeView--searchField',
          classes: [
            'sapMBarChild',
            'sapMTBShrinkItem',
            'injectClass',
            'sapMFocus',
          ],
          domRef:
            '<div id="container-cart---homeView--searchField" data-sap-ui="container-cart---homeView--searchField" class="sapMSF sapMBarChild sapMTBShrinkItem injectClass sapMFocus sapMSFVal" style="width: 100%;"><form id="container-cart---homeView--searchField-F" class="sapMSFF"><input id="container-cart---homeView--searchField-I" type="search" autocomplete="off" title="Search" placeholder="Search" value="" aria-describedby="__text2" class="sapMSFI"><div id="container-cart---homeView--searchField-reset" aria-hidden="true" title="Reset" class="sapMSFR sapMSFB"></div><div id="container-cart---homeView--searchField-search" aria-hidden="true" title="Search" class="sapMSFS sapMSFB"></div></form></div>',
        },
        location:
          'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/index.html?sap-ui-theme=sap_fiori_3#/categories',
      },
      {
        type: 'keypress',
        key: ' ',
        keyCode: 32,
        control: {
          id: 'container-cart---homeView--searchField',
          classes: [
            'sapMBarChild',
            'sapMTBShrinkItem',
            'injectClass',
            'sapMFocus',
          ],
          domRef:
            '<div id="container-cart---homeView--searchField" data-sap-ui="container-cart---homeView--searchField" class="sapMSF sapMBarChild sapMTBShrinkItem injectClass sapMFocus sapMSFVal" style="width: 100%;"><form id="container-cart---homeView--searchField-F" class="sapMSFF"><input id="container-cart---homeView--searchField-I" type="search" autocomplete="off" title="Search" placeholder="Search" value="" aria-describedby="__text2" class="sapMSFI"><div id="container-cart---homeView--searchField-reset" aria-hidden="true" title="Reset" class="sapMSFR sapMSFB"></div><div id="container-cart---homeView--searchField-search" aria-hidden="true" title="Search" class="sapMSFS sapMSFB"></div></form></div>',
        },
        location:
          'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/index.html?sap-ui-theme=sap_fiori_3#/categories',
      },
      {
        type: 'keypress',
        key: 'Backspace',
        keyCode: 8,
        control: {
          id: 'container-cart---homeView--searchField',
          classes: [
            'sapMBarChild',
            'sapMTBShrinkItem',
            'injectClass',
            'sapMFocus',
          ],
          domRef:
            '<div id="container-cart---homeView--searchField" data-sap-ui="container-cart---homeView--searchField" class="sapMSF sapMBarChild sapMTBShrinkItem injectClass sapMFocus sapMSFVal" style="width: 100%;"><form id="container-cart---homeView--searchField-F" class="sapMSFF"><input id="container-cart---homeView--searchField-I" type="search" autocomplete="off" title="Search" placeholder="Search" value="" aria-describedby="__text2" class="sapMSFI"><div id="container-cart---homeView--searchField-reset" aria-hidden="true" title="Reset" class="sapMSFR sapMSFB"></div><div id="container-cart---homeView--searchField-search" aria-hidden="true" title="Search" class="sapMSFS sapMSFB"></div></form></div>',
        },
        location:
          'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/index.html?sap-ui-theme=sap_fiori_3#/categories',
      },
      {
        type: 'keypress',
        key: 'Backspace',
        keyCode: 8,
        control: {
          id: 'container-cart---homeView--searchField',
          classes: [
            'sapMBarChild',
            'sapMTBShrinkItem',
            'injectClass',
            'sapMFocus',
          ],
          domRef:
            '<div id="container-cart---homeView--searchField" data-sap-ui="container-cart---homeView--searchField" class="sapMSF sapMBarChild sapMTBShrinkItem injectClass sapMFocus sapMSFVal" style="width: 100%;"><form id="container-cart---homeView--searchField-F" class="sapMSFF"><input id="container-cart---homeView--searchField-I" type="search" autocomplete="off" title="Search" placeholder="Search" value="" aria-describedby="__text2" class="sapMSFI"><div id="container-cart---homeView--searchField-reset" aria-hidden="true" title="Reset" class="sapMSFR sapMSFB"></div><div id="container-cart---homeView--searchField-search" aria-hidden="true" title="Search" class="sapMSFS sapMSFB"></div></form></div>',
        },
        location:
          'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/index.html?sap-ui-theme=sap_fiori_3#/categories',
      },
      {
        type: 'keypress',
        key: 'Backspace',
        keyCode: 8,
        control: {
          id: 'container-cart---homeView--searchField',
          classes: [
            'sapMBarChild',
            'sapMTBShrinkItem',
            'injectClass',
            'sapMFocus',
          ],
          domRef:
            '<div id="container-cart---homeView--searchField" data-sap-ui="container-cart---homeView--searchField" class="sapMSF sapMBarChild sapMTBShrinkItem injectClass sapMFocus sapMSFVal" style="width: 100%;"><form id="container-cart---homeView--searchField-F" class="sapMSFF"><input id="container-cart---homeView--searchField-I" type="search" autocomplete="off" title="Search" placeholder="Search" value="" aria-describedby="__text2" class="sapMSFI"><div id="container-cart---homeView--searchField-reset" aria-hidden="true" title="Reset" class="sapMSFR sapMSFB"></div><div id="container-cart---homeView--searchField-search" aria-hidden="true" title="Search" class="sapMSFS sapMSFB"></div></form></div>',
        },
        location:
          'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/index.html?sap-ui-theme=sap_fiori_3#/categories',
      },
      {
        type: 'keypress',
        key: 'Backspace',
        keyCode: 8,
        control: {
          id: 'container-cart---homeView--searchField',
          classes: [
            'sapMBarChild',
            'sapMTBShrinkItem',
            'injectClass',
            'sapMFocus',
          ],
          domRef:
            '<div id="container-cart---homeView--searchField" data-sap-ui="container-cart---homeView--searchField" class="sapMSF sapMBarChild sapMTBShrinkItem injectClass sapMFocus sapMSFVal" style="width: 100%;"><form id="container-cart---homeView--searchField-F" class="sapMSFF"><input id="container-cart---homeView--searchField-I" type="search" autocomplete="off" title="Search" placeholder="Search" value="" aria-describedby="__text2" class="sapMSFI"><div id="container-cart---homeView--searchField-reset" aria-hidden="true" title="Reset" class="sapMSFR sapMSFB"></div><div id="container-cart---homeView--searchField-search" aria-hidden="true" title="Search" class="sapMSFS sapMSFB"></div></form></div>',
        },
        location:
          'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/index.html?sap-ui-theme=sap_fiori_3#/categories',
      },
      {
        type: 'keypress',
        key: 'Backspace',
        keyCode: 8,
        control: {
          id: 'container-cart---homeView--searchField',
          classes: [
            'sapMBarChild',
            'sapMTBShrinkItem',
            'injectClass',
            'sapMFocus',
          ],
          domRef:
            '<div id="container-cart---homeView--searchField" data-sap-ui="container-cart---homeView--searchField" class="sapMSF sapMBarChild sapMTBShrinkItem injectClass sapMFocus sapMSFVal" style="width: 100%;"><form id="container-cart---homeView--searchField-F" class="sapMSFF"><input id="container-cart---homeView--searchField-I" type="search" autocomplete="off" title="Search" placeholder="Search" value="" aria-describedby="__text2" class="sapMSFI"><div id="container-cart---homeView--searchField-reset" aria-hidden="true" title="Reset" class="sapMSFR sapMSFB"></div><div id="container-cart---homeView--searchField-search" aria-hidden="true" title="Search" class="sapMSFS sapMSFB"></div></form></div>',
        },
        location:
          'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/index.html?sap-ui-theme=sap_fiori_3#/categories',
      },
      {
        type: 'keypress',
        key: 'Backspace',
        keyCode: 8,
        control: {
          id: 'container-cart---homeView--searchField',
          classes: [
            'sapMBarChild',
            'sapMTBShrinkItem',
            'injectClass',
            'sapMFocus',
          ],
          domRef:
            '<div id="container-cart---homeView--searchField" data-sap-ui="container-cart---homeView--searchField" class="sapMSF sapMBarChild sapMTBShrinkItem injectClass sapMFocus sapMSFVal" style="width: 100%;"><form id="container-cart---homeView--searchField-F" class="sapMSFF"><input id="container-cart---homeView--searchField-I" type="search" autocomplete="off" title="Search" placeholder="Search" value="" aria-describedby="__text2" class="sapMSFI"><div id="container-cart---homeView--searchField-reset" aria-hidden="true" title="Reset" class="sapMSFR sapMSFB"></div><div id="container-cart---homeView--searchField-search" aria-hidden="true" title="Search" class="sapMSFS sapMSFB"></div></form></div>',
        },
        location:
          'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/index.html?sap-ui-theme=sap_fiori_3#/categories',
      },
      {
        type: 'keypress',
        key: 'CapsLock',
        keyCode: 20,
        control: {
          id: 'container-cart---homeView--searchField',
          classes: [
            'sapMBarChild',
            'sapMTBShrinkItem',
            'injectClass',
            'sapMFocus',
          ],
          domRef:
            '<div id="container-cart---homeView--searchField" data-sap-ui="container-cart---homeView--searchField" class="sapMSF sapMBarChild sapMTBShrinkItem injectClass sapMFocus" style="width: 100%;"><form id="container-cart---homeView--searchField-F" class="sapMSFF"><input id="container-cart---homeView--searchField-I" type="search" autocomplete="off" title="Search" placeholder="Search" value="" aria-describedby="__text2" class="sapMSFI"><div id="container-cart---homeView--searchField-reset" aria-hidden="true" title="Search" class="sapMSFR sapMSFB"></div><div id="container-cart---homeView--searchField-search" aria-hidden="true" title="Search" class="sapMSFS sapMSFB"></div></form></div>',
        },
        location:
          'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/index.html?sap-ui-theme=sap_fiori_3#/categories',
      },
      {
        type: 'keypress',
        key: 'h',
        keyCode: 72,
        control: {
          id: 'container-cart---homeView--searchField',
          classes: [
            'sapMBarChild',
            'sapMTBShrinkItem',
            'injectClass',
            'sapMFocus',
          ],
          domRef:
            '<div id="container-cart---homeView--searchField" data-sap-ui="container-cart---homeView--searchField" class="sapMSF sapMBarChild sapMTBShrinkItem injectClass sapMFocus" style="width: 100%;"><form id="container-cart---homeView--searchField-F" class="sapMSFF"><input id="container-cart---homeView--searchField-I" type="search" autocomplete="off" title="Search" placeholder="Search" value="" aria-describedby="__text2" class="sapMSFI"><div id="container-cart---homeView--searchField-reset" aria-hidden="true" title="Search" class="sapMSFR sapMSFB"></div><div id="container-cart---homeView--searchField-search" aria-hidden="true" title="Search" class="sapMSFS sapMSFB"></div></form></div>',
        },
        location:
          'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/index.html?sap-ui-theme=sap_fiori_3#/categories',
      },
      {
        type: 'keypress',
        key: 'a',
        keyCode: 65,
        control: {
          id: 'container-cart---homeView--searchField',
          classes: [
            'sapMBarChild',
            'sapMTBShrinkItem',
            'injectClass',
            'sapMFocus',
          ],
          domRef:
            '<div id="container-cart---homeView--searchField" data-sap-ui="container-cart---homeView--searchField" class="sapMSF sapMBarChild sapMTBShrinkItem injectClass sapMFocus sapMSFVal" style="width: 100%;"><form id="container-cart---homeView--searchField-F" class="sapMSFF"><input id="container-cart---homeView--searchField-I" type="search" autocomplete="off" title="Search" placeholder="Search" value="" aria-describedby="__text2" class="sapMSFI"><div id="container-cart---homeView--searchField-reset" aria-hidden="true" title="Reset" class="sapMSFR sapMSFB"></div><div id="container-cart---homeView--searchField-search" aria-hidden="true" title="Search" class="sapMSFS sapMSFB"></div></form></div>',
        },
        location:
          'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/index.html?sap-ui-theme=sap_fiori_3#/categories',
      },
      {
        type: 'clicked',
        control: {
          id: '__item0-container-cart---homeView--productList-0-titleText',
          classes: ['sapMObjLTitle', 'injectClass'],
          domRef:
            '<span id="__item0-container-cart---homeView--productList-0-titleText" data-sap-ui="__item0-container-cart---homeView--productList-0-titleText" dir="auto" class="sapMText sapUiSelectable sapMTextMaxLineWrapper sapMTextMaxWidth sapMObjLTitle injectClass" style="text-align: left;"><span id="__item0-container-cart---homeView--productList-0-titleText-inner" class="sapMTextMaxLine sapMTextLineClamp" style="-webkit-line-clamp: 2;">Smartphone Alpha</span></span>',
        },
        location:
          'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/index.html?sap-ui-theme=sap_fiori_3#/categories',
      },
      {
        type: 'clicked',
        control: {
          id: 'container-cart---category--page',
          classes: [],
          domRef:
            '<div id="container-cart---category--page" data-sap-ui="container-cart---category--page" role="region" aria-label="Category" class="sapMPage sapMPageBgSolid sapMPageWithHeader sapMPageBusyCoversAll"><div role="region" aria-label="Category Header" class="sapMPageHeader"><div id="container-cart---category--page-intHeader" data-sap-ui="container-cart---category--page-intHeader" data-sap-ui-fastnavgroup="true" role="toolbar" class="sapMIBar sapMIBar-CTX sapMBar sapMContent-CTX sapMBar-CTX sapMPageHeader sapMHeader-CTX sapContrastPlus sapMBarTitleAlignAuto"><div id="container-cart---category--page-intHeader-BarLeft" class="sapMBarLeft sapMBarContainer"><button id="container-cart---category--page-navButton" data-sap-ui="container-cart---category--page-navButton" aria-label="Back" title="Back" class="sapMBtnBase sapMBtn sapMBtnBack sapMBarChild"><span id="container-cart---category--page-navButton-inner" class="sapMBtnInner sapMBtnHoverable sapMFocusable sapMBtnBack sapMBtnIconFirst sapMBtnBack"><span id="container-cart---category--page-navButton-iconBtn" data-sap-ui="container-cart---category--page-navButton-iconBtn" role="presentation" aria-hidden="true" data-sap-ui-icon-content="" class="sapUiIcon sapUiIconMirrorInRTL sapMBtnIcon sapMBtnIconLeft" style="font-family: SAP-icons;"></span></span><span id="container-cart---category--page-navButton-tooltip" class="sapUiInvisibleText" aria-live="polite">Back</span></button></div><div id="container-cart---category--page-intHeader-BarMiddle" class="sapMBarMiddle"><div id="container-cart---category--page-intHeader-BarPH" class="sapMBarPH sapMBarContainer" style="position: absolute; width: 870px; left: 44px;"><div id="container-cart---category--page-title" data-sap-ui="container-cart---category--page-title" role="heading" aria-level="2" class="sapMTitle sapMTitleStyleAuto sapMTitleNoWrap sapUiSelectable sapMTitleMaxWidth sapMBarChild"><span id="container-cart---category--page-title-inner" dir="auto">Smartphones and Tablets</span></div></div></div><div id="container-cart---category--page-intHeader-BarRight" class="sapMBarRight sapMBarContainer"><button id="container-cart---category--masterListFilterButton" data-sap-ui="container-cart---category--masterListFilterButton" aria-label="Filter" title="Filter" class="sapMBtnBase sapMBtn sapMBarChild"><span id="container-cart---category--masterListFilterButton-inner" class="sapMBtnInner sapMBtnHoverable sapMFocusable sapMBtnIconFirst sapMBtnDefault"><span id="container-cart---category--masterListFilterButton-img" data-sap-ui="container-cart---category--masterListFilterButton-img" role="presentation" aria-hidden="true" data-sap-ui-icon-content="" class="sapUiIcon sapUiIconMirrorInRTL sapMBtnCustomIcon sapMBtnIcon sapMBtnIconLeft" style="font-family: SAP-icons;"></span></span><span id="container-cart---category--masterListFilterButton-tooltip" class="sapUiInvisibleText">Filter</span></button></div></div></div><section id="container-cart---category--page-cont" role="main" aria-label="Smartphones and Tablets Items of Category" class="sapMPageEnableScrolling sapUiScrollDelegate" style="overflow: hidden auto;"><div id="container-cart---category--productList" data-sap-ui="container-cart---category--productList" data-sap-ui-fastnavgroup="true" class="sapMList sapMListBGSolid" style="width: 100%;"><div class="sapMListInfoTBarContainer"><span id="sap-ui-invisible-container-cart---category--categoryInfoToolbar" data-sap-ui="sap-ui-invisible-container-cart---category--categoryInfoToolbar" aria-hidden="true" class="sapUiHiddenPlaceholder"></span></div><div id="container-cart---category--productList-before" tabindex="-1" class="sapMListDummyArea"></div><ul id="container-cart---category--productList-listUl" role="listbox" aria-multiselectable="false" tabindex="0" class="sapMListItems sapMListUl sapMListShowSeparatorsAll sapMListModeSingleSelectMaster"><li id="__item5-container-cart---category--productList-0" data-sap-ui="__item5-container-cart---category--productList-0" title="Open details for Astro Phone 6" tabindex="-1" role="option" aria-selected="false" aria-labelledby="__item5-container-cart---category--productList-0-titleText __item5-container-cart---category--productList-0-ObjectNumber __attribute1-container-cart---category--productList-0 __attribute2-container-cart---category--productList-0 __status4-container-cart---category--productList-0" class="sapMLIB sapMLIB-CTX sapMLIBShowSeparator sapMLIBTypeInactive sapMLIBActionable sapMLIBHoverable sapMLIBFocusable sapMObjLItem sapMObjLListModeDiv injectClass"><div id="__item5-container-cart---category--productList-0-content" class="sapMLIBContent"><div class="sapMObjLTopRow"><div class="sapMObjLIconDiv"><img id="__item5-container-cart---category--productList-0-img" data-sap-ui="__item5-container-cart---category--productList-0-img" src="./localService/mockdata/images/HT-1252.jpg" role="presentation" aria-hidden="true" alt="" class="sapMImg sapMObjLIcon"></div><div class="sapMObjLNumberDiv"><div id="__item5-container-cart---category--productList-0-ObjectNumber" data-sap-ui="__item5-container-cart---category--productList-0-ObjectNumber" aria-roledescription="Object Number" class="sapMObjectNumber sapMObjectNumberStatusNone sapMObjectNumberEmph" style="text-align: right;"><span id="__item5-container-cart---category--productList-0-ObjectNumber-inner" class="sapMObjectNumberInner"><span id="__item5-container-cart---category--productList-0-ObjectNumber-number" class="sapMObjectNumberText">649,00 </span><span id="__item5-container-cart---category--productList-0-ObjectNumber-unit" class="sapMObjectNumberUnit">EUR</span></span><span id="__item5-container-cart---category--productList-0-ObjectNumber-emphasized" class="sapUiPseudoInvisibleText">Emphasized</span></div></div><div style="display: -webkit-box; overflow: hidden;"><span id="__item5-container-cart---category--productList-0-titleText" data-sap-ui="__item5-container-cart---category--productList-0-titleText" dir="auto" class="sapMText sapUiSelectable sapMTextMaxLineWrapper sapMTextMaxWidth sapMObjLTitle" style="text-align: left;"><span id="__item5-container-cart---category--productList-0-titleText-inner" class="sapMTextMaxLine sapMTextLineClamp" style="-webkit-line-clamp: 2;">Astro Phone 6</span></span></div></div><div style="clear: both;"></div><div class="sapMObjLBottomRow"><div class="sapMObjLAttrRow"><div class="sapMObjLAttrDiv"><div id="__attribute1-container-cart---category--productList-0" data-sap-ui="__attribute1-container-cart---category--productList-0" class="sapMObjectAttributeDiv"><span id="__text216" data-sap-ui="__text216" dir="auto" class="sapMText sapUiSelectable sapMTextNoWrap sapMTextMaxWidth" style="text-align: left;">Ultrasonic United</span></div></div><div class="sapMObjLStatusDiv"><div id="__status4-container-cart---category--productList-0" data-sap-ui="__status4-container-cart---category--productList-0" aria-roledescription="Object Status" role="group" class="sapMObjStatus sapMObjStatusSuccess"><span id="__status4-container-cart---category--productList-0-text" dir="ltr" class="sapMObjStatusText">Available</span><span id="__status4-container-cart---category--productList-0-state" class="sapUiPseudoInvisibleText">Entry successfully validated</span></div></div></div><div class="sapMObjLAttrRow"><div class="sapMObjLAttrDiv" style="width: 100%;"><div id="__attribute2-container-cart---category--productList-0" data-sap-ui="__attribute2-container-cart---category--productList-0" class="sapMObjectAttributeDiv sapMObjectAttributeActive sapMObjectAttributeTextOnly"><span id="__attribute2-container-cart---category--productList-0-text" tabindex="0" role="link" aria-label="Compare" class="sapMObjectAttributeText"><bdi>Compare</bdi></span></div></div></div></div></div></li><li id="__item5-container-cart---category--productList-1" data-sap-ui="__item5-container-cart---category--productList-1" title="Open details for Cepat Tablet 10.5" tabindex="-1" role="option" aria-selected="false" aria-labelledby="__item5-container-cart---category--productList-1-titleText __item5-container-cart---category--productList-1-ObjectNumber __attribute1-container-cart---category--productList-1 __attribute2-container-cart---category--productList-1 __status4-container-cart---category--productList-1" class="sapMLIB sapMLIB-CTX sapMLIBShowSeparator sapMLIBTypeInactive sapMLIBActionable sapMLIBHoverable sapMLIBFocusable sapMObjLItem sapMObjLListModeDiv"><div id="__item5-container-cart---category--productList-1-content" class="sapMLIBContent"><div class="sapMObjLTopRow"><div class="sapMObjLIconDiv"><img id="__item5-container-cart---category--productList-1-img" data-sap-ui="__item5-container-cart---category--productList-1-img" src="./localService/mockdata/images/HT-1257.jpg" role="presentation" aria-hidden="true" alt="" class="sapMImg sapMObjLIcon"></div><div class="sapMObjLNumberDiv"><div id="__item5-container-cart---category--productList-1-ObjectNumber" data-sap-ui="__item5-container-cart---category--productList-1-ObjectNumber" aria-roledescription="Object Number" class="sapMObjectNumber sapMObjectNumberStatusNone sapMObjectNumberEmph" style="text-align: right;"><span id="__item5-container-cart---category--productList-1-ObjectNumber-inner" class="sapMObjectNumberInner"><span id="__item5-container-cart---category--productList-1-ObjectNumber-number" class="sapMObjectNumberText">549,00 </span><span id="__item5-container-cart---category--productList-1-ObjectNumber-unit" class="sapMObjectNumberUnit">EUR</span></span><span id="__item5-container-cart---category--productList-1-ObjectNumber-emphasized" class="sapUiPseudoInvisibleText">Emphasized</span></div></div><div style="display: -webkit-box; overflow: hidden;"><span id="__item5-container-cart---category--productList-1-titleText" data-sap-ui="__item5-container-cart---category--productList-1-titleText" dir="auto" class="sapMText sapUiSelectable sapMTextMaxLineWrapper sapMTextMaxWidth sapMObjLTitle" style="text-align: left;"><span id="__item5-container-cart---category--productList-1-titleText-inner" class="sapMTextMaxLine sapMTextLineClamp" style="-webkit-line-clamp: 2;">Cepat Tablet 10.5</span></span></div></div><div style="clear: both;"></div><div class="sapMObjLBottomRow"><div class="sapMObjLAttrRow"><div class="sapMObjLAttrDiv"><div id="__attribute1-container-cart---category--productList-1" data-sap-ui="__attribute1-container-cart---category--productList-1" class="sapMObjectAttributeDiv"><span id="__text218" data-sap-ui="__text218" dir="auto" class="sapMText sapUiSelectable sapMTextNoWrap sapMTextMaxWidth" style="text-align: left;">Ultrasonic United</span></div></div><div class="sapMObjLStatusDiv"><div id="__status4-container-cart---category--productList-1" data-sap-ui="__status4-container-cart---category--productList-1" aria-roledescription="Object Status" role="group" class="sapMObjStatus sapMObjStatusSuccess"><span id="__status4-container-cart---category--productList-1-text" dir="ltr" class="sapMObjStatusText">Available</span><span id="__status4-container-cart---category--productList-1-state" class="sapUiPseudoInvisibleText">Entry successfully validated</span></div></div></div><div class="sapMObjLAttrRow"><div class="sapMObjLAttrDiv" style="width: 100%;"><div id="__attribute2-container-cart---category--productList-1" data-sap-ui="__attribute2-container-cart---category--productList-1" class="sapMObjectAttributeDiv sapMObjectAttributeActive sapMObjectAttributeTextOnly"><span id="__attribute2-container-cart---category--productList-1-text" tabindex="0" role="link" aria-label="Compare" class="sapMObjectAttributeText"><bdi>Compare</bdi></span></div></div></div></div></div></li><li id="__item5-container-cart---category--productList-2" data-sap-ui="__item5-container-cart---category--productList-2" title="Open details for Cepat Tablet 8" tabindex="-1" role="option" aria-selected="false" aria-labelledby="__item5-container-cart---category--productList-2-titleText __item5-container-cart---category--productList-2-ObjectNumber __attribute1-container-cart---category--productList-2 __attribute2-container-cart---category--productList-2 __status4-container-cart---category--productList-2" class="sapMLIB sapMLIB-CTX sapMLIBShowSeparator sapMLIBTypeInactive sapMLIBActionable sapMLIBHoverable sapMLIBFocusable sapMObjLItem sapMObjLListModeDiv"><div id="__item5-container-cart---category--productList-2-content" class="sapMLIBContent"><div class="sapMObjLTopRow"><div class="sapMObjLIconDiv"><img id="__item5-container-cart---category--productList-2-img" data-sap-ui="__item5-container-cart---category--productList-2-img" src="./localService/mockdata/images/HT-1258.jpg" role="presentation" aria-hidden="true" alt="" class="sapMImg sapMObjLIcon"></div><div class="sapMObjLNumberDiv"><div id="__item5-container-cart---category--productList-2-ObjectNumber" data-sap-ui="__item5-container-cart---category--productList-2-ObjectNumber" aria-roledescription="Object Number" class="sapMObjectNumber sapMObjectNumberStatusNone sapMObjectNumberEmph" style="text-align: right;"><span id="__item5-container-cart---category--productList-2-ObjectNumber-inner" class="sapMObjectNumberInner"><span id="__item5-container-cart---category--productList-2-ObjectNumber-number" class="sapMObjectNumberText">529,00 </span><span id="__item5-container-cart---category--productList-2-ObjectNumber-unit" class="sapMObjectNumberUnit">EUR</span></span><span id="__item5-container-cart---category--productList-2-ObjectNumber-emphasized" class="sapUiPseudoInvisibleText">Emphasized</span></div></div><div style="display: -webkit-box; overflow: hidden;"><span id="__item5-container-cart---category--productList-2-titleText" data-sap-ui="__item5-container-cart---category--productList-2-titleText" dir="auto" class="sapMText sapUiSelectable sapMTextMaxLineWrapper sapMTextMaxWidth sapMObjLTitle" style="text-align: left;"><span id="__item5-container-cart---category--productList-2-titleText-inner" class="sapMTextMaxLine sapMTextLineClamp" style="-webkit-line-clamp: 2;">Cepat Tablet 8</span></span></div></div><div style="clear: both;"></div><div class="sapMObjLBottomRow"><div class="sapMObjLAttrRow"><div class="sapMObjLAttrDiv"><div id="__attribute1-container-cart---category--productList-2" data-sap-ui="__attribute1-container-cart---category--productList-2" class="sapMObjectAttributeDiv"><span id="__text220" data-sap-ui="__text220" dir="auto" class="sapMText sapUiSelectable sapMTextNoWrap sapMTextMaxWidth" style="text-align: left;">Ultrasonic United</span></div></div><div class="sapMObjLStatusDiv"><div id="__status4-container-cart---category--productList-2" data-sap-ui="__status4-container-cart---category--productList-2" aria-roledescription="Object Status" role="group" class="sapMObjStatus sapMObjStatusSuccess"><span id="__status4-container-cart---category--productList-2-text" dir="ltr" class="sapMObjStatusText">Available</span><span id="__status4-container-cart---category--productList-2-state" class="sapUiPseudoInvisibleText">Entry successfully validated</span></div></div></div><div class="sapMObjLAttrRow"><div class="sapMObjLAttrDiv" style="width: 100%;"><div id="__attribute2-container-cart---category--productList-2" data-sap-ui="__attribute2-container-cart---category--productList-2" class="sapMObjectAttributeDiv sapMObjectAttributeActive sapMObjectAttributeTextOnly"><span id="__attribute2-container-cart---category--productList-2-text" tabindex="0" role="link" aria-label="Compare" class="sapMObjectAttributeText"><bdi>Compare</bdi></span></div></div></div></div></div></li><li id="__item5-container-cart---category--productList-3" data-sap-ui="__item5-container-cart---category--productList-3" title="Open details for Cerdik Phone 7" tabindex="-1" role="option" aria-selected="false" aria-labelledby="__item5-container-cart---category--productList-3-titleText __item5-container-cart---category--productList-3-ObjectNumber __attribute1-container-cart---category--productList-3 __attribute2-container-cart---category--productList-3 __status4-container-cart---category--productList-3" class="sapMLIB sapMLIB-CTX sapMLIBShowSeparator sapMLIBTypeInactive sapMLIBActionable sapMLIBHoverable sapMLIBFocusable sapMObjLItem sapMObjLListModeDiv"><div id="__item5-container-cart---category--productList-3-content" class="sapMLIBContent"><div class="sapMObjLTopRow"><div class="sapMObjLIconDiv"><img id="__item5-container-cart---category--productList-3-img" data-sap-ui="__item5-container-cart---category--productList-3-img" src="./localService/mockdata/images/HT-1256.jpg" role="presentation" aria-hidden="true" alt="" class="sapMImg sapMObjLIcon"></div><div class="sapMObjLNumberDiv"><div id="__item5-container-cart---category--productList-3-ObjectNumber" data-sap-ui="__item5-container-cart---category--productList-3-ObjectNumber" aria-roledescription="Object Number" class="sapMObjectNumber sapMObjectNumberStatusNone sapMObjectNumberEmph" style="text-align: right;"><span id="__item5-container-cart---category--productList-3-ObjectNumber-inner" class="sapMObjectNumberInner"><span id="__item5-container-cart---category--productList-3-ObjectNumber-number" class="sapMObjectNumberText">549,00 </span><span id="__item5-container-cart---category--productList-3-ObjectNumber-unit" class="sapMObjectNumberUnit">EUR</span></span><span id="__item5-container-cart---category--productList-3-ObjectNumber-emphasized" class="sapUiPseudoInvisibleText">Emphasized</span></div></div><div style="display: -webkit-box; overflow: hidden;"><span id="__item5-container-cart---category--productList-3-titleText" data-sap-ui="__item5-container-cart---category--productList-3-titleText" dir="auto" class="sapMText sapUiSelectable sapMTextMaxLineWrapper sapMTextMaxWidth sapMObjLTitle" style="text-align: left;"><span id="__item5-container-cart---category--productList-3-titleText-inner" class="sapMTextMaxLine sapMTextLineClamp" style="-webkit-line-clamp: 2;">Cerdik Phone 7</span></span></div></div><div style="clear: both;"></div><div class="sapMObjLBottomRow"><div class="sapMObjLAttrRow"><div class="sapMObjLAttrDiv"><div id="__attribute1-container-cart---category--productList-3" data-sap-ui="__attribute1-container-cart---category--productList-3" class="sapMObjectAttributeDiv"><span id="__text222" data-sap-ui="__text222" dir="auto" class="sapMText sapUiSelectable sapMTextNoWrap sapMTextMaxWidth" style="text-align: left;">Ultrasonic United</span></div></div><div class="sapMObjLStatusDiv"><div id="__status4-container-cart---category--productList-3" data-sap-ui="__status4-container-cart---category--productList-3" aria-roledescription="Object Status" role="group" class="sapMObjStatus sapMObjStatusSuccess"><span id="__status4-container-cart---category--productList-3-text" dir="ltr" class="sapMObjStatusText">Available</span><span id="__status4-container-cart---category--productList-3-state" class="sapUiPseudoInvisibleText">Entry successfully validated</span></div></div></div><div class="sapMObjLAttrRow"><div class="sapMObjLAttrDiv" style="width: 100%;"><div id="__attribute2-container-cart---category--productList-3" data-sap-ui="__attribute2-container-cart---category--productList-3" class="sapMObjectAttributeDiv sapMObjectAttributeActive sapMObjectAttributeTextOnly"><span id="__attribute2-container-cart---category--productList-3-text" tabindex="0" role="link" aria-label="Compare" class="sapMObjectAttributeText"><bdi>Compare</bdi></span></div></div></div></div></div></li><li id="__item5-container-cart---category--productList-4" data-sap-ui="__item5-container-cart---category--productList-4" title="Open details for Maxi Tablet" tabindex="-1" role="option" aria-selected="false" aria-labelledby="__item5-container-cart---category--productList-4-titleText __item5-container-cart---category--productList-4-ObjectNumber __attribute1-container-cart---category--productList-4 __attribute2-container-cart---category--productList-4 __status4-container-cart---category--productList-4" class="sapMLIB sapMLIB-CTX sapMLIBShowSeparator sapMLIBTypeInactive sapMLIBActionable sapMLIBHoverable sapMLIBFocusable sapMObjLItem sapMObjLListModeDiv"><div id="__item5-container-cart---category--productList-4-content" class="sapMLIBContent"><div class="sapMObjLTopRow"><div class="sapMObjLIconDiv"><img id="__item5-container-cart---category--productList-4-img" data-sap-ui="__item5-container-cart---category--productList-4-img" src="./localService/mockdata/images/HT-9999.jpg" role="presentation" aria-hidden="true" alt="" class="sapMImg sapMObjLIcon"></div><div class="sapMObjLNumberDiv"><div id="__item5-container-cart---category--productList-4-ObjectNumber" data-sap-ui="__item5-container-cart---category--productList-4-ObjectNumber" aria-roledescription="Object Number" class="sapMObjectNumber sapMObjectNumberStatusNone sapMObjectNumberEmph" style="text-align: right;"><span id="__item5-container-cart---category--productList-4-ObjectNumber-inner" class="sapMObjectNumberInner"><span id="__item5-container-cart---category--productList-4-ObjectNumber-number" class="sapMObjectNumberText">749,00 </span><span id="__item5-container-cart---category--productList-4-ObjectNumber-unit" class="sapMObjectNumberUnit">EUR</span></span><span id="__item5-container-cart---category--productList-4-ObjectNumber-emphasized" class="sapUiPseudoInvisibleText">Emphasized</span></div></div><div style="display: -webkit-box; overflow: hidden;"><span id="__item5-container-cart---category--productList-4-titleText" data-sap-ui="__item5-container-cart---category--productList-4-titleText" dir="auto" class="sapMText sapUiSelectable sapMTextMaxLineWrapper sapMTextMaxWidth sapMObjLTitle" style="text-align: left;"><span id="__item5-container-cart---category--productList-4-titleText-inner" class="sapMTextMaxLine sapMTextLineClamp" style="-webkit-line-clamp: 2;">Maxi Tablet</span></span></div></div><div style="clear: both;"></div><div class="sapMObjLBottomRow"><div class="sapMObjLAttrRow"><div class="sapMObjLAttrDiv"><div id="__attribute1-container-cart---category--productList-4" data-sap-ui="__attribute1-container-cart---category--productList-4" class="sapMObjectAttributeDiv"><span id="__text224" data-sap-ui="__text224" dir="auto" class="sapMText sapUiSelectable sapMTextNoWrap sapMTextMaxWidth" style="text-align: left;">Titanium</span></div></div><div class="sapMObjLStatusDiv"><div id="__status4-container-cart---category--productList-4" data-sap-ui="__status4-container-cart---category--productList-4" aria-roledescription="Object Status" role="group" class="sapMObjStatus sapMObjStatusSuccess"><span id="__status4-container-cart---category--productList-4-text" dir="ltr" class="sapMObjStatusText">Available</span><span id="__status4-container-cart---category--productList-4-state" class="sapUiPseudoInvisibleText">Entry successfully validated</span></div></div></div><div class="sapMObjLAttrRow"><div class="sapMObjLAttrDiv" style="width: 100%;"><div id="__attribute2-container-cart---category--productList-4" data-sap-ui="__attribute2-container-cart---category--productList-4" class="sapMObjectAttributeDiv sapMObjectAttributeActive sapMObjectAttributeTextOnly"><span id="__attribute2-container-cart---category--productList-4-text" tabindex="0" role="link" aria-label="Compare" class="sapMObjectAttributeText"><bdi>Compare</bdi></span></div></div></div></div></div></li><li id="__item5-container-cart---category--productList-5" data-sap-ui="__item5-container-cart---category--productList-5" title="Open details for Mini Tablet" tabindex="-1" role="option" aria-selected="false" aria-labelledby="__item5-container-cart---category--productList-5-titleText __item5-container-cart---category--productList-5-ObjectNumber __attribute1-container-cart---category--productList-5 __attribute2-container-cart---category--productList-5 __status4-container-cart---category--productList-5" class="sapMLIB sapMLIB-CTX sapMLIBShowSeparator sapMLIBTypeInactive sapMLIBActionable sapMLIBHoverable sapMLIBFocusable sapMObjLItem sapMObjLListModeDiv"><div id="__item5-container-cart---category--productList-5-content" class="sapMLIBContent"><div class="sapMObjLTopRow"><div class="sapMObjLIconDiv"><img id="__item5-container-cart---category--productList-5-img" data-sap-ui="__item5-container-cart---category--productList-5-img" src="./localService/mockdata/images/HT-9993.jpg" role="presentation" aria-hidden="true" alt="" class="sapMImg sapMObjLIcon"></div><div class="sapMObjLNumberDiv"><div id="__item5-container-cart---category--productList-5-ObjectNumber" data-sap-ui="__item5-container-cart---category--productList-5-ObjectNumber" aria-roledescription="Object Number" class="sapMObjectNumber sapMObjectNumberStatusNone sapMObjectNumberEmph" style="text-align: right;"><span id="__item5-container-cart---category--productList-5-ObjectNumber-inner" class="sapMObjectNumberInner"><span id="__item5-container-cart---category--productList-5-ObjectNumber-number" class="sapMObjectNumberText">833,00 </span><span id="__item5-container-cart---category--productList-5-ObjectNumber-unit" class="sapMObjectNumberUnit">EUR</span></span><span id="__item5-container-cart---category--productList-5-ObjectNumber-emphasized" class="sapUiPseudoInvisibleText">Emphasized</span></div></div><div style="display: -webkit-box; overflow: hidden;"><span id="__item5-container-cart---category--productList-5-titleText" data-sap-ui="__item5-container-cart---category--productList-5-titleText" dir="auto" class="sapMText sapUiSelectable sapMTextMaxLineWrapper sapMTextMaxWidth sapMObjLTitle" style="text-align: left;"><span id="__item5-container-cart---category--productList-5-titleText-inner" class="sapMTextMaxLine sapMTextLineClamp" style="-webkit-line-clamp: 2;">Mini Tablet</span></span></div></div><div style="clear: both;"></div><div class="sapMObjLBottomRow"><div class="sapMObjLAttrRow"><div class="sapMObjLAttrDiv"><div id="__attribute1-container-cart---category--productList-5" data-sap-ui="__attribute1-container-cart---category--productList-5" class="sapMObjectAttributeDiv"><span id="__text226" data-sap-ui="__text226" dir="auto" class="sapMText sapUiSelectable sapMTextNoWrap sapMTextMaxWidth" style="text-align: left;">Ultrasonic United</span></div></div><div class="sapMObjLStatusDiv"><div id="__status4-container-cart---category--productList-5" data-sap-ui="__status4-container-cart---category--productList-5" aria-roledescription="Object Status" role="group" class="sapMObjStatus sapMObjStatusSuccess"><span id="__status4-container-cart---category--productList-5-text" dir="ltr" class="sapMObjStatusText">Available</span><span id="__status4-container-cart---category--productList-5-state" class="sapUiPseudoInvisibleText">Entry successfully validated</span></div></div></div><div class="sapMObjLAttrRow"><div class="sapMObjLAttrDiv" style="width: 100%;"><div id="__attribute2-container-cart---category--productList-5" data-sap-ui="__attribute2-container-cart---category--productList-5" class="sapMObjectAttributeDiv sapMObjectAttributeActive sapMObjectAttributeTextOnly"><span id="__attribute2-container-cart---category--productList-5-text" tabindex="0" role="link" aria-label="Compare" class="sapMObjectAttributeText"><bdi>Compare</bdi></span></div></div></div></div></div></li><li id="__item5-container-cart---category--productList-6" data-sap-ui="__item5-container-cart---category--productList-6" title="Open details for Smartphone Alpha" tabindex="-1" aria-selected="true" role="option" aria-labelledby="__item5-container-cart---category--productList-6-titleText __item5-container-cart---category--productList-6-ObjectNumber __attribute1-container-cart---category--productList-6 __attribute2-container-cart---category--productList-6 __status4-container-cart---category--productList-6" class="sapMLIB sapMLIB-CTX sapMLIBShowSeparator sapMLIBTypeInactive sapMLIBActionable sapMLIBHoverable sapMLIBSelected sapMLIBFocusable sapMObjLItem sapMObjLListModeDiv"><div id="__item5-container-cart---category--productList-6-content" class="sapMLIBContent"><div class="sapMObjLTopRow"><div class="sapMObjLIconDiv"><img id="__item5-container-cart---category--productList-6-img" data-sap-ui="__item5-container-cart---category--productList-6-img" src="./localService/mockdata/images/HT-9992.jpg" role="presentation" aria-hidden="true" alt="" class="sapMImg sapMObjLIcon"></div><div class="sapMObjLNumberDiv"><div id="__item5-container-cart---category--productList-6-ObjectNumber" data-sap-ui="__item5-container-cart---category--productList-6-ObjectNumber" aria-roledescription="Object Number" class="sapMObjectNumber sapMObjectNumberStatusNone sapMObjectNumberEmph" style="text-align: right;"><span id="__item5-container-cart---category--productList-6-ObjectNumber-inner" class="sapMObjectNumberInner"><span id="__item5-container-cart---category--productList-6-ObjectNumber-number" class="sapMObjectNumberText">599,00 </span><span id="__item5-container-cart---category--productList-6-ObjectNumber-unit" class="sapMObjectNumberUnit">EUR</span></span><span id="__item5-container-cart---category--productList-6-ObjectNumber-emphasized" class="sapUiPseudoInvisibleText">Emphasized</span></div></div><div style="display: -webkit-box; overflow: hidden;"><span id="__item5-container-cart---category--productList-6-titleText" data-sap-ui="__item5-container-cart---category--productList-6-titleText" dir="auto" class="sapMText sapUiSelectable sapMTextMaxLineWrapper sapMTextMaxWidth sapMObjLTitle" style="text-align: left;"><span id="__item5-container-cart---category--productList-6-titleText-inner" class="sapMTextMaxLine sapMTextLineClamp" style="-webkit-line-clamp: 2;">Smartphone Alpha</span></span></div></div><div style="clear: both;"></div><div class="sapMObjLBottomRow"><div class="sapMObjLAttrRow"><div class="sapMObjLAttrDiv"><div id="__attribute1-container-cart---category--productList-6" data-sap-ui="__attribute1-container-cart---category--productList-6" class="sapMObjectAttributeDiv"><span id="__text228" data-sap-ui="__text228" dir="auto" class="sapMText sapUiSelectable sapMTextNoWrap sapMTextMaxWidth" style="text-align: left;">Ultrasonic United</span></div></div><div class="sapMObjLStatusDiv"><div id="__status4-container-cart---category--productList-6" data-sap-ui="__status4-container-cart---category--productList-6" aria-roledescription="Object Status" role="group" class="sapMObjStatus sapMObjStatusSuccess"><span id="__status4-container-cart---category--productList-6-text" dir="ltr" class="sapMObjStatusText">Available</span><span id="__status4-container-cart---category--productList-6-state" class="sapUiPseudoInvisibleText">Entry successfully validated</span></div></div></div><div class="sapMObjLAttrRow"><div class="sapMObjLAttrDiv" style="width: 100%;"><div id="__attribute2-container-cart---category--productList-6" data-sap-ui="__attribute2-container-cart---category--productList-6" class="sapMObjectAttributeDiv sapMObjectAttributeActive sapMObjectAttributeTextOnly"><span id="__attribute2-container-cart---category--productList-6-text" tabindex="0" role="link" aria-label="Compare" class="sapMObjectAttributeText"><bdi>Compare</bdi></span></div></div></div></div></div></li><li id="__item5-container-cart---category--productList-7" data-sap-ui="__item5-container-cart---category--productList-7" title="Open details for Smartphone Beta" tabindex="-1" role="option" aria-selected="false" aria-labelledby="__item5-container-cart---category--productList-7-titleText __item5-container-cart---category--productList-7-ObjectNumber __attribute1-container-cart---category--productList-7 __attribute2-container-cart---category--productList-7 __status4-container-cart---category--productList-7" class="sapMLIB sapMLIB-CTX sapMLIBShowSeparator sapMLIBTypeInactive sapMLIBActionable sapMLIBHoverable sapMLIBFocusable sapMObjLItem sapMObjLListModeDiv"><div id="__item5-container-cart---category--productList-7-content" class="sapMLIBContent"><div class="sapMObjLTopRow"><div class="sapMObjLIconDiv"><img id="__item5-container-cart---category--productList-7-img" data-sap-ui="__item5-container-cart---category--productList-7-img" src="./localService/mockdata/images/HT-9998.jpg" role="presentation" aria-hidden="true" alt="" class="sapMImg sapMObjLIcon"></div><div class="sapMObjLNumberDiv"><div id="__item5-container-cart---category--productList-7-ObjectNumber" data-sap-ui="__item5-container-cart---category--productList-7-ObjectNumber" aria-roledescription="Object Number" class="sapMObjectNumber sapMObjectNumberStatusNone sapMObjectNumberEmph" style="text-align: right;"><span id="__item5-container-cart---category--productList-7-ObjectNumber-inner" class="sapMObjectNumberInner"><span id="__item5-container-cart---category--productList-7-ObjectNumber-number" class="sapMObjectNumberText">699,00 </span><span id="__item5-container-cart---category--productList-7-ObjectNumber-unit" class="sapMObjectNumberUnit">EUR</span></span><span id="__item5-container-cart---category--productList-7-ObjectNumber-emphasized" class="sapUiPseudoInvisibleText">Emphasized</span></div></div><div style="display: -webkit-box; overflow: hidden;"><span id="__item5-container-cart---category--productList-7-titleText" data-sap-ui="__item5-container-cart---category--productList-7-titleText" dir="auto" class="sapMText sapUiSelectable sapMTextMaxLineWrapper sapMTextMaxWidth sapMObjLTitle" style="text-align: left;"><span id="__item5-container-cart---category--productList-7-titleText-inner" class="sapMTextMaxLine sapMTextLineClamp" style="-webkit-line-clamp: 2;">Smartphone Beta</span></span></div></div><div style="clear: both;"></div><div class="sapMObjLBottomRow"><div class="sapMObjLAttrRow"><div class="sapMObjLAttrDiv"><div id="__attribute1-container-cart---category--productList-7" data-sap-ui="__attribute1-container-cart---category--productList-7" class="sapMObjectAttributeDiv"><span id="__text230" data-sap-ui="__text230" dir="auto" class="sapMText sapUiSelectable sapMTextNoWrap sapMTextMaxWidth" style="text-align: left;">Titanium</span></div></div><div class="sapMObjLStatusDiv"><div id="__status4-container-cart---category--productList-7" data-sap-ui="__status4-container-cart---category--productList-7" aria-roledescription="Object Status" role="group" class="sapMObjStatus sapMObjStatusSuccess"><span id="__status4-container-cart---category--productList-7-text" dir="ltr" class="sapMObjStatusText">Available</span><span id="__status4-container-cart---category--productList-7-state" class="sapUiPseudoInvisibleText">Entry successfully validated</span></div></div></div><div class="sapMObjLAttrRow"><div class="sapMObjLAttrDiv" style="width: 100%;"><div id="__attribute2-container-cart---category--productList-7" data-sap-ui="__attribute2-container-cart---category--productList-7" class="sapMObjectAttributeDiv sapMObjectAttributeActive sapMObjectAttributeTextOnly"><span id="__attribute2-container-cart---category--productList-7-text" tabindex="0" role="link" aria-label="Compare" class="sapMObjectAttributeText"><bdi>Compare</bdi></span></div></div></div></div></div></li><li id="__item5-container-cart---category--productList-8" data-sap-ui="__item5-container-cart---category--productList-8" title="Open details for e-Book Reader ReadMe" tabindex="-1" role="option" aria-selected="false" aria-labelledby="__item5-container-cart---category--productList-8-titleText __item5-container-cart---category--productList-8-ObjectNumber __attribute1-container-cart---category--productList-8 __attribute2-container-cart---category--productList-8 __status4-container-cart---category--productList-8" class="sapMLIB sapMLIB-CTX sapMLIBShowSeparator sapMLIBTypeInactive sapMLIBActionable sapMLIBHoverable sapMLIBFocusable sapMObjLItem sapMObjLListModeDiv"><div id="__item5-container-cart---category--productList-8-content" class="sapMLIBContent"><div class="sapMObjLTopRow"><div class="sapMObjLIconDiv"><img id="__item5-container-cart---category--productList-8-img" data-sap-ui="__item5-container-cart---category--productList-8-img" src="./localService/mockdata/images/HT-9997.jpg" role="presentation" aria-hidden="true" alt="" class="sapMImg sapMObjLIcon"></div><div class="sapMObjLNumberDiv"><div id="__item5-container-cart---category--productList-8-ObjectNumber" data-sap-ui="__item5-container-cart---category--productList-8-ObjectNumber" aria-roledescription="Object Number" class="sapMObjectNumber sapMObjectNumberStatusNone sapMObjectNumberEmph" style="text-align: right;"><span id="__item5-container-cart---category--productList-8-ObjectNumber-inner" class="sapMObjectNumberInner"><span id="__item5-container-cart---category--productList-8-ObjectNumber-number" class="sapMObjectNumberText">633,00 </span><span id="__item5-container-cart---category--productList-8-ObjectNumber-unit" class="sapMObjectNumberUnit">EUR</span></span><span id="__item5-container-cart---category--productList-8-ObjectNumber-emphasized" class="sapUiPseudoInvisibleText">Emphasized</span></div></div><div style="display: -webkit-box; overflow: hidden;"><span id="__item5-container-cart---category--productList-8-titleText" data-sap-ui="__item5-container-cart---category--productList-8-titleText" dir="auto" class="sapMText sapUiSelectable sapMTextMaxLineWrapper sapMTextMaxWidth sapMObjLTitle" style="text-align: left;"><span id="__item5-container-cart---category--productList-8-titleText-inner" class="sapMTextMaxLine sapMTextLineClamp" style="-webkit-line-clamp: 2;">e-Book Reader ReadMe</span></span></div></div><div style="clear: both;"></div><div class="sapMObjLBottomRow"><div class="sapMObjLAttrRow"><div class="sapMObjLAttrDiv"><div id="__attribute1-container-cart---category--productList-8" data-sap-ui="__attribute1-container-cart---category--productList-8" class="sapMObjectAttributeDiv"><span id="__text232" data-sap-ui="__text232" dir="auto" class="sapMText sapUiSelectable sapMTextNoWrap sapMTextMaxWidth" style="text-align: left;">Titanium</span></div></div><div class="sapMObjLStatusDiv"><div id="__status4-container-cart---category--productList-8" data-sap-ui="__status4-container-cart---category--productList-8" aria-roledescription="Object Status" role="group" class="sapMObjStatus sapMObjStatusSuccess"><span id="__status4-container-cart---category--productList-8-text" dir="ltr" class="sapMObjStatusText">Available</span><span id="__status4-container-cart---category--productList-8-state" class="sapUiPseudoInvisibleText">Entry successfully validated</span></div></div></div><div class="sapMObjLAttrRow"><div class="sapMObjLAttrDiv" style="width: 100%;"><div id="__attribute2-container-cart---category--productList-8" data-sap-ui="__attribute2-container-cart---category--productList-8" class="sapMObjectAttributeDiv sapMObjectAttributeActive sapMObjectAttributeTextOnly"><span id="__attribute2-container-cart---category--productList-8-text" tabindex="0" role="link" aria-label="Compare" class="sapMObjectAttributeText"><bdi>Compare</bdi></span></div></div></div></div></div></li></ul><div id="container-cart---category--productList-after" tabindex="0" class="sapMListDummyArea sapMListDummyAreaSticky"></div></div></section></div>',
        },
        location:
          'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/index.html?sap-ui-theme=sap_fiori_3#/category/ST/product/HT-9992',
      },
      {
        type: 'clicked',
        control: {
          id: '__item5-container-cart---category--productList-1',
          classes: ['injectClass'],
          domRef:
            '<li id="__item5-container-cart---category--productList-1" data-sap-ui="__item5-container-cart---category--productList-1" title="Open details for Cepat Tablet 10.5" tabindex="0" role="option" aria-selected="false" aria-labelledby="__item5-container-cart---category--productList-1-titleText __item5-container-cart---category--productList-1-ObjectNumber __attribute1-container-cart---category--productList-1 __attribute2-container-cart---category--productList-1 __status4-container-cart---category--productList-1" class="sapMLIB sapMLIB-CTX sapMLIBShowSeparator sapMLIBTypeInactive sapMLIBActionable sapMLIBHoverable sapMLIBFocusable sapMObjLItem sapMObjLListModeDiv injectClass" aria-posinset="2" aria-setsize="9"><div id="__item5-container-cart---category--productList-1-content" class="sapMLIBContent"><div class="sapMObjLTopRow"><div class="sapMObjLIconDiv"><img id="__item5-container-cart---category--productList-1-img" data-sap-ui="__item5-container-cart---category--productList-1-img" src="./localService/mockdata/images/HT-1257.jpg" role="presentation" aria-hidden="true" alt="" class="sapMImg sapMObjLIcon"></div><div class="sapMObjLNumberDiv"><div id="__item5-container-cart---category--productList-1-ObjectNumber" data-sap-ui="__item5-container-cart---category--productList-1-ObjectNumber" aria-roledescription="Object Number" class="sapMObjectNumber sapMObjectNumberStatusNone sapMObjectNumberEmph" style="text-align: right;"><span id="__item5-container-cart---category--productList-1-ObjectNumber-inner" class="sapMObjectNumberInner"><span id="__item5-container-cart---category--productList-1-ObjectNumber-number" class="sapMObjectNumberText">549,00 </span><span id="__item5-container-cart---category--productList-1-ObjectNumber-unit" class="sapMObjectNumberUnit">EUR</span></span><span id="__item5-container-cart---category--productList-1-ObjectNumber-emphasized" class="sapUiPseudoInvisibleText">Emphasized</span></div></div><div style="display: -webkit-box; overflow: hidden;"><span id="__item5-container-cart---category--productList-1-titleText" data-sap-ui="__item5-container-cart---category--productList-1-titleText" dir="auto" class="sapMText sapUiSelectable sapMTextMaxLineWrapper sapMTextMaxWidth sapMObjLTitle" style="text-align: left;"><span id="__item5-container-cart---category--productList-1-titleText-inner" class="sapMTextMaxLine sapMTextLineClamp" style="-webkit-line-clamp: 2;">Cepat Tablet 10.5</span></span></div></div><div style="clear: both;"></div><div class="sapMObjLBottomRow"><div class="sapMObjLAttrRow"><div class="sapMObjLAttrDiv"><div id="__attribute1-container-cart---category--productList-1" data-sap-ui="__attribute1-container-cart---category--productList-1" class="sapMObjectAttributeDiv"><span id="__text218" data-sap-ui="__text218" dir="auto" class="sapMText sapUiSelectable sapMTextNoWrap sapMTextMaxWidth" style="text-align: left;">Ultrasonic United</span></div></div><div class="sapMObjLStatusDiv"><div id="__status4-container-cart---category--productList-1" data-sap-ui="__status4-container-cart---category--productList-1" aria-roledescription="Object Status" role="group" class="sapMObjStatus sapMObjStatusSuccess"><span id="__status4-container-cart---category--productList-1-text" dir="ltr" class="sapMObjStatusText">Available</span><span id="__status4-container-cart---category--productList-1-state" class="sapUiPseudoInvisibleText">Entry successfully validated</span></div></div></div><div class="sapMObjLAttrRow"><div class="sapMObjLAttrDiv" style="width: 100%;"><div id="__attribute2-container-cart---category--productList-1" data-sap-ui="__attribute2-container-cart---category--productList-1" class="sapMObjectAttributeDiv sapMObjectAttributeActive sapMObjectAttributeTextOnly"><span id="__attribute2-container-cart---category--productList-1-text" tabindex="0" role="link" aria-label="Compare" class="sapMObjectAttributeText"><bdi>Compare</bdi></span></div></div></div></div></div></li>',
        },
        location:
          'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/index.html?sap-ui-theme=sap_fiori_3#/category/ST/product/HT-9992',
      },
      {
        type: 'clicked',
        control: {
          id: 'container-cart---product--productImage',
          classes: ['sapUiSmallMargin', 'injectClass'],
          domRef:
            '<span id="container-cart---product--productImage" data-sap-ui="container-cart---product--productImage" class="sapMLightBoxImage sapUiSmallMargin injectClass"><span class="sapMLightBoxMagnifyingGlass"></span><img id="container-cart---product--productImage-inner" src="./localService/mockdata/images/HT-1257.jpg" role="button" tabindex="0" class="sapMImg sapMPointer sapMImgFocusable" style="width: 100%; height: 100%;"></span>',
        },
        location:
          'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/index.html?sap-ui-theme=sap_fiori_3#/category/ST/product/HT-1257',
      },
      {
        type: 'clicked',
        control: {
          id: 'container-cart---product--lightBox-closeButton',
          classes: ['injectClass'],
          domRef:
            '<button id="container-cart---product--lightBox-closeButton" data-sap-ui="container-cart---product--lightBox-closeButton" class="sapMBtnBase sapMBtn injectClass"><span id="container-cart---product--lightBox-closeButton-inner" class="sapMBtnInner sapMBtnHoverable sapMFocusable sapMBtnText sapMBtnTransparent"><span id="container-cart---product--lightBox-closeButton-content" class="sapMBtnContent"><bdi id="container-cart---product--lightBox-closeButton-BDI-content" aria-live="polite">Close</bdi></span></span></button>',
        },
        location:
          'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/index.html?sap-ui-theme=sap_fiori_3#/category/ST/product/HT-1257',
      },
      {
        type: 'clicked',
        control: {
          id: '__button10',
          classes: ['sapMBarChild', 'injectClass'],
          domRef:
            '<button id="__button10" data-sap-ui="__button10" aria-describedby="__text108" class="sapMBtnBase sapMBtn sapMBtnInverted sapMBarChild injectClass"><span id="__button10-inner" class="sapMBtnInner sapMBtnHoverable sapMFocusable sapMBtnText sapMBtnEmphasized"><span id="__button10-content" class="sapMBtnContent"><bdi id="__button10-BDI-content">Add to Cart</bdi></span></span></button>',
        },
        location:
          'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/index.html?sap-ui-theme=sap_fiori_3#/category/ST/product/HT-1257',
      },
      {
        type: 'clicked',
        control: {
          id: '__button9-img',
          classes: [
            'sapMBtnCustomIcon',
            'sapMBtnIcon',
            'sapMBtnIconLeft',
            'injectClass',
          ],
          domRef:
            '<span id="__button9-img" data-sap-ui="__button9-img" role="presentation" aria-hidden="true" data-sap-ui-icon-content="" class="sapUiIcon sapUiIconMirrorInRTL sapMBtnCustomIcon sapMBtnIcon sapMBtnIconLeft injectClass" style="font-family: SAP-icons;"></span>',
        },
        location:
          'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/index.html?sap-ui-theme=sap_fiori_3#/category/ST/product/HT-1257',
      },
      {
        type: 'clicked',
        control: {
          id: 'container-cart---cartView--page-navButton-iconBtn',
          classes: ['sapMBtnIcon', 'sapMBtnIconLeft', 'injectClass'],
          domRef:
            '<span id="container-cart---cartView--page-navButton-iconBtn" data-sap-ui="container-cart---cartView--page-navButton-iconBtn" role="presentation" aria-hidden="true" data-sap-ui-icon-content="" class="sapUiIcon sapUiIconMirrorInRTL sapMBtnIcon sapMBtnIconLeft injectClass" style="font-family: SAP-icons;"></span>',
        },
        location:
          'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/index.html?sap-ui-theme=sap_fiori_3#/category/ST/product/HT-1257/cart',
      },
      {
        type: 'clicked',
        control: {
          id: 'container-cart---cartView--page-navButton-iconBtn',
          classes: ['sapMBtnIcon', 'sapMBtnIconLeft', 'injectClass'],
          domRef:
            '<span id="container-cart---cartView--page-navButton-iconBtn" data-sap-ui="container-cart---cartView--page-navButton-iconBtn" role="presentation" aria-hidden="true" data-sap-ui-icon-content="" class="sapUiIcon sapUiIconMirrorInRTL sapMBtnIcon sapMBtnIconLeft injectClass" style="font-family: SAP-icons;"></span>',
        },
        location:
          'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/index.html?sap-ui-theme=sap_fiori_3#/category/ST/product/HT-1257',
      },
      {
        type: 'clicked',
        control: {
          id: '__button2-img',
          classes: [
            'sapMBtnCustomIcon',
            'sapMBtnIcon',
            'sapMBtnIconLeft',
            'injectClass',
          ],
          domRef:
            '<span id="__button2-img" data-sap-ui="__button2-img" role="presentation" aria-hidden="true" data-sap-ui-icon-content="" class="sapUiIcon sapUiIconMirrorInRTL sapMBtnCustomIcon sapMBtnIcon sapMBtnIconLeft injectClass" style="font-family: SAP-icons;"></span>',
        },
        location:
          'https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/index.html?sap-ui-theme=sap_fiori_3#',
      },
    ];

    this.scenario = this.scenarioService.createScenarioFromRecording(
      this.steps
    );

    this.scenarioSteps = this.scenario.testPages.reduce(
      (steps: Step[], tp: Page) => {
        const newSteps = [...steps, ...tp.steps];
        return newSteps;
      },
      []
    );
  }
}
