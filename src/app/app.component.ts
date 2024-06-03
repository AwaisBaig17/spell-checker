import { Component } from '@angular/core';
import { Sapling } from "@saplingai/sapling-js/observer";


declare const WProofreader: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'spell-checker';

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
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

  ngOnDestroy() {
  }

}
