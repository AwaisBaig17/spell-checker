import { Component, ElementRef, ViewChild } from '@angular/core';
import WProofreaderSDK from '@webspellchecker/wproofreader-sdk-js';

@Component({
  selector: 'app-tab1',
  templateUrl: './tab1.component.html',
  styleUrls: ['./tab1.component.css']
})
export class Tab1Component {

  @ViewChild('scenario1') scenario1!: ElementRef;
  instance: any | undefined;

  ngAfterViewInit() {
    this.InitilizeSpellChecker();
  }

  InitilizeSpellChecker() {
    WProofreaderSDK.init({
      container: this.scenario1.nativeElement,
      autoSearch: true,
      autoDestroy: true,
      enforceAI: false,
      enableGrammar: true,
      actionItems: ['ignoreAll', 'addWord'],
      suggestionsCount: 5,
      ignoreClasses: ['ignore'],
      serviceProtocol: "http",
      servicePort: 80,
      serviceHost: "CMDLHRLTX232",
      servicePath: "wscservice/api",
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

  async checkForIsolation() {
    if (!window.crossOriginIsolated) {
      console.log('performance.measureUserAgentSpecificMemory() is only available in cross-origin-isolated pages');
    } else if (!(performance as any).measureUserAgentSpecificMemory) {
      console.log('performance.measureUserAgentSpecificMemory() is not available in this browser');
    } else {
      let result;
      try {
        result = await (performance as any).measureUserAgentSpecificMemory();
      } catch (error) {
        if (error instanceof DOMException && error.name === 'SecurityError') {
          console.log('The context is not secure.');
        } else {
          throw error;
        }
      }
      console.log(result);
    }
  }
}
