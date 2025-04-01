import { TestBed } from '@angular/core/testing';

import { SettingServicesService } from './setting-services.service';

describe('SettingServicesService', () => {
  let service: SettingServicesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SettingServicesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
