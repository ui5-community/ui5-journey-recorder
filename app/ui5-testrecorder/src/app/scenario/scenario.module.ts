//#region angular region
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
//#endregion
//#region self-components
import { ObjectPageComponent } from './pages/object/object_page.component';
import { RecordStopDialogComponent } from './dialogs/RecordStopDialog/RecordStopDialog.component';
import { ScenarioRoutingModule } from './scenario-routing.module';
//#endregion
//#region prime-ng
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';
import { PanelModule } from 'primeng/panel';
import { TreeModule } from 'primeng/tree';
import { SimpleListComponent } from './components/simple-list/simple-list.component';
import { ActionImagePipe } from './pipes/actionImage.pipe';
import { RecordingPageComponent } from './pages/recording/recording_page.component';
import { StepPageComponent } from './pages/step/step_page.component';
import { ScenarioComponent } from './scenario.component';
//#endregion

@NgModule({
  declarations: [
    ObjectPageComponent,
    RecordingPageComponent,
    RecordStopDialogComponent,
    ScenarioComponent,
    SimpleListComponent,
    StepPageComponent,
    ActionImagePipe
  ],
  imports: [
    CommonModule,
    ScenarioRoutingModule,
    FormsModule,
    //#region prime-ng
    ButtonModule,
    DynamicDialogModule,
    PanelModule,
    TreeModule,
    //#endregion
  ],
  providers: [
    //#region prime-ng
    DialogService,
    //#endregion
  ],
  entryComponents: [RecordStopDialogComponent],
})
export class ScenarioModule {}
