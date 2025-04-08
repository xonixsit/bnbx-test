import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StakeComponent } from './stake.component';

const routes: Routes = [{ path: '', component: StakeComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StakeRoutingModule { }
