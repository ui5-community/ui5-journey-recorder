import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ObjectPageComponent } from './pages/object/object_page.component';
import { RecordingPageComponent } from './pages/recording/recording_page.component';
import { StepPageComponent } from './pages/step/step_page.component';
import { ScenarioComponent } from './scenario.component';

const routes: Routes = [
  {
    path: '',
    component: ScenarioComponent,
    children: [
      {
        path: 'recording',
        component: RecordingPageComponent,
      },
      {
        path: 'scenarioDetail/:scenarioId',
        children: [
          { path: '', component: ObjectPageComponent },
          {
            path: 'step/:controlId',
            component: StepPageComponent,
          },
        ],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ScenarioRoutingModule {}
