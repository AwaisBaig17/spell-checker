import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Tab4Component } from './tab4.component';

describe('Tab4Component', () => {
  let component: Tab4Component;
  let fixture: ComponentFixture<Tab4Component>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [Tab4Component]
    });
    fixture = TestBed.createComponent(Tab4Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
