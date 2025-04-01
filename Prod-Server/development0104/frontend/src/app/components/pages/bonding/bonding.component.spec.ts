import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BondingComponent } from './bonding.component';

describe('BondingComponent', () => {
  let component: BondingComponent;
  let fixture: ComponentFixture<BondingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BondingComponent]
    });
    fixture = TestBed.createComponent(BondingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
