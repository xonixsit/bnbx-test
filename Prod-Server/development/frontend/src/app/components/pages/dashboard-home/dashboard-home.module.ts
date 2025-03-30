import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardHomeComponent } from './dashboard-home.component';
import { DashboardHomeRoutingModule } from './dashboard-home-routing.module';

@NgModule({
  declarations: [
    DashboardHomeComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    DashboardHomeRoutingModule
  ],
  providers: [
    DatePipe
  ]
})
export class DashboardHomeModule { }