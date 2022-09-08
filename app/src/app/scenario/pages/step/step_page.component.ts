import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Params } from '@angular/router';
import { Step, StepType, UnknownStep } from 'src/app/classes/testScenario';
import { AppHeaderService } from 'src/app/components/app-header/app-header.service';
import { SnackSeverity } from 'src/app/components/dialogs/snack-dialog/snack-dialog.component';
import { MessageService } from 'src/app/services/messageService/message.service';
import { ScenarioService } from 'src/app/services/scenarioService/scenario.service';
import { CodeService, CodeStyles } from '../../codeService/codeService.service';

interface Attribute {
  name: string;
  value: string | number | boolean;
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
  displayedColumns: string[] = ['name', 'value', 'use'];

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

  constructor(
    private active_route: ActivatedRoute,
    private scenario_service: ScenarioService,
    private app_header_service: AppHeaderService,
    private messageService: MessageService
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
        })
        .catch(() => {
          this.app_header_service.navigateBackwards();
        });
    });
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
            style: CodeStyles.OPA5,
          }
        );
      } else {
        this.codeData.value = CodeService.generateStepCode(this.currentStep, {
          style: CodeStyles.OPA5,
        });
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
}
