import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpellCheckComponent } from './spell-check.component';

describe('SpellCheckComponent', () => {
  let component: SpellCheckComponent;
  let fixture: ComponentFixture<SpellCheckComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SpellCheckComponent]
    });
    fixture = TestBed.createComponent(SpellCheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
