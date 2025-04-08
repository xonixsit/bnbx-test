import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StakeRoutingModule } from './stake-routing.module';
import { StakeComponent } from './stake.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatPaginatorModule } from '@angular/material/paginator';


@NgModule({
  declarations: [
    StakeComponent
  ],
  imports: [
    CommonModule,
    StakeRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    MatPaginatorModule
  ]
})
export class StakeModule { }
