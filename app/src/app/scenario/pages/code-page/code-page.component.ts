import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Params } from '@angular/router';
import { TestScenario } from 'src/app/classes/testScenario';
import { AppHeaderService } from 'src/app/components/app-header/app-header.service';
import { ScenarioService } from 'src/app/services/scenarioService/scenario.service';
import {
  CodeService,
  CodeStyles,
  PageType,
} from '../../codeService/codeService.service';
import { MatOptionSelectionChange } from '@angular/material/core';
import { SettingsStorageService } from 'src/app/services/localStorageService/settingsStorageService.service';
import * as JSZip from 'jszip';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MessageService } from 'src/app/services/messageService/message.service';
import { SnackSeverity } from 'src/app/components/dialogs/snack-dialog/snack-dialog.component';

interface FileNode {
  name: string;
  isRoot?: boolean;
  active?: boolean;
  content?: string;
  children?: FileNode[];
}

const SEPARATOR_REPLACEMENT = '_';

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

  drawerOpen: boolean = true;
  testData: FileNode[] = [];
  treeControl = new NestedTreeControl<FileNode>((node) => node.children);
  currContent: string = '';

  private scenario_id: string = '';
  constructor(
    private location: Location,
    private scenarioService: ScenarioService,
    private app_header_service: AppHeaderService,
    private incommingRoute: ActivatedRoute,
    private settingsService: SettingsStorageService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.drawerOpen = false;
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

    const rootNode: FileNode = {
      isRoot: true,
      name: this.scenario.name,
      children: [],
    };

    const integrationFolder: FileNode = {
      name: this.selected === CodeStyles.WDI5 ? 'e2e' : 'integration',
      children: [],
    };

    const pagesFolder: FileNode = {
      name: 'pages',
      children: [],
    };

    if (this.selected === CodeStyles.OPA5) {
      integrationFolder.children?.push(pagesFolder);
    }

    this.codePages.forEach((cp) => {
      if (cp.type === PageType.PAGE) {
        if (!pagesFolder.children) {
          pagesFolder.children = [];
        }
        pagesFolder.children.push({
          name: cp.title.replace(/\s/gm, SEPARATOR_REPLACEMENT) + '.js',
          content: cp.code,
        });
      }
      if (cp.type === PageType.JOURNEY) {
        if (!integrationFolder.children) {
          integrationFolder.children = [];
        }
        integrationFolder.children.push({
          name:
            (cp.title.replace(/\s/gm, SEPARATOR_REPLACEMENT) ||
              this.scenario.name.replace(/\s/gm, SEPARATOR_REPLACEMENT)) +
            '.js',
          content: cp.code,
          active: true,
        });
        this.currContent = cp.code;
      }
    });

    rootNode.children?.push(integrationFolder);
    this.testData = [rootNode];
    //so we can used the programatically expand of nodes
    //https://github.com/angular/components/issues/12170
    this.treeControl.dataNodes = this.testData;
    this.treeControl.expand(rootNode);
    this.treeControl.expand(integrationFolder);
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

  copyCode() {
    navigator.clipboard.writeText(this.currContent);
    this.messageService.show({
      severity: SnackSeverity.SUCCESS,
      title: 'Copied',
      detail: 'Code copied to the clipboard',
      icon: 'content_copy',
    });
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

  onFileClicked(node: FileNode): void {
    this.currContent = node.content || '';
    this._resetActiveState(this.testData[0]);
    node.active = true;
  }

  hasChild(_: number, node: FileNode): boolean {
    return !!node.children && node.children.length > 0;
  }

  private _resetActiveState(node: FileNode) {
    node.active = false;
    node.children?.forEach(this._resetActiveState.bind(this));
  }

  private replaceUnsupportedFileSigns(s: string, replacement: string): string {
    return s.replace(/[\s\/\\\:\*\?\"\<\>\|\-]+/gm, replacement);
  }
}
