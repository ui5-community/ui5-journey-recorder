import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

export let browserRefresh = false;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'UI5 Journey Recorder';

  constructor() {}

  ngOnInit() {
    const fKey = (event: any) => {
      const e = event || window.event;
      // capture for F5 or ctrl+r or cmd+r
      if (e.keyCode === 116 || (e.keyCode == 82 && (e.ctrlKey || e.metaKey))) {
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
