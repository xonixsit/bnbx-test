import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { AuthServicesService } from 'src/app/services/auth/auth-services.service';
import { WalletServiceService } from 'src/app/services/wallet/wallet-service.service';

@Component({
  selector: 'app-swap-page',
  templateUrl: './swap-page.component.html',
  styleUrls: ['./swap-page.component.scss']
})
export class SwapPageComponent {
  fundTransferForm: FormGroup;
  token: any;
  showPassword = false;
  referralName: any = '';
  disable: boolean = true
  page = 1;
  sizePerPage = 10;
  transactionType = 'FUND-TRANSFER';
  transactions: any = [];
  totalTransactions: number = 0;
  loading = false;
  userBlance: any
  totalInternalTransferBalance: any

  constructor(
    private walletService: WalletServiceService,
    private authServices: AuthServicesService,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    // Initialize the form groups in the constructor
    this.fundTransferForm = this.fb.group({
      amount: [0, [Validators.required, Validators.min(1)]],
      password: ['', Validators.required], // Add password control
    });
  }

  ngOnInit(): void {
    this.token = localStorage.getItem('authToken');
    // this.fetchWalletTransactions(this.page, this.sizePerPage);
    this.getUserData()
  }

getUserData(){
  this.authServices.getProfile(this.token).subscribe({
    next: (response) => {
      this.userBlance = response.data.BUSDBalance
      this.totalInternalTransferBalance = response.data.TRADEBalance
    },
    error: (error) => {
      this.toastr.error('Failed to load profile information', 'Error');
      this.loading = false;
    }
  });
}

  fundTransfer() {
    if (this.fundTransferForm.valid) {
      this.walletService.toggleLoader(true);
      const depositFormData = {
        amount: this.fundTransferForm.value.amount,
        password: this.fundTransferForm.value.password
      };

      this.walletService.swapData(depositFormData, this.token).subscribe({
        next: (response) => {  
          this.toastr.success(response.message, '', {
            toastClass: 'toast-custom toast-success',
            positionClass: 'toast-bottom-center',
            closeButton: false,
            timeOut: 3000,
            progressBar: true
          });
          this.fundTransferForm.reset()
          this.getUserData()
          this.walletService.toggleLoader(false);
        },
        error: (err) => {
          const errorMessage = err.error?.message || 'Error processing the transaction';
          this.toastr.error(errorMessage, '', {
            toastClass: 'toast-custom toast-error',
            positionClass: 'toast-bottom-center',
            closeButton: false,
            timeOut: 3000,
            progressBar: true
          });
          this.walletService.toggleLoader(false);
        }
      });
    }
  }

}

