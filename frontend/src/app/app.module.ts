import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/auth-part/login/login.component';
import { SignUpComponent } from './components/auth-part/sign-up/sign-up.component';
import { HttpClientModule } from '@angular/common/http';
import { ToastrModule } from 'ngx-toastr';
import { ProfilePageComponent } from './components/pages/profile-page/profile-page.component';
import { TransactionModule } from './components/pages/transaction/transaction.module';
import { MatPaginatorModule } from '@angular/material/paginator';
import { HomePageComponent } from './components/landing-page/home-page/home-page.component';
import { TradeRoomComponent } from './components/pages/trade-room/trade-room.component';
import { SharedModule } from './shared.module';
import { AboutUsComponent } from './components/about-us/about-us.component';
import { HistoryCultureComponent } from './components/history-culture/history-culture.component';
import { VisionMissionComponent } from './components/vision-mission/vision-mission.component';
import { WhatWeDoComponent } from './components/what-we-do/what-we-do.component';
import { WhyChooseComponent } from './components/why-choose/why-choose.component';
import { BenefitsComponent } from './components/benefits/benefits.component';
import { TeamComponent } from './components/team/team.component';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderNavComponent } from './components/header-nav/header-nav.component';
import { TariffComponent } from './components/tariff/tariff.component';
import { DashboardHomeModule } from './components/pages/dashboard-home/dashboard-home.module';
import { Meta, Title } from '@angular/platform-browser';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    SignUpComponent,
    ProfilePageComponent,
    HomePageComponent,
    TradeRoomComponent,
    AboutUsComponent,
    HistoryCultureComponent,
    VisionMissionComponent,
    WhatWeDoComponent,
    WhyChooseComponent,
    BenefitsComponent,
    TeamComponent,
    FooterComponent,
    HeaderNavComponent,
    TariffComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    AppRoutingModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatPaginatorModule,
    DashboardHomeModule,
    ToastrModule.forRoot({
      timeOut: 3000,
      positionClass: 'toast-bottom-center',
      preventDuplicates: true,
      progressBar: true,
    }),     
    TransactionModule, 
    SharedModule,
    BrowserAnimationsModule
    // Remove NgxLazyElModule from here
  ],
  providers: [
    Meta,
    Title
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
