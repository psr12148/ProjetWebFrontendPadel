import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SituationBannerComponent } from './situation-banner.component';

describe('SituationBannerComponent', () => {
  let component: SituationBannerComponent;
  let fixture: ComponentFixture<SituationBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SituationBannerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SituationBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
