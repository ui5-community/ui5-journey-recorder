import { Component } from '@angular/core';
import { LoaderService } from 'src/app/services/loaderService/loaderService';

@Component({
  selector: 'app-spinner',
  template: `
    <div *ngIf="this.loadService.loading | async" class="cssload-container">
      <div class="spinner-container">
        <div class="spinner"></div>
      </div>
    </div>
  `,
  styleUrls: ['./globalSpinner.component.scss'],
})
export class GlobalSpinnerComponent {
  constructor(public loadService: LoaderService) {}
}
