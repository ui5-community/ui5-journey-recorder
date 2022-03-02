import { Component, OnInit } from '@angular/core';
import { ChromeExtensionService, Page } from 'src/app/services/chromeExtensionService/chrome_extension_service';


@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {

  elements: Page[] = [];
  columns: any[] = [
    { field: "icon", header: "" },
    //{ field: "id", header: "Tab ID" },
    { field: "title", header: "Page Title" },
    { field: "path", header: "Page Url" }
  ];

  selected_row: Page | undefined;

  constructor(private chr_ext_srv: ChromeExtensionService) { }

  ngOnInit(): void {
    this.chr_ext_srv.getAllTabs().then((tabs: Page[]) => {
      this.elements = tabs;
    });
  }

  start_recording(page: Page | undefined) {
    debugger;
    console.log("typed");
    console.dir(page);
  }

  refresh_table() {
    this.chr_ext_srv.getAllTabs().then((tabs: Page[]) => {
      this.elements = tabs;
    });
  }
}
