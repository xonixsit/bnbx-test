import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/auth-part/login/login.component';
import { SignUpComponent } from './components/auth-part/sign-up/sign-up.component';
import { ProfilePageComponent } from './components/pages/profile-page/profile-page.component';
import { AuthGuard } from './auth/auth.guard';
import { HomePageComponent } from './components/landing-page/home-page/home-page.component';
import { DashboardComponent } from './components/pages/dashboard/dashboard.component';
import { DashboardHomeComponent } from './components/pages/dashboard-home/dashboard-home.component';
import { WalletComponent } from './components/pages/wallet/wallet.component';

const routes: Routes = [
  // {
  //   path: '',
  //   redirectTo: 'login',
  //   pathMatch: 'full'
  // },
  {
    path: '',
    component: HomePageComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'signup',
    component: SignUpComponent
  },
 
  {
    path: 'dashboard',
    component: DashboardComponent,
    children: [
      // { path: '', redirectTo: '', pathMatch: 'full' },
      { path: '', component: DashboardHomeComponent }, // This will be your current dashboard content
      { path: 'wallet', component: WalletComponent },
      { path: 'profile', component: ProfilePageComponent, canActivate: [AuthGuard] },
      { path: 'dashboard', loadChildren: () => import('./components/pages/dashboard/dashboard.module').then(m => m.DashboardModule), canActivate: [AuthGuard] },
      { path: 'transaction', loadChildren: () => import('./components/pages/transaction/transaction.module').then(m => m.TransactionModule), canActivate: [AuthGuard] },
      { path: 'wallet', loadChildren: () => import('./components/pages/wallet/wallet.module').then(m => m.WalletModule), canActivate: [AuthGuard] },
      { path: 'setting', loadChildren: () => import('./components/pages/setting/setting.module').then(m => m.SettingModule), canActivate: [AuthGuard] },
      { path: 'reffral-list', loadChildren: () => import('./components/pages/tree-list/tree-list.module').then(m => m.TreeListModule) },
      { path: 'stake', loadChildren: () => import('./components/pages/stake/stake.module').then(m => m.StakeModule)  },
      { path: 'deposit', loadChildren: () => import('./components/pages/deposit/deposit.module').then(m => m.DepositModule)  },
      { path: 'withdraw', loadChildren: () => import('./components/pages/withdraw/withdraw.module').then(m => m.WithdrawModule) },
      { path: 'fund-transfer', loadChildren: () => import('./components/pages/fund-transfer/fund-transfer.module').then(m => m.FundTransferModule) },
      // { path: 'bonding', loadChildren: () => import('./components/pages/bonding/bonding.module').then(m => m.BondingModule) },
      // { path: 'support', loadChildren: () => import('./components/pages/support/support.module').then(m => m.SupportModule) },
       { path: 'network-tree', loadChildren: () => import('./components/pages/network-tree/network-tree.module').then(m => m.NetworkTreeModule) },
    ]
  },
 
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
