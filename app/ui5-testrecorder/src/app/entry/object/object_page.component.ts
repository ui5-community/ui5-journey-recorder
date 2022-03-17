import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { Location } from "@angular/common";
import { ActivatedRoute, Params } from "@angular/router";
import { ChromeExtensionService } from "src/app/services/chromeExtensionService/chrome_extension_service";
import { Observable, Subscription } from "rxjs";

@Component({
  selector: 'app-object-page',
  templateUrl: './object_page.component.html',
  styleUrls: ['./object_page.component.css']
})
export class ObjectPageComponent implements OnInit {
  navigatedPage: string = "Test";
  tab: chrome.tabs.Tab | undefined;
  recordingObs: Observable<any>;

  steps: any[] = [];
  private page_id: number = 0;

  constructor(
    private location: Location,
    private incommingRoute: ActivatedRoute,
    private chr_ext_srv: ChromeExtensionService,
    private cd: ChangeDetectorRef
  ) {
    this.recordingObs = this.chr_ext_srv.register_recording_websocket();
  }

  ngOnInit() {
    this.incommingRoute.params.subscribe((params: Params) => {
      this.page_id = params['tabId'];
      this.chr_ext_srv.getTabInfoById(this.page_id).then((tab: chrome.tabs.Tab) => {
        this.tab = tab;
        this.recordingObs.subscribe(this.onRecordStep.bind(this));
      });
    })
  }

  navBack() {
    this.location.back();
  }

  private onRecordStep(step: any) {
    this.steps.push(step);
    this.cd.detectChanges();
  }
}
