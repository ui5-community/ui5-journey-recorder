import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CodePageComponent } from './pages/code-page/code-page.component';
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
            path: 'step/:stepId',
            component: StepPageComponent,
          },
          {
            path: 'code',
            component: CodePageComponent,
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
