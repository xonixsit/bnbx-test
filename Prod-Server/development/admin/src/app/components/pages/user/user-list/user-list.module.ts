import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserListRoutingModule } from './user-list-routing.module';
import { UserListComponent } from './user-list.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserUpdateComponent } from '../user-update/user-update.component';
import { UserKycComponent } from '../user-kyc/user-kyc.component';
import { TeamTransferComponent } from '../team-transfer/team-transfer.component';
import { TreeModule } from 'primeng/tree';
import { SearchPipe } from 'src/app/search.pipe';


@NgModule({
  declarations: [
    UserListComponent,
    UserUpdateComponent,
    UserKycComponent,
    TeamTransferComponent,
    SearchPipe
  ],
  imports: [
    CommonModule,
    UserListRoutingModule,
    MatPaginatorModule,
    FormsModule,
    ReactiveFormsModule,
    TreeModule,
    
   
  ],
  exports: [SearchPipe],
 
})
export class UserListModule { }
