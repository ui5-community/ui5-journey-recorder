//#region angular
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule} from '@angular/material/menu';
//#endregion material

@NgModule({
  declarations: [
    ObjectPageComponent,
    RecordingPageComponent,
    RecordStopDialogComponent,
    ScenarioComponent,
    StepPageComponent,
    ActionImagePipe,
    CodePageComponent,
  ],
  imports: [
    CommonModule,
    ScenarioRoutingModule,
    FormsModule,
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
    //#endregion matieral
  ],
  providers: [CodeService],
})
export class ScenarioModule {}
