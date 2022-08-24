import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AppHeaderService {
  public showBackButton$ = new BehaviorSubject<boolean>(false);

  public showBack() {
    this.showBackButton$.next(true);
  }

  public hideBack() {
    this.showBackButton$.next(false);
  }
}
