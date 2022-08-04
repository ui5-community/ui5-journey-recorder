import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ObjectPageComponent } from './pages/object/object_page.component';
import { RecordingPageComponent } from './pages/recording/recording_page.component';

const routes: Routes = [
  {
    path: 'recording/:tabId',
    component: RecordingPageComponent,
  },
  { path: 'scenarioView/:scenarioId', component: ObjectPageComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ScenarioRoutingModule {}
