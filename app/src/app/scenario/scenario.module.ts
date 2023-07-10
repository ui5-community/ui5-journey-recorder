//#region angular
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
//#endregion

import { ScenarioRoutingModule } from './scenario-routing.module';
import { ScenarioComponent } from './scenario.component';

//#region components
import { RecordStopDialogComponent } from './dialogs/RecordStopDialog/RecordStopDialog.component';
//#endregion

//#region pages
import { RecordingPageComponent } from './pages/recording/recording_page.component';
import { StepPageComponent } from './pages/step/step_page.component';
import { ObjectPageComponent } from './pages/object/object_page.component';
import { CodePageComponent } from './pages/code-page/code-page.component';
//#endregion

//#region pipes/services
import { ActionImagePipe } from './pipes/actionImage.pipe';
import { CodeService } from './codeService/codeService.service';
//#endregion

//#region material
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MatLegacyRadioModule as MatRadioModule } from '@angular/material/legacy-radio';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTreeModule } from '@angular/material/tree';
import { ReplaySetupDialogComponent } from './dialogs/ReplaySetupDialog/ReplaySetupDialog.component';
//#endregion material

@NgModule({
  declarations: [
    ObjectPageComponent,
    RecordingPageComponent,
    RecordStopDialogComponent,
    ReplaySetupDialogComponent,
    ScenarioComponent,
    StepPageComponent,
    ActionImagePipe,
    CodePageComponent,
  ],
  imports: [
    CommonModule,
    ScenarioRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    ClipboardModule,
    //#region material
    MatListModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatToolbarModule,
    MatTooltipModule,
    MatExpansionModule,
    MatTabsModule,
    MatSelectModule,
    MatTableModule,
    MatCheckboxModule,
    MatMenuModule,
    MatRadioModule,
    MatSidenavModule,
    MatTreeModule,
    //#endregion matieral
  ],
  providers: [CodeService],
})
export class ScenarioModule {}
