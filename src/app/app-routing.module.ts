import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Tab1Component } from './../app/components/tab1/tab1.component';
import { Tab2Component } from './../app/components/tab2/tab2.component';
import { Tab3Component } from './../app/components/tab3/tab3.component';
import { Tab4Component } from './../app/components/tab4/tab4.component';

const routes: Routes = [
  { path: 'tab1', component: Tab1Component },
  { path: 'tab2', component: Tab2Component },
  { path: 'tab3', component: Tab3Component },
  { path: 'tab4', component: Tab4Component },
  { path: '', redirectTo: '/tab1', pathMatch: 'full' },
  { path: '**', redirectTo: '/tab1' } // wildcard route redirects to tab1 or a NotFoundComponent
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { enableTracing: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
