import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

export let browserRefresh = false;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'ui5-testrecorder';

  constructor(private router: Router) {}

  ngOnInit() {
    const fKey = (event: any) => {
      const e = event || window.event;
      if (e.keyCode === 116) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        window.location.href = '../index.html';
      }
    };

    document.onkeydown = fKey;
    document.onkeyup = fKey;
  }
}
