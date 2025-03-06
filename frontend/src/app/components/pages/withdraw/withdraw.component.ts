import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { ToastrService } from 'ngx-toastr';
import { AuthServicesService } from 'src/app/services/auth/auth-services.service';
import { WalletServiceService } from 'src/app/services/wallet/wallet-service.service';

@Component({
  selector: 'app-withdraw',
  templateUrl: './withdraw.component.html',
  styleUrls: ['./withdraw.component.scss']
})
export class WithdrawComponent {
  withdrawForm: FormGroup;
  token: any;
  showWithdrawPassword = false;
  page = 1;
  sizePerPage = 10;
  transactionType = 'WITHDRAW';
  transactions: any = [];
  totalTransactions: number = 0;
  loading = false;
  userBlance: any;

  constructor(
    private walletService: WalletServiceService,
    private fb: FormBuilder, // Inject FormBuilder
    private toastr: ToastrService,
    private authServices: AuthServicesService
  ) {
    // Initialize the form groups in the constructor
    this.withdrawForm = this.fb.group({
      amount: [0, [Validators.required, Validators.min(1)]],
      password: ['', [Validators.required]],
    });``
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
        this.userBlance = response.data.BUSDBalance
        // this.totalInternalTransferBalance = response.data.totalInternalTransferBalance
        this.authServices.toggleLoader(false);
      },
      error: (error) => {
        this.toastr.error('Failed to load profile information', 'Error');
        this.authServices.toggleLoader(false);
      }
    });
  }
  withdraw() {
    if (this.withdrawForm.valid) {
      this.authServices.toggleLoader(true);
      const withdrawAmount = this.withdrawForm.value; // Get the value from the form
      this.walletService.withdraw(withdrawAmount, this.token).subscribe({
        next: (response) => {
          this.toastr.success(response.body.message, '', {
            toastClass: 'toast-custom toast-success',
            positionClass: 'toast-bottom-center',
            closeButton: false,
            timeOut: 3000,
            progressBar: true
          });
          this.getUserData()
          this.withdrawForm.reset();
          this.authServices.toggleLoader(false);
        },
        error: (err) => {
          this.authServices.toggleLoader(false);
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
}
