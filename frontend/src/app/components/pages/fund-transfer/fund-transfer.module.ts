import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FundTransferRoutingModule } from './fund-transfer-routing.module';
import { FundTransferComponent } from './fund-transfer.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatPaginatorModule } from '@angular/material/paginator';


@NgModule({
  declarations: [
    FundTransferComponent
  ],
  imports: [
    CommonModule,
    FundTransferRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    MatPaginatorModule
  ]
})
export class FundTransferModule { }
