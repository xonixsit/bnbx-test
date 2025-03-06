import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/auth-part/login/login.component';
import { SignUpComponent } from './components/auth-part/sign-up/sign-up.component';
import { SideBarComponent } from './components/pages/side-bar/side-bar.component';
import { ProfilePageComponent } from './components/pages/profile-page/profile-page.component';
import { AuthGuard } from './auth/auth.guard';
import { HomePageComponent } from './components/landing-page/home-page/home-page.component';
import { TradeRoomComponent } from './components/pages/trade-room/trade-room.component';

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
    path: '',
    component: SideBarComponent,
    children: [
      { path: 'profile', component: ProfilePageComponent, canActivate: [AuthGuard] },
      { path: 'dashboard', loadChildren: () => import('./components/pages/dashboard/dashboard.module').then(m => m.DashboardModule), canActivate: [AuthGuard] },
      { path: 'transaction', loadChildren: () => import('./components/pages/transaction/transaction.module').then(m => m.TransactionModule), canActivate: [AuthGuard] },
      { path: 'wallet', loadChildren: () => import('./components/pages/wallet/wallet.module').then(m => m.WalletModule), canActivate: [AuthGuard] },
      { path: 'setting', loadChildren: () => import('./components/pages/setting/setting.module').then(m => m.SettingModule), canActivate: [AuthGuard] },
      { path: 'reffral-list', loadChildren: () => import('./components/pages/tree-list/tree-list.module').then(m => m.TreeListModule) },
      { path: 'deposit', loadChildren: () => import('./components/pages/deposit/deposit.module').then(m => m.DepositModule) },
      { path: 'withdraw', loadChildren: () => import('./components/pages/withdraw/withdraw.module').then(m => m.WithdrawModule) },
      { path: 'fund-transfer', loadChildren: () => import('./components/pages/fund-transfer/fund-transfer.module').then(m => m.FundTransferModule) },
      { path: 'bonding', loadChildren: () => import('./components/pages/bonding/bonding.module').then(m => m.BondingModule) },
      { path: 'support', loadChildren: () => import('./components/pages/support/support.module').then(m => m.SupportModule) },
      { path: 'network-tree', loadChildren: () => import('./components/pages/network-tree/network-tree.module').then(m => m.NetworkTreeModule) },
      { path: 'swap-page', loadChildren: () => import('./components/pages/swap-page/swap-page.module').then(m => m.SwapPageModule) },

      {
        path: 'trade-room',
        component: TradeRoomComponent
      },

      // Add other protected routes here
    ]
  },
 
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
