import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InviterJoueurDialogComponent } from './inviter-joueur-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

describe('InviterJoueurDialogComponent', () => {
  let component: InviterJoueurDialogComponent;
  let fixture: ComponentFixture<InviterJoueurDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InviterJoueurDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: {} },      // <-- Simule la référence
        { provide: MAT_DIALOG_DATA, useValue: {} }    // <-- Simule les données
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InviterJoueurDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
