import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhatWeDoComponent } from './what-we-do.component';

describe('WhatWeDoComponent', () => {
  let component: WhatWeDoComponent;
  let fixture: ComponentFixture<WhatWeDoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WhatWeDoComponent]
    });
    fixture = TestBed.createComponent(WhatWeDoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
