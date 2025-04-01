import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TreeListRoutingModule } from './tree-list-routing.module';
import { TreeListComponent } from './tree-list.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';
import { SearchPipe } from 'src/app/search.pipe';

@NgModule({
  declarations: [
    TreeListComponent,
    SearchPipe
  ],
  imports: [
    CommonModule,
    TreeListRoutingModule,
    MatPaginatorModule,
    FormsModule,
  ],
  exports: [SearchPipe],
  schemas: [NO_ERRORS_SCHEMA],
})
export class TreeListModule { }
