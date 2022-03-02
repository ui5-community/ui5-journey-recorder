import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainComponent } from './main/main.component';

//#region prime-ng
import { TableModule } from 'primeng/table';
import { EntryRoutingModule } from './entry-routing.module';
import { ServicesModule } from '../services/services.module';
//#endregion



@NgModule({
  declarations: [
    MainComponent
  ],
  imports: [
    CommonModule,
    EntryRoutingModule,
    ServicesModule,
    //#region prime-ng
    TableModule
    //#endregion
  ]
})
export class EntryModule { }
