import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NetworkTreeComponent } from './network-tree.component';

const routes: Routes = [{ path: '', component: NetworkTreeComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NetworkTreeRoutingModule { }
