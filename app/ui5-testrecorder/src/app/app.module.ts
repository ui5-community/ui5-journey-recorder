import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

//#region prime-ng
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AppFooter } from './components/app-footer/app-footer.component';
import { AppFooterService } from './components/app-footer/app-footer.service';
//#endregion

@NgModule({
  declarations: [
    AppComponent,
    AppFooter
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    //#region prime-ng
    ButtonModule,
    ConfirmDialogModule,
    ToastModule
    //#endregion
  ],
  providers: [
    ConfirmationService,
    MessageService,
    AppFooterService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
