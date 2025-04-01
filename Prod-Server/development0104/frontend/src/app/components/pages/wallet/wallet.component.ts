import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms'; // Import FormBuilder, FormGroup, and Validators
import { WalletServiceService } from '../../../services/wallet/wallet-service.service'; // Import the service
import { ToastrService } from 'ngx-toastr';
import { PageEvent } from '@angular/material/paginator';
@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.scss']
})
export class WalletComponent implements OnInit {
  token: any;
  avilableBalance: any
  page = 1;
  sizePerPage = 10;
  transactionType = 'CONVERT-REWARD';
  transactions: any = [];
  totalTransactions: number = 0;

  constructor(
    private walletService: WalletServiceService,
    private fb: FormBuilder, // Inject FormBuilder
    private toastr: ToastrService
  ) {
  }

  ngOnInit(): void {
    this.token = localStorage.getItem('authToken');
    this.avilableBalance = localStorage.getItem('balance')
    this.fetchWalletTransactions(this.page, this.sizePerPage);
  }

  convertWallet() {
    this.walletService.toggleLoader(true);
    this.walletService.convertWalletFormData(this.token).subscribe({
      next: (response) => {
        this.toastr.success(response.message, '', {
          toastClass: 'toast-custom toast-success',
          positionClass: 'toast-bottom-center',
          closeButton: false,
          timeOut: 3000,
          progressBar: true
        });
        this.fetchWalletTransactions(this.page, this.sizePerPage);
        this.walletService.toggleLoader(false);
      },
      error: (err) => {
        this.walletService.toggleLoader(false);
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

  fetchWalletTransactions(page: number, sizePerPage: number) {
    if (this.token) {
      this.walletService.toggleLoader(true);
      this.walletService.getWalletTransactions(page, sizePerPage, this.transactionType, this.token).subscribe({
        next: (response) => {
          this.transactions = response.data.docs; // Adjust based on your response structure
          this.totalTransactions = response.total; // Assuming your response contains the total transaction count
          this.walletService.toggleLoader(false);
        },
        error: (error) => {
          console.error('Error fetching wallet transactions:', error);
          this.walletService.toggleLoader(false);
        }
      });
    }
  }

  onPageChange(event: PageEvent): void {
    this.page = event.pageIndex + 1; // MatPaginator pageIndex starts from 0
    this.sizePerPage = event.pageSize;
    this.fetchWalletTransactions(this.page, this.sizePerPage);
  }
  
}
