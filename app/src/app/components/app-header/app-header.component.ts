import {
  AfterContentInit,
  Component,
  ContentChildren,
  Input,
  OnInit,
  QueryList,
  TemplateRef,
} from '@angular/core';
import { MatDialog as MatDialog, MatDialogConfig as MatDialogConfig } from '@angular/material/dialog';
import { AppTemplateDirective } from 'src/app/directives/app-template.directive';
import { SettingsDialogComponent } from '../dialogs/settings-dialog/settings-dialog.component';
import { AppHeaderService } from './app-header.service';
@Component({
  selector: 'app-header',
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.scss'],
})
export class AppHeaderComponent implements OnInit, AfterContentInit {
  actionButtonsTemplate: TemplateRef<any> | null = null;
  titleContentTemplate: TemplateRef<any> | null = null;

  @Input('title') title?: string;
  @Input('icon') icon?: string;

  @ContentChildren(AppTemplateDirective)
  templates?: QueryList<AppTemplateDirective>;

  constructor(
    public appHeaderService: AppHeaderService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {}

  ngAfterContentInit() {
    this.templates?.forEach((item) => {
      switch (item.getType()) {
        case 'actionButtons':
          this.actionButtonsTemplate = item.template;
          break;
        case 'titleContent':
          this.titleContentTemplate = item.template;
          break;
      }
    });
  }

  navBack() {
    this.appHeaderService.navigateBackwards();
  }

  openSettingsDialog() {
    this.dialog.open(SettingsDialogComponent, {
      disableClose: true,
      closeOnNavigation: false,
    });
  }
}
