import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './main/main.component';
import { ObjectPageComponent } from './object/object_page.component';

const routes: Routes = [
  { path: '', component: MainComponent },
  { path: 'objectPage/:tabId', component: ObjectPageComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EntryRoutingModule { }
