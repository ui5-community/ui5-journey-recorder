import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AppFooter } from './components/app-footer/app-footer.component';
import { AppFooterService } from './components/app-footer/app-footer.service';
import { MainComponent } from './pages/main/main.component';
import { ChromeExtensionService } from './services/chromeExtensionService/chrome_extension_service';
import { ScenarioService } from './services/scenarioService/scenario.service';
import { ScenarioStorageService } from './services/localStorageService/scenarioStorageService.service';

//#region prime-ng
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TabViewModule } from 'primeng/tabview';
//#endregion

@NgModule({
  declarations: [AppComponent, AppFooter, MainComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    //#region prime-ng
    ButtonModule,
    ConfirmDialogModule,
    ToastModule,
    TabViewModule,
    //#endregion
  ],
  providers: [
    ConfirmationService,
    MessageService,
    AppFooterService,
    ChromeExtensionService,
    ScenarioService,
    ScenarioStorageService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
