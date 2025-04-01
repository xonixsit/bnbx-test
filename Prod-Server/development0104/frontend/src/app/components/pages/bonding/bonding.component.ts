import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthServicesService } from 'src/app/services/auth/auth-services.service';
import { WalletServiceService } from 'src/app/services/wallet/wallet-service.service';

@Component({
  selector: 'app-bonding',
  templateUrl: './bonding.component.html',
  styleUrls: ['./bonding.component.scss']
})
export class BondingComponent {
  stakeForm: FormGroup;
  token: any;
  page = 1;
  sizePerPage = 10;
  transactionType = 'BOND-IN';
  transactions: any = [];
  totalTransactions: number = 0;
  userBlance: any;
  totalInternalTransferBalance: any;
  constructor(
    private walletService: WalletServiceService,
    private fb: FormBuilder, // Inject FormBuilder
    private toastr: ToastrService,
    private authServices: AuthServicesService,
  ) {
    // Initialize the form groups in the constructor
    this.stakeForm = this.fb.group({
      amount: [0, [Validators.required, Validators.min(1)]],
    });
  }

  ngOnInit(): void {
    this.token = localStorage.getItem('authToken');
    this.fetchWalletTransactions(this.page, this.sizePerPage);
    this.getUserData()
  }

  getUserData() {
    this.authServices.getProfile(this.token).subscribe({
      next: (response) => {
        
  
        // this.userBlance = response.data.BUSDBalance
        this.totalInternalTransferBalance = response.data.TRADEBalance
        
      },
      error: (error) => {
        this.toastr.error('Failed to load profile information', 'Error');
        ;
      }
    });
  }

  stake() {
    if (this.stakeForm.valid) {
      const stakeAmount = this.stakeForm.value;
      this.walletService.stake(stakeAmount, this.token).subscribe({
        next: (response: any) => {
          this.toastr.success(response.body.message, '', {
            toastClass: 'toast-custom toast-success',
            positionClass: 'toast-bottom-center',
            closeButton: false,
            timeOut: 3000,
            progressBar: true
          });
          this.fetchWalletTransactions(this.page, this.sizePerPage); // Refresh transactions after deposit
          this.getUserData()
          this.stakeForm.reset()
        },
        error: (err) => {
          const errorMessage = err.error?.message || 'Error validating referral code';
          this.toastr.error(errorMessage, '', {
            toastClass: 'toast-custom toast-error',
            positionClass: 'toast-bottom-center',
            closeButton: false,
            timeOut: 3000,
            progressBar: true
          });
        }
      });
    }
  }

  fetchWalletTransactions(page: number, sizePerPage: number) {
    this.authServices.toggleLoader(true);
    if (this.token) {
      this.walletService.getWalletTransactions(page, sizePerPage, this.transactionType, this.token).subscribe({
        next: (response) => {
          this.transactions = response.data.docs;
          this.totalTransactions = response.total;
          this.authServices.toggleLoader(false);
        },
        error: (error) => {
          console.error('Error fetching wallet transactions:', error);
          this.authServices.toggleLoader(false);
        }
      });
    }
  }

  onPageChange(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.sizePerPage = event.pageSize;
    this.fetchWalletTransactions(this.page, this.sizePerPage);
  }

}
