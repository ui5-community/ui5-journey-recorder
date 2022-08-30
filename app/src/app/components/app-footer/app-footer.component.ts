import { Component } from '@angular/core';
import { AppFooterService } from './app-footer.service';

@Component({
  selector: 'app-footer',
  templateUrl: './app-footer.component.html',
  styleUrls: ['./app-footer.component.scss'],
})
export class AppFooterComponent {
  constructor(public footerService: AppFooterService) {}
}
