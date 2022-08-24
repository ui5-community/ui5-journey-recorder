import {
  AfterContentInit,
  Component,
  ContentChildren,
  Input,
  QueryList,
  TemplateRef,
} from '@angular/core';
import { Location } from '@angular/common';
import { AppTemplateDirective } from 'src/app/directives/app-template.directive';
import { AppHeaderService } from './app-header.service';

@Component({
  selector: 'app-header',
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.css'],
})
export class AppHeaderComponent implements AfterContentInit {
  actionButtonsTemplate: TemplateRef<any> | null = null;
  titleContentTemplate: TemplateRef<any> | null = null;

  @Input('title') title?: string;
  @Input('icon') icon?: string;

  @ContentChildren(AppTemplateDirective)
  templates?: QueryList<AppTemplateDirective>;

  constructor(
    public appHeaderService: AppHeaderService,
    private _location: Location
  ) {}

  ngAfterContentInit() {
    this.templates?.forEach((item) => {
      switch (item.getType()) {
        case 'actionButtons':
          this.actionButtonsTemplate = item.template;
          break;
        case 'titleContent':
          this.actionButtonsTemplate = item.template;
          break;
      }
    });
  }

  navBack() {
    this._location.back();
  }
}
