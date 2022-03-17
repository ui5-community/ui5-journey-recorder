import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MainComponent } from './main/main.component';
import { ObjectPageComponent } from './object/object_page.component';
import { EntryRoutingModule } from './entry-routing.module';
import { ServicesModule } from '../services/services.module';
import { ButtonModule } from 'primeng/button';

//#region prime-ng
//#endregion



@NgModule({
  declarations: [
    MainComponent,
    ObjectPageComponent
  ],
  imports: [
    CommonModule,
    EntryRoutingModule,
    ServicesModule,
    //#region prime-ng
    ButtonModule,
    FormsModule
    //#endregion
  ],
  providers: [
    //#region prime-ng
    //#endregion
  ]
})
export class EntryModule { }
