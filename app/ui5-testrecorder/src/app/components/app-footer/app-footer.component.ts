import { Component, ElementRef } from "@angular/core";
import { Subscription } from "rxjs";
import { AppFooterService, LoadStatus } from "./app-footer.service";

@Component({
  selector: "app-footer",
  templateUrl: "./app-footer.component.html",
  styleUrls: ["./app-footer.component.css"]
})
export class AppFooter {
  loadingState = LoadStatus;

  constructor(public footerService: AppFooterService) {
  }
}
