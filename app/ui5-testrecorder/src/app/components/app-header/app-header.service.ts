import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Location } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AppHeaderService {
  public showBackButton$ = new BehaviorSubject<boolean>(false);

  private customTarget: string | null = null;

  constructor(private _location: Location, private router: Router) {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        this.customTarget = null;
      });
  }

  public showBack() {
    this.showBackButton$.next(true);
  }

  public hideBack() {
    this.showBackButton$.next(false);
  }

  public setCustomBackUrl(target: string): void {
    this.customTarget = target;
  }

  public navigateBackwards(): void {
    if (this.customTarget === null) {
      this._location.back();
    } else {
      this.router.navigate([this.customTarget]);
    }
  }
}
