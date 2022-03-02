import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

//#region prime-ng
import { ButtonModule } from 'primeng/button';
//#endregion

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    //#region prime-ng
    ButtonModule
    //#endregion
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
