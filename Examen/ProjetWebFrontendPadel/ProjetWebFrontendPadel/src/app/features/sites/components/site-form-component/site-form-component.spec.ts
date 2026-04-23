import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteFormComponent } from './site-form-component';

describe('SiteFormComponent', () => {
  let component: SiteFormComponent;
  let fixture: ComponentFixture<SiteFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteFormComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
