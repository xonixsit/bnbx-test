import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamTransferComponent } from './team-transfer.component';

describe('TeamTransferComponent', () => {
  let component: TeamTransferComponent;
  let fixture: ComponentFixture<TeamTransferComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TeamTransferComponent]
    });
    fixture = TestBed.createComponent(TeamTransferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
