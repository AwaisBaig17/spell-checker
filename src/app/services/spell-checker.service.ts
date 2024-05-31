// spellchecker.service.ts
import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SpellCheckerService {
  private renderer: Renderer2;

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
    //this.loadScript();
  }

  private loadScript() {
    const script = this.renderer.createElement('script');
    script.src = '/assets/JavaScriptSpellCheck/include.js'; // Adjust the path as necessary
    script.type = 'text/javascript';
    script.onload = () => {
      console.log('Spell check script loaded successfully');
    };
    script.onerror = () => {
      console.error('Error loading the spell check script');
    };
    this.renderer.appendChild(document.body, script);
  }

  public initializeSpellChecker(elementId: string) {
    // Wait for the script to load and then call the spell check method
    if ((window as any).$Spelling && (window as any).$Spelling.SpellCheckInWindow) {
      //(window as any).$Spelling.PopUpStyle = "fancybox";
      (window as any).$Spelling.DefaultDictionary = "English (Medical), CureMedications";
      (window as any).$Spelling.SpellCheckInWindow(elementId);
    } else {
      console.error("Spell check script not loaded or '$Spelling' is not defined.");
    }
  }
}
