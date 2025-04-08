import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { SideBarComponent } from '../side-bar/side-bar.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../header/header.component';
import { SharedModule } from '../../../shared.module';

@NgModule({
  declarations: [
    DashboardComponent,
    SideBarComponent
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    MatPaginatorModule,
    FormsModule,
    SharedModule
  ]
})
export class DashboardModule { }
