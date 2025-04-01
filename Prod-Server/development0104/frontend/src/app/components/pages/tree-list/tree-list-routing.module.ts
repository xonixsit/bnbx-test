import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TreeListComponent } from './tree-list.component';

const routes: Routes = [{ path: '', component: TreeListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TreeListRoutingModule { }
