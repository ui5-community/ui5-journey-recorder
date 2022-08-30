import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Params } from '@angular/router';
import { TestScenario } from 'src/app/classes/testScenario';
import { AppHeaderService } from 'src/app/components/app-header/app-header.service';
import { ScenarioService } from 'src/app/services/scenarioService/scenario.service';
import { CodeService, CodeStyles } from '../../codeService/codeService.service';

@Component({
  selector: 'app-code-page',
  templateUrl: './code-page.component.html',
  styleUrls: ['./code-page.component.scss'],
})
export class CodePageComponent implements OnInit {
  codePages: { title: string; code: string }[] = [];
  scenario: TestScenario = new TestScenario('0');
  selected: CodeStyles = CodeStyles.OPA5;
  codeStyles: CodeStyles[] = [CodeStyles.OPA5];

  private scenario_id: string = '';
  constructor(
    private location: Location,
    private scenarioService: ScenarioService,
    private app_header_service: AppHeaderService,
    private incommingRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.app_header_service.showBack();
    this.incommingRoute.params.subscribe((params: Params) => {
      this.scenario_id = params['scenarioId'];
      this.scenarioService
        .getScenario(this.scenario_id)
        .then((scen: TestScenario | undefined) => {
          if (!scen) {
            this.navBack();
          } else {
            this.scenario = scen;
            this.codePages = CodeService.generateScenarioCode(this.scenario, {
              style: this.selected,
            });
          }
        })
        .catch(() => this.navBack.bind(this));
    });
  }

  navBack(): void {
    this.location.back();
  }
}
