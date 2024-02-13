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
import { MatListModule as MatListModule } from '@angular/material/list';
import { MatFormFieldModule as MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule as MatButtonModule } from '@angular/material/button';
import { MatInputModule as MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule as MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule as MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule as MatSelectModule } from '@angular/material/select';
import { MatTableModule as MatTableModule } from '@angular/material/table';
import { MatCheckboxModule as MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule as MatMenuModule } from '@angular/material/menu';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MatRadioModule as MatRadioModule } from '@angular/material/radio';
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
