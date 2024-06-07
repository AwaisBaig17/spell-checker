import { Component, ElementRef, ViewChild } from '@angular/core';
import WProofreaderSDK from '@webspellchecker/wproofreader-sdk-js';


@Component({
  selector: 'app-tab3',
  templateUrl: './tab3.component.html',
  styleUrls: ['./tab3.component.css']
})
export class Tab3Component {
  @ViewChild('scenario3') scenario3!: ElementRef;
  instance: any | undefined;

  ngAfterViewInit() {
    this.InitilizeSpellChecker();
  }

  InitilizeSpellChecker() {
    WProofreaderSDK.init({
      container: this.scenario3.nativeElement,
      autoSearch: true,
      autoDestroy: true,
      enforceAI: true,
      serviceId: 'W7NYnEfUKDSjvsO',
      enableGrammar: true,
      actionItems: ['ignoreAll', 'addWord'],
      disableOptionsStorage: true,
      theme: 'custom',
      suggestionsCount: 5,
      ignoreClasses: ['ignore'],
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
