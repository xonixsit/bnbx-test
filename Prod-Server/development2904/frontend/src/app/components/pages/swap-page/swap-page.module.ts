import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SwapPageRoutingModule } from './swap-page-routing.module';
import { SwapPageComponent } from './swap-page.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatPaginatorModule } from '@angular/material/paginator';


@NgModule({
  declarations: [
    SwapPageComponent
  ],
  imports: [
    CommonModule,
    SwapPageRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    MatPaginatorModule
  ]
})
export class SwapPageModule { }
