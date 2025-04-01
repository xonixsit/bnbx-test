import { TestBed } from '@angular/core/testing';

import { TransactionServicesService } from './transaction-services.service';

describe('TransactionServicesService', () => {
  let service: TransactionServicesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TransactionServicesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
