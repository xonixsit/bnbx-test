import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NetworkTreeRoutingModule } from './network-tree-routing.module';
import { NetworkTreeComponent } from './network-tree.component';
import { TreeModule } from 'primeng/tree';


@NgModule({
  declarations: [
    NetworkTreeComponent
  ],
  imports: [
    CommonModule,
    NetworkTreeRoutingModule,
    TreeModule,
    
  ]
})
export class NetworkTreeModule { }
