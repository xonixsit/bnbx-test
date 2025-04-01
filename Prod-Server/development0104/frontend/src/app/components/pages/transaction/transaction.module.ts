import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TransactionRoutingModule } from './transaction-routing.module';
import { TransactionComponent } from './transaction.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms'; // Import FormsModule


@NgModule({
  declarations: [
    TransactionComponent
  ],
  imports: [
    CommonModule,
    TransactionRoutingModule,
    MatPaginatorModule,
    FormsModule
  ]
})
export class TransactionModule { }
