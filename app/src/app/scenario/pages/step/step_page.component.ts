import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Params } from '@angular/router';
import { Step } from 'src/app/classes/testScenario';
import { AppHeaderService } from 'src/app/components/app-header/app-header.service';
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
  currentStep: Step | undefined;
  attributesTableData: Attribute[] = [];
  displayedColumns: string[] = ['name', 'value', 'use'];

  codeData = {
    language: 'javascript',
    value: '',
  };

  constructor(
    private active_route: ActivatedRoute,
    private scenario_service: ScenarioService,
    private app_header_service: AppHeaderService
  ) {}
  ngOnInit(): void {
    this.app_header_service.showBack();
    this.active_route.params.subscribe(async (parameters: Params) => {
      this.scenario_id = parameters['scenarioId'];
      this.control_id = parameters['controlId'];
      this.currentStep = await this.scenario_service.getStep(
        this.scenario_id || '',
        this.control_id || ''
      );
      this.attributesTableData = this.currentStep.controlAttributes;
    });
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
}
