import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InviterJoueurDialogComponent } from './inviter-joueur-dialog.component';

describe('InviterJoueurDialogComponent', () => {
  let component: InviterJoueurDialogComponent;
  let fixture: ComponentFixture<InviterJoueurDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InviterJoueurDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InviterJoueurDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
