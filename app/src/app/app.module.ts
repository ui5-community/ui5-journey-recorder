//#region @angular
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
//#endregion

//#region material
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
//#endregion material

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

//#region components
import { AppHeaderComponent } from './components/app-header/app-header.component';
import { AppFooterComponent } from './components/app-footer/app-footer.component';
import { AppFooterService } from './components/app-footer/app-footer.service';
import { AppHeaderService } from './components/app-header/app-header.service';
import { ConfirmDialogComponent } from './components/dialogs/confirm-dialog/confirm-dialog.component';
//#endregion

//#region services
import { ChromeExtensionService } from './services/chromeExtensionService/chrome_extension_service';
import { ScenarioService } from './services/scenarioService/scenario.service';
import { ScenarioStorageService } from './services/localStorageService/scenarioStorageService.service';
import { MessageService } from './services/messageService/message.service';
//#endregion

//#region pages
import { MainComponent } from './pages/main/main.component';
//#endregion

//#region directives
import { AppTemplateDirective } from './directives/app-template.directive';
import { SnackDialogComponent } from './components/dialogs/snack-dialog/snack-dialog.component';
import { SettingsDialogComponent } from './components/dialogs/settings-dialog/settings-dialog.component';
import { MatSelectModule as MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { SettingsStorageService } from './services/localStorageService/settingsStorageService.service';
import { LoaderService } from './services/loaderService/loaderService';
import { GlobalSpinnerComponent } from './components/globalSpinner/globalSpinner.component';
//#endregion

@NgModule({
  declarations: [
    AppComponent,
    AppHeaderComponent,
    AppFooterComponent,
    MainComponent,
    AppTemplateDirective,
    ConfirmDialogComponent,
    SnackDialogComponent,
    SettingsDialogComponent,
    GlobalSpinnerComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    //#region material
    MatTabsModule,
    MatButtonModule,
    MatListModule,
    MatInputModule,
    MatIconModule,
    MatFormFieldModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatCheckboxModule,
    MatSelectModule,
    MatExpansionModule,
    MatRadioModule,
    //#endregion
  ],
  providers: [
    AppFooterService,
    AppHeaderService,
    ChromeExtensionService,
    MessageService,
    ScenarioService,
    ScenarioStorageService,
    SettingsStorageService,
    LoaderService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor(private _: SettingsStorageService) {}
}
