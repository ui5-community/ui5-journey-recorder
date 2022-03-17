import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

export enum LoadStatus {
  LOADING = "loading",
  DISCONNECTED = "disconnected",
  CONNECTED = "connected"
}

@Injectable({
  providedIn: "root"
})
export class AppFooterService {
  private loadingIndicatorSource = new Subject<LoadStatus>();

  loadingChange$ = this.loadingIndicatorSource.asObservable();

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
