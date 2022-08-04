import { Component, Input, OnInit } from '@angular/core';
import { Step } from 'src/app/services/classes/testScenario';

@Component({
  selector: 'app-simple-list',
  templateUrl: './simple-list.component.html',
  styleUrls: ['./simple-list.component.css'],
})
export class SimpleListComponent implements OnInit {
  private _data: any[] | undefined;

  @Input()
  set data(d: any[]) {
    this._data = d;
  }

  get data(): any[] {
    return this._data || [];
  }

  ngOnInit(): void {}

  editViewStep(s: Step): void {
    console.log('Item for edit', s);
  }
}
