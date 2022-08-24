import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Step } from 'src/app/classes/testScenario';

@Component({
  selector: 'app-simple-list',
  templateUrl: './simple-list.component.html',
  styleUrls: ['./simple-list.component.css'],
})
export class SimpleListComponent {
  private _data: any[] | undefined;
  @Output()
  public action: EventEmitter<Step> = new EventEmitter();
  @Output()
  public select: EventEmitter<Step> = new EventEmitter();

  @Input()
  public replay: boolean = false;

  @Input()
  set data(d: any[]) {
    this._data = d;
  }

  get data(): any[] {
    return this._data || [];
  }
}
