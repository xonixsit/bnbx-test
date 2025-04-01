import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BondingRoutingModule } from './bonding-routing.module';
import { BondingComponent } from './bonding.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatPaginatorModule } from '@angular/material/paginator';


@NgModule({
  declarations: [
    BondingComponent
  ],
  imports: [
    CommonModule,
    BondingRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    MatPaginatorModule
  ]
})
export class BondingModule { }
