import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { SpellCheckComponent } from './components/spell-check/spell-check.component';

@NgModule({
  declarations: [
    AppComponent,
    SpellCheckComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
