import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, Observable } from 'rxjs';

export let browserRefresh = false;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'ui5-testrecorder';
  curRoute$?: Observable<NavigationEnd>;

  constructor(private _location: Location, private router: Router) {}

  ngOnInit() {
    this.curRoute$ = this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => e as NavigationEnd)
    );
  }

  navBack() {
    this._location.back();
  }
}
