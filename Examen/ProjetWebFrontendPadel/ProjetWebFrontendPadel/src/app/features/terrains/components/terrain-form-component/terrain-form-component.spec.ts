import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TerrainFormComponent } from './terrain-form-component';
import { provideRouter } from '@angular/router';

describe('TerrainFormComponent', () => {
  let component: TerrainFormComponent;
  let fixture: ComponentFixture<TerrainFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TerrainFormComponent],
      providers: [
        provideRouter([]),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TerrainFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
