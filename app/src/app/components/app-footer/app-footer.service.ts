import { ApplicationRef, Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

export enum LoadStatus {
  LOADING = 'loading',
  DISCONNECTED = 'disconnected',
  CONNECTED = 'connected',
}

@Injectable({
  providedIn: 'root',
})
export class AppFooterService {
  public loadingIndicatorSource = new BehaviorSubject<LoadStatus>(
    LoadStatus.DISCONNECTED
  );

  public connected() {
    this.loadingIndicatorSource.next(LoadStatus.CONNECTED);
  }
  public disconnected() {
    this.loadingIndicatorSource.next(LoadStatus.DISCONNECTED);
  }
  public connecting() {
    this.loadingIndicatorSource.next(LoadStatus.LOADING);
  }
}
