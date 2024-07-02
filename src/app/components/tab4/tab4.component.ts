import { Component, ElementRef, ViewChild } from '@angular/core';
import WProofreaderSDK from '@webspellchecker/wproofreader-sdk-js';


@Component({
  selector: 'app-tab4',
  templateUrl: './tab4.component.html',
  styleUrls: ['./tab4.component.css']
})
export class Tab4Component {
  @ViewChild('scenario4') scenario4!: ElementRef;
  instance: any | undefined;

  ngAfterViewInit() {
    this.InitilizeSpellChecker();
  }

  InitilizeSpellChecker() {
    WProofreaderSDK.init({
      container: this.scenario4.nativeElement,
      autoSearch: true,
      autoDestroy: true,
      enforceAI: false,
      enableGrammar: true,
      actionItems: ['ignoreAll', 'addWord'],
      suggestionsCount: 5,
      serviceProtocol: "http",
      servicePort: 80,
      serviceHost: "CMDLHRLTX232",
      servicePath: "wscservice/api",
      ignoreClasses: ['btnComponent_Attached', 'Comp_Heading_Attached', 'compLbl', 'Comp_Heading_Detail'],
      onLoad: (instance: any) => {
        this.instance = instance;
      },
      onAddWordToUserDictionary: (word: string, instance: any) => {
      },
      onErrorRequest: function(data: any, instance: any) {
          // data - an object with information about an error.
          // instance - a WEBSPELLCHECKER instance.
          console.log("On Error")
      },
      onStatistics: (data: any, instance: any) => {
      },
    });
  }
}
