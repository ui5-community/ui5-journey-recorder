//#region @angular
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
//#endregion

//#region prime-ng
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TabViewModule } from 'primeng/tabview';
//#endregion

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

//#region components
import { AppHeaderComponent } from './components/app-header/app-header.component';
import { AppFooterComponent } from './components/app-footer/app-footer.component';
import { AppFooterService } from './components/app-footer/app-footer.service';
import { AppHeaderService } from './components/app-header/app-header.service';
//#endregion

//#region services
import { ChromeExtensionService } from './services/chromeExtensionService/chrome_extension_service';
import { ScenarioService } from './services/scenarioService/scenario.service';
import { ScenarioStorageService } from './services/localStorageService/scenarioStorageService.service';
import { CodeService } from './services/codeService/codeService.service';
//#endregion

//#region pages
import { MainComponent } from './pages/main/main.component';
//#endregion

//#region directives
import { AppTemplateDirective } from './directives/app-template.directive';
//#endregion

@NgModule({
  declarations: [
    AppComponent,
    AppHeaderComponent,
    AppFooterComponent,
    MainComponent,
    AppTemplateDirective,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    //#region prime-ng
    InputTextModule,
    ButtonModule,
    ConfirmDialogModule,
    ToastModule,
    TabViewModule,
    //#endregion
  ],
  providers: [
    ConfirmationService,
    CodeService,
    MessageService,
    AppFooterService,
    AppHeaderService,
    ChromeExtensionService,
    ScenarioService,
    ScenarioStorageService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
