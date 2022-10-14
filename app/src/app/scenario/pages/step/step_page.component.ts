import { Clipboard } from '@angular/cdk/clipboard';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Step, StepType, UnknownStep } from 'src/app/classes/Step';
import { AppHeaderService } from 'src/app/components/app-header/app-header.service';
import { SnackSeverity } from 'src/app/components/dialogs/snack-dialog/snack-dialog.component';
import { SettingsStorageService } from 'src/app/services/localStorageService/settingsStorageService.service';
import { MessageService } from 'src/app/services/messageService/message.service';
import { ScenarioService } from 'src/app/services/scenarioService/scenario.service';
import { CodeService, CodeStyles } from '../../codeService/codeService.service';

interface Attribute {
  name: string;
  value: string | number | boolean;
  use: boolean;
}

interface Binding {
  propertyName: string;
  bindingValue: string | number | boolean;
  modelPath: string;
  propertyPath: string;
  modelName: string;
  use: boolean;
}

interface I18nText {
  propertyName: string;
  propertyPath: string;
  bindingValue: any;
  use: boolean;
}

@Component({
  selector: 'app-step-page',
  templateUrl: './step_page.component.html',
  styleUrls: ['./step_page.component.scss'],
})
export class StepPageComponent implements OnInit {
  private scenario_id: string | undefined;
  private control_id: string | undefined;

  pagedCode = false;
  currentStep: Step = new UnknownStep();
  attributesTableData: Attribute[] = [];
  bindingsTableData: Binding[] = [];
  i18nTableData: I18nText[] = [];

  displayedColumns: string[] = ['name', 'value', 'use'];
  displayColsBinding: string[] = [
    'property',
    'value',
    'model',
    'bindingPath',
    'use',
  ];
  displayColsI18n: string[] = ['property', 'value', 'bindingPath', 'use'];

  steps = [
    { text: 'Click', step: StepType.Click },
    { text: 'Input', step: StepType.Input },
    { text: 'KeyPress', step: StepType.KeyPress },
    { text: 'Validate', step: StepType.Validation },
  ];

  codeData = {
    language: 'javascript',
    value: '',
  };
  selected: CodeStyles = CodeStyles.OPA5;
  codeStyles: CodeStyles[] = [CodeStyles.OPA5, CodeStyles.WDI5];

  constructor(
    private active_route: ActivatedRoute,
    private scenario_service: ScenarioService,
    private app_header_service: AppHeaderService,
    private messageService: MessageService,
    private settingsService: SettingsStorageService,
    private clipboard: Clipboard
  ) {}

  ngOnInit(): void {
    this.app_header_service.showBack();
    this.active_route.params.subscribe((parameters: Params) => {
      this.scenario_id = parameters['scenarioId'];
      this.control_id = parameters['controlId'];
      this.scenario_service
        .getStep(this.scenario_id || '', this.control_id || '')
        .then((step: Step) => {
          this.currentStep = step;
          this.attributesTableData = this.currentStep.controlAttributes;
          this.bindingsTableData = this.currentStep.controlBindings;
          this.i18nTableData = this.currentStep.controlI18nTexts;
        })
        .catch(() => {
          this.app_header_service.navigateBackwards();
        });
    });

    this.selected = this.settingsService.codeStyle;
  }

  setType(type: StepType): void {
    this.currentStep.actionType = type;
  }

  useIdChanged(val: boolean) {
    this.currentStep.useControlId = val;
  }

  generateStepCode() {
    if (this.currentStep) {
      if (this.pagedCode) {
        this.codeData.value = CodeService.generatePagedStepCode(
          this.currentStep,
          {
            style: this.selected,
          }
        ).trim();
      } else {
        this.codeData.value = CodeService.generateStepCode(this.currentStep, {
          style: this.selected,
        }).trim();
      }
    }
  }

  useControlId(event: any): void {
    if (this.currentStep) {
      this.currentStep.useControlId = event.checked;
    }
  }

  checkUniqueness(): void {
    if (this.currentStep) {
      this.scenario_service
        .validateStepUniqueness(this.currentStep)
        .then((result) => {
          if (result.data === 1) {
            this.messageService.show({
              severity: SnackSeverity.SUCCESS,
              title: 'Valid',
              detail: 'Only one item found!',
              icon: 'verified',
            });
          } else {
            this.messageService.show({
              severity: SnackSeverity.WARNING,
              title: 'Insufficient',
              detail: 'More than one item matches!',
              icon: 'report',
            });
          }
        });
    }
  }

  copyCode(code: string = '') {
    this.clipboard.copy(code);
    this.messageService.show({
      severity: SnackSeverity.SUCCESS,
      title: 'Copy Successfull',
    });
  }
}
