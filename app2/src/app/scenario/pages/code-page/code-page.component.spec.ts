import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodePageComponent } from './code-page.component';

describe('CodePageComponent', () => {
  let component: CodePageComponent;
  let fixture: ComponentFixture<CodePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CodePageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CodePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
