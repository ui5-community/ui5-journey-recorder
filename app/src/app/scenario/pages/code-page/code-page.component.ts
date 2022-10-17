import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Params } from '@angular/router';
import { TestScenario } from 'src/app/classes/testScenario';
import { AppHeaderService } from 'src/app/components/app-header/app-header.service';
import { ScenarioService } from 'src/app/services/scenarioService/scenario.service';
import { CodeService, CodeStyles } from '../../codeService/codeService.service';
import { MatOptionSelectionChange } from '@angular/material/core';
import { SettingsStorageService } from 'src/app/services/localStorageService/settingsStorageService.service';
import * as JSZip from 'jszip';

@Component({
  selector: 'app-code-page',
  templateUrl: './code-page.component.html',
  styleUrls: ['./code-page.component.scss'],
})
export class CodePageComponent implements OnInit {
  codePages: { title: string; code: string; type: 'journey' | 'page' }[] = [];
  scenario: TestScenario = new TestScenario('0');
  selected: CodeStyles = CodeStyles.OPA5;
  codeStyles: CodeStyles[] = [CodeStyles.OPA5, CodeStyles.WDI5];

  private scenario_id: string = '';
  constructor(
    private location: Location,
    private scenarioService: ScenarioService,
    private app_header_service: AppHeaderService,
    private incommingRoute: ActivatedRoute,
    private settingsService: SettingsStorageService
  ) {}

  ngOnInit(): void {
    this.app_header_service.showBack();
    this.selected = this.settingsService.settings.codeStyle;
    this.incommingRoute.params.subscribe((params: Params) => {
      this.scenario_id = params['scenarioId'];
      this.scenarioService
        .getScenario(this.scenario_id)
        .then((scen: TestScenario | undefined) => {
          if (!scen) {
            this.navBack();
          } else {
            this.scenario = scen;
            this.generate();
          }
        })
        .catch(() => this.navBack.bind(this));
    });
  }

  navBack(): void {
    this.location.back();
  }

  selectionChanged(event: MatOptionSelectionChange) {
    this.selected = event.source.value;
    this.generate();
  }

  generate() {
    this.codePages = CodeService.generateScenarioCode(this.scenario, {
      style: this.selected,
    });
  }

  downloadPage(p: { title: string; code: string }): void {
    const el = document.createElement('a');
    el.setAttribute(
      'href',
      `data:text/javascript;charset=utf-8,${encodeURIComponent(p.code)}`
    );
    const fileName = `${this.replaceUnsupportedFileSigns(p.title, '_')}.js`;
    el.setAttribute('download', fileName);
    el.style.display = 'none';
    el.click();
  }

  downloadAll(): void {
    const zip = new JSZip();
    if (this.selected === CodeStyles.OPA5) {
      const jurney = this.codePages.find((p) => p.type === 'journey');
      const pages = this.codePages.filter((p) => p.type === 'page');

      const integrationFolder = zip.folder('integration');
      const pagesFolder = integrationFolder?.folder('pages');
      integrationFolder?.file(
        `${this.replaceUnsupportedFileSigns(jurney?.title || '', '_')}.js`,
        jurney?.code || ''
      );

      pages.forEach((p) => {
        pagesFolder?.file(
          `${this.replaceUnsupportedFileSigns(p.title, '_')}.js`,
          p.code
        );
      });
    } else {
      const wdi5Folder = zip.folder('wdi5_test');
      this.codePages.forEach((p) => {
        wdi5Folder?.file(
          `${this.replaceUnsupportedFileSigns(p.title, '_')}.js`,
          p.code
        );
      });
    }

    zip.generateAsync({ type: 'blob' }).then((content) => {
      const el = document.createElement('a');
      el.setAttribute('href', URL.createObjectURL(content));
      const fileName = `${this.replaceUnsupportedFileSigns(
        this.scenario.name,
        '_'
      )}.zip`;
      el.setAttribute('download', fileName);
      el.style.display = 'none';
      el.click();
    });
  }

  private replaceUnsupportedFileSigns(s: string, replacement: string): string {
    return s.replace(/[\s\/\\\:\*\?\"\<\>\|\-]+/gm, replacement);
  }
}
