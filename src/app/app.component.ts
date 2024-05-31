import { Component, ElementRef, ViewChild } from '@angular/core';
import { SpellCheckerService } from './services/spell-checker.service';
import { Sapling } from "@saplingai/sapling-js/observer";
import WProofreaderSDK from '@webspellchecker/wproofreader-sdk-js';
import { Subject, debounceTime } from 'rxjs';


declare const WProofreader: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'spell-checker';
  spellCheckerInstance: any;
  constructor(private spellCheckerService: SpellCheckerService) {

  }
  @ViewChild('editorContent') editorContent!: ElementRef;

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.InitializeProofReader();
  }

  InitializeSapling() {
    // Optionally initialize spell checker right after the view initializes
    Sapling.init({
      key: 'B95ER9J9KO7R4LWOCLRPULU7O7XGQ6E1',
      endpointHostname: 'https://api.sapling.ai',
      editPathname: '/api/v1/edits',
      statusBadge: true,
      mode: 'dev',
      medical: true
    });
    var editor = document.getElementById('sapplingDiv');
    if (editor) {
      Sapling.observe(editor);
    }
  }

  InitializeProofReader() {
    WProofreaderSDK.init({
      container: document.getElementById("wProofReaderDiv"),
      autoSearch: true,
      autoDestroy: true,
      enforceAI: true,
      serviceId: 'YORvsaqImsRm4gM',
      enableGrammar: true,
      actionItems: ['ignoreAll', 'addWord'],
      disableOptionsStorage: true,
      theme: 'custom',
      suggestionsCount: 5,
      ignoreClasses: ['ignore'],
      onLoad: (instance: any) => {
        // instance - a WEBSPELLCHECKER instance.
        console.log(instance);
        this.spellCheckerInstance = instance;
        console.log("Web Spell Checker On Load")

        const userDictionary = this.getUserDictionaryFromLocalStorage();
        if (userDictionary !== null) {
          // Remove it from local storage
          localStorage.removeItem('wsc_user_dictionary');
        }
        const userDictionaryWords = 'gug,Awaus'
        localStorage.setItem('wsc_user_dictionary', `array<$>${userDictionaryWords}`);
      },
      onAddWordToUserDictionary: (word: string, instance: any) => {
          // word - a word added to the dictionary.
          // instance - a WEBSPELLCHECKER instance.
          console.log("On Add Word To Dictionary")
          var data = this.getUserDictionaryFromLocalStorage();
          console.log(data);
      },
      onErrorRequest: function(data: any, instance: any) {
          // data - an object with information about an error.
          // instance - a WEBSPELLCHECKER instance.
          console.log("On Error")
      },
      onStatistics: (data: any, instance: any) => {
        // data - an object with statistics data.
        // data.action - type of the action (replace, ignore, add, delete).
        // data.text - a text of the action (replaced phrase, ignored phrase, added or removed from the User Dictionary word).
        // data.newText - a new text (for the replace action only).
        // data.lang - a language of the problem from the action.
        // data.type - a type of the problem (spelling, grammar e.t.c).
        // data.category - a category of the problem (if problem has the category).
        // data.rule - a rule of the problem (if problem has the rule).
        // data.context - a context where action was applied.
        // data.offset - an offset to the problem in the context.
        // instance - a WEBSPELLCHECKER instance.
        console.log("On Statistics");
        console.log(data);
      },
    });
  }

  checkSpelling(): void {
    this.spellCheckerService.initializeSpellChecker('editableDiv');
  }

  ngOnDestroy() {
    console.log("On Destroy");
    this.spellCheckerInstance?.destroy();
    console.log("After Destroy");
  }

  getUserDictionaryFromLocalStorage(): string | null {
    return localStorage.getItem('wsc_user_dictionary');
  }

  observeMutation() {
    // const observer = new MutationObserver((mutations) => {
    //   mutations.forEach((mutation) => {
    //     if (mutation.addedNodes) {
    //       mutation.addedNodes.forEach((node) => {
    //         if (node.nodeType === Node.ELEMENT_NODE) {
    //           const element = node as Element;
    //           // Check if the added node contains the button with 'Ignore all' text
    //           const ignoreAllButtons = element.querySelectorAll('.wsc-button__text');
    //           ignoreAllButtons.forEach((btn) => {
    //             if (btn.textContent === 'Ignore all') {
    //               btn.textContent = 'Dismiss'; // Replace 'Ignore all' with 'Dismiss'
    //             }
    //           });
    //         }
    //       });
    //     }
    //   });
    // });

    // Start observing the body for added elements
    //observer.observe(document.body, { childList: true, subtree: true });
  }

}
