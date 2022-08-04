import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChromeExtensionService } from './chromeExtensionService/chrome_extension_service';
import { ScenarioService } from './scenarioService/scenario.service';

@NgModule({
  declarations: [],
  imports: [CommonModule],
  providers: [ChromeExtensionService, ScenarioService],
})
export class ServicesModule {}
