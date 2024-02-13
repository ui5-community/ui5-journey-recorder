import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({
  selector: '[appTemplate]',
  host: {},
})
export class AppTemplateDirective {
  @Input('appTemplate') name?: string;

  constructor(public template: TemplateRef<any>) {}

  getType(): string {
    return this.name || '';
  }
}
