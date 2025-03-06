import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { ToastrService } from 'ngx-toastr';
import { AuthServicesService } from 'src/app/services/auth/auth-services.service';
import { WalletServiceService } from 'src/app/services/wallet/wallet-service.service';

@Component({
  selector: 'app-fund-transfer',
  templateUrl: './fund-transfer.component.html',
  styleUrls: ['./fund-transfer.component.scss']
})

export class FundTransferComponent {
  fundTransferForm: FormGroup;
  token: any;
  showPassword = false;
  referralName: any = '';
  page = 1;
  sizePerPage = 10;
  transactionType = 'FUND-TRANSFER';
  transactions: any = [];
  totalTransactions: number = 0;
  loading = false;
  totalInternalTransferBalance: any;

  constructor(
    private walletService: WalletServiceService,
    private authServices: AuthServicesService,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    // Initialize the form groups in the constructor
    this.fundTransferForm = this.fb.group({
      amount: [0, [Validators.required, Validators.min(1)]],
      referralCode: ['', Validators.required], // Add referral code control
      password: ['', Validators.required], // Add password control
    });
  }

  ngOnInit(): void {
    this.token = localStorage.getItem('authToken');
    // this.fetchWalletTransactions(this.page, this.sizePerPage);
    this.getUserData()
  }

  getUserData() {
    this.authServices.toggleLoader(true);
    this.authServices.getProfile(this.token).subscribe({
      next: (response) => {
        // this.userBlance = response.data.BUSDBalance
        this.totalInternalTransferBalance = response.data.TRADEBalance
        this.authServices.toggleLoader(false);
      },
      error: (error) => {
        this.toastr.error('Failed to load profile information', 'Error');
        this.authServices.toggleLoader(false);
      }
    });
  }

  fundTransfer() {
    if (this.fundTransferForm.valid) {
      this.authServices.toggleLoader(true);
      const depositFormData = {
        amount: this.fundTransferForm.value.amount,
        referralCode: this.fundTransferForm.value.referralCode,
        password: this.fundTransferForm.value.password
      };
      this.walletService.fundTransferData(depositFormData, this.token).subscribe({
        next: (response) => {
          this.toastr.success(response.message, '', {
            toastClass: 'toast-custom toast-success',
            positionClass: 'toast-bottom-center',
            closeButton: false,
            timeOut: 3000,
            progressBar: true
          });
          this.getUserData()
          this.fundTransferForm.reset()
          this.authServices.toggleLoader(false);
        },
        error: (err) => {
          this.authServices.toggleLoader(false);
          const errorMessage = err.error?.message || 'Error processing the transaction';
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

  checkReferralCode() {
    const referralCode = this.fundTransferForm.get('referralCode')?.value;
    this.authServices.getReferralInfo(referralCode).subscribe({
      next: (response: any) => {
        if (response.status) {
          this.referralName = response.data.name
          this.toastr.success(response.message, '', {
            toastClass: 'toast-custom toast-success',
            positionClass: 'toast-bottom-center',
            closeButton: false,
            timeOut: 3000,
            progressBar: true
          });
          // this.fundTransferForm.reset()
          // this.fetchWalletTransactions(this.page, this.sizePerPage)
          // Handle success, e.g., display referral data or store it for further use
        } else {
          this.toastr.error(response.message, '', {
            toastClass: 'toast-custom toast-error',
            positionClass: 'toast-bottom-center',
            closeButton: false,
            timeOut: 3000,
            progressBar: true
          });

        }
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
