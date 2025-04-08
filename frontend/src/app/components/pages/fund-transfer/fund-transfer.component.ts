import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { ToastrService } from 'ngx-toastr';
import { AuthServicesService } from 'src/app/services/auth/auth-services.service';
import { WalletServiceService } from 'src/app/services/wallet/wallet-service.service';
import { ActivePlan, BalanceBreakdown, LockStatus } from 'src/app/models/balance.model';

@Component({
  selector: 'app-fund-transfer',
  templateUrl: './fund-transfer.component.html',
  styleUrls: ['./fund-transfer.component.scss']
})

export class FundTransferComponent {
  // Existing properties
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

  // New properties
  mainBalance: number = 0;
  balanceBreakdown: any;
  withdrawableBalance: any;
  totalBalance: any;
  regularDeposits: any;
  bondedAmount: any;
  referralIncome: any;
  stakedAmount: any;
  userBlance: any;
  totalWithdrawn: any;
  bonusAmount: any;
  lockStatus: any;
  isWithdrawalLocked: any;
  lockedUntil: Date | null = null;
  lockedMessage: string = '';
  activePlans: ActivePlan[] = [];

  constructor(
    private walletService: WalletServiceService,
    private authServices: AuthServicesService,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    this.fundTransferForm = this.fb.group({
      amount: [0, [
        Validators.required, 
        Validators.min(1),
        (control: AbstractControl) => {
          if (!control.value) return null;
          
          const amount = Number(control.value);
          const walletType = this.fundTransferForm?.get('walletType')?.value;
          
          switch(walletType) {
            case 'main':
              return amount > this.withdrawableBalance ? 
                { exceedsWithdrawable: { max: this.withdrawableBalance, actual: amount } } : 
                null;
            case 'trade':
            case 'trade-to-main':
              return amount > this.totalInternalTransferBalance ? 
                { exceedsTradeBalance: { max: this.totalInternalTransferBalance, actual: amount } } : 
                null;
            default:
              return null;
          }
        }
      ]],
      password: ['', Validators.required],
      walletType: ['main', Validators.required],
      referralCode: [{ value: '', disabled: true }]
    });

    // Add listener for walletType changes to trigger amount validation
    this.fundTransferForm.get('walletType')?.valueChanges.subscribe(() => {
      this.fundTransferForm.get('amount')?.updateValueAndValidity();
    });

    // Add listener to enable/disable referralCode based on walletType
    this.fundTransferForm.get('walletType')?.valueChanges.subscribe(value => {
      const referralControl = this.fundTransferForm.get('referralCode');
      if (value === 'trade') {
        referralControl?.enable();
        referralControl?.setValidators([Validators.required]);
      } else {
        referralControl?.disable();
        referralControl?.clearValidators();
      }
      referralControl?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    this.token = localStorage.getItem('authToken');
    this.getUserData();
    this.checkWithdrawalLock(); // Add this line
  }

  // Updated getUserData method
  getUserData() {
    this.authServices.toggleLoader(true);
    this.authServices.getProfile(this.token).subscribe({
      next: (response) => {
        this.mainBalance = response.data.BUSDBalance;
        this.totalInternalTransferBalance = response.data.TRADEBalance;
        this.authServices.toggleLoader(false);
      },
      error: (error) => {
        this.toastr.error('Failed to load profile information', 'Error');
        this.authServices.toggleLoader(false);
      }
    });
  }

  checkWithdrawalLock() {
    this.walletService.getWithdrawalLockStatus(this.token).subscribe({
      next: (response: any) => {
        if (response.balanceBreakdown) {
          this.balanceBreakdown = response.balanceBreakdown;
          this.withdrawableBalance = response.balanceBreakdown.withdrawableAmount || 0;
          this.totalBalance = response.balanceBreakdown.totalBalance || 0;
          this.regularDeposits = response.balanceBreakdown.regularDeposits || 0;
          this.bondedAmount = response.balanceBreakdown.bondedAmount || 0;
          this.referralIncome = response.balanceBreakdown.referralIncome || 0;
          this.stakedAmount = response.balanceBreakdown.lockedAmount || 0;
          this.userBlance = response.balanceBreakdown.totalBalance || 0;
          this.totalWithdrawn = response.balanceBreakdown.totalWithdrawn || 0;
          this.bonusAmount = response.balanceBreakdown.bonusAmount || 0;
        }

        if (response.lockStatus) {
          this.lockStatus = response.lockStatus;
          this.isWithdrawalLocked = response.lockStatus.isLocked || false;
          if (this.isWithdrawalLocked && response.lockStatus.lockedUntil) {
            this.lockedUntil = new Date(response.lockStatus.lockedUntil);
            this.lockedMessage = this.formatLockDuration(this.lockedUntil);
          }
        }

        if (response.activePlans) {
          this.activePlans = response.activePlans;
        }
      },
      error: (err) => {
        this.toastr.error('Failed to check withdrawal lock status');
      }
    });
  }

formatLockDuration(lockDate: Date): string {
  if (this.withdrawableBalance > 0) {
    return `Available for withdrawal: ${this.withdrawableBalance} USDT
            (Regular Deposits: ${this.regularDeposits} USDT, 
            Referral Income: ${this.referralIncome} USDT)
            Locked in Staking: ${this.bondedAmount} USDT`;
  }
  
  if (this.activePlans && this.activePlans.length > 0) {
    const totalLocked = this.activePlans.reduce((sum, plan) => sum + plan.depositAmount, 0);
    return `All withdrawable funds are locked. Total locked amount: ${totalLocked} USDT`;
  }
  
  return 'No funds available for withdrawal';
}
  // Keep existing checkReferralCode method
  // checkReferralCode() { ... }

  // New method for wallet to wallet transfer
  transferBetweenWallets() {
    if (this.fundTransferForm.valid) {
      this.authServices.toggleLoader(true);
      const transferData = {
        amount: this.fundTransferForm.value.amount,
        password: this.fundTransferForm.value.password
      };
      
      this.walletService.transferBetweenWallets(transferData, this.token).subscribe({
        next: (response) => {
          this.toastr.success(response.message ? response.message : "Transaction Successfull", '', {
            toastClass: 'toast-custom toast-success',
            positionClass: 'toast-bottom-center',
            closeButton: false,
            timeOut: 3000,
            progressBar: true
          });
          this.getUserData();
          this.checkWithdrawalLock();
          this.fundTransferForm.reset();
          this.authServices.toggleLoader(false);
        },
        error: (err) => {
          this.authServices.toggleLoader(false);
          const errorMessage = err.error?.message || 'Transfer failed';
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
          this.toastr.success(response.message, 'Transaction Successful', {
            toastClass: 'toast-custom toast-success',
            positionClass: 'toast-bottom-center',
            closeButton: false,
            timeOut: 3000,
            progressBar: true
          });
          this.getUserData();
          this.checkWithdrawalLock();
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
  // Helper method to determine which transfer method to use
  handleTransfer() {
    switch(this.fundTransferForm.value.walletType) {
        case 'trade':
            this.fundTransfer();
            break;
        case 'main':
            this.transferBetweenWallets();
            break;
        case 'trade-to-main':
            this.transferToMainWallet();
            break;
    }
}

transferToMainWallet() {
    const data = {
        amount: this.fundTransferForm.value.amount,
        password: this.fundTransferForm.value.password
    };
    
    this.walletService.transferToMain(data, this.token).subscribe({
        next: (response) => {
          this.toastr.success(response.message ? response.message : "Trade to Main Successfull", '', {
            toastClass: 'toast-custom toast-success',
            positionClass: 'toast-bottom-center',
            closeButton: false,
            timeOut: 3000,
            progressBar: true
          });
            this.getUserData(); 
            this.checkWithdrawalLock();
            this.fundTransferForm.reset();
        },
        error: (error) => {
            this.toastr.error(error.error.message);
        }
    });
}
}
