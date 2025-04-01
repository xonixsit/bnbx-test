import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { ToastrService } from 'ngx-toastr';
import { AuthServicesService } from 'src/app/services/auth/auth-services.service';
import { WalletServiceService } from 'src/app/services/wallet/wallet-service.service';
import { ActivePlan, BalanceBreakdown, LockStatus } from 'src/app/models/balance.model';

@Component({
  selector: 'app-withdraw',
  templateUrl: './withdraw.component.html',
  styleUrls: ['./withdraw.component.scss']
})

// Add these properties to the component class
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
  lockedUntil: Date | null = null;
  isWithdrawalLocked: boolean = false;
  lockedMessage: string = '';
  withdrawableBalance: number = 0;
  showBalance = false;
  totalBalance: number = 0;
  stakedAmount: number = 0;
  // Add these new properties
  regularDeposits: number = 0;
  referralIncome: number = 0;
  bondedAmount: number = 0;
  balanceBreakdown: BalanceBreakdown | null = null;
  lockStatus: LockStatus | null = null;
  showPlansBalance: boolean = false;
  activePlans: ActivePlan[] = [];
  totalWithdrawn: number = 0;
  bonusAmount: number = 0;
  totalTransferred:number = 0;

    // Add these new properties after existing properties
    BUSDBalance: number = 0;
    totalReferralRewardBalance: number = 0;
    totalBonusBalance: number = 0;
    totalStakedBalance: number = 0;
    availableBalances = {
      referral: 0,
      bonus: 0
    };
    // Components breakdown
    deposits: number = 0;
    tradeToMain: number = 0;
    mainToTrade: number = 0;
    withdrawals = {
      total: 0,
      busd: 0,
      referral: 0,
      bonus: 0
    };
      
  // Change from property to method
  isAnySourceSelected(): boolean {
    return this.withdrawForm.get('depositSource')?.value ||
           this.withdrawForm.get('referralSource')?.value ||
           this.withdrawForm.get('bonusSource')?.value;
  }
  constructor(
    private walletService: WalletServiceService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private authServices: AuthServicesService
  ) {
    this.withdrawForm = this.fb.group({
      source: ['DEPOSIT', [Validators.required]], // Set default to DEPOSIT
      amount: ['', [
        Validators.required, 
        Validators.min(0),
        (control: AbstractControl) => {
          const amount = Number(control.value);
          const source = this.withdrawForm?.get('source')?.value;
          let maxAmount = 0;
          
          switch(source) {
            case 'DEPOSIT':
              maxAmount = this.BUSDBalance;
              break;
            case 'REFER-INCOME':
              maxAmount = this.totalReferralRewardBalance;
              break;
            case 'SIGNUP-BONUS':
              maxAmount = this.totalBonusBalance;
              break;
            default:
              maxAmount = 0;
          }
          
          return amount > maxAmount ? 
            { exceedsBalance: { max: maxAmount, actual: amount } } : 
            null;
        }
      ]],
      chain: ['BEP20', Validators.required],
      address: ['', [Validators.required, this.addressValidator()]],
      password: ['', Validators.required]
    });

    // Update address validation when chain changes
    this.withdrawForm.get('chain')?.valueChanges.subscribe(chain => {
      this.withdrawForm.get('address')?.updateValueAndValidity();
    });

    // Update validation when source changes
    this.withdrawForm.get('source')?.valueChanges.subscribe(() => {
      const amountControl = this.withdrawForm.get('amount');
      if (amountControl) {
        amountControl.updateValueAndValidity();
      }
    });

    // Trigger amount validation when component initializes
    this.withdrawForm.get('amount')?.updateValueAndValidity();
  }


  // Add this new method for dynamic address validation
  private addressValidator() {
    return (control: AbstractControl) => {
      const chain = this.withdrawForm?.get('chain')?.value;
      const address = control.value;
      
      if (chain === 'BEP20') {
        return /^0x[a-fA-F0-9]{40}$/.test(address) ? null : { invalidAddress: true };
      } else if (chain === 'TRC20') {
        // Updated TRC20 address validation pattern
        return /^T[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{33}$/.test(address) ? null : { invalidAddress: true };
      }
      return { invalidChain: true };
    };
  }
  ngOnInit(): void {
    this.token = localStorage.getItem('authToken');
    this.getUserData();
    this.checkWithdrawalLock();
  }
  togglePlansBalance() {
    this.showPlansBalance = !this.showPlansBalance;
}

  toggleBalance() {
    this.showBalance = !this.showBalance;
  }


  // Update checkWithdrawalLock method
  checkWithdrawalLock() {
    this.walletService.getWithdrawalLockStatus(this.token).subscribe({
      next: (response: any) => {
        // Keep existing balance assignments
        if (response.balanceBreakdown) {
          this.balanceBreakdown = response.balanceBreakdown;
          this.withdrawableBalance = response.withdrawableBalance || 0;
          this.stakedAmount = response.balanceBreakdown.totalStakedBalance || 0;
          // Add new balance assignments
          this.BUSDBalance = response.balanceBreakdown.totalBalance || 0;
          this.totalReferralRewardBalance = response.balances.referral || 0;
          this.totalBonusBalance = response.balances.bonus || 0;
          this.availableBalances = {
            referral: response.components?.balances?.referral || 0,
            bonus: response.components?.balances?.bonus || 0
          };
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

  // Update formatLockDuration method
  formatLockDuration(lockDate: Date): string {
    if (this.withdrawableBalance > 0) {
      return `Available for withdrawal: ${this.withdrawableBalance} USDT
              (Regular Deposits: ${this.toggleBalance} USDT, 
              Referral Income: ${this.availableBalances.referral} USDT,
              Bonus Balance: ${this.availableBalances.bonus} USDT)
              Locked in Staking: ${this.totalStakedBalance} USDT`;
    }
    
    if (this.activePlans && this.activePlans.length > 0) {
    const totalLocked = this.activePlans.reduce((sum, plan) => sum + plan.depositAmount, 0);
    return `All withdrawable funds are locked. Total locked amount: ${totalLocked} USDT`;
  }
  
  return 'No funds available for withdrawal';
}

  withdraw() {
    const amount = Number(this.withdrawForm.value.amount);
    const source = this.withdrawForm.value.source;
    let sourceBalance = 0;
     // Check available balance based on source
    switch(source) {
      case 'DEPOSIT':
        sourceBalance = this.BUSDBalance;
        break;
      case 'REFER-INCOME':
        sourceBalance = this.totalReferralRewardBalance;
        break;
      case 'SIGNUP-BONUS':
        sourceBalance = this.totalBonusBalance
        break;
    }

    if (amount > sourceBalance) {
      this.toastr.error('Insufficient balance for withdrawal');
      return;
    }

    if (this.withdrawForm.valid) {
      this.authServices.toggleLoader(true);
      const withdrawData = {
        amount: this.withdrawForm.value.amount,
        chain: this.withdrawForm.value.chain,
        address: this.withdrawForm.value.address,
        password: this.withdrawForm.value.password,
        source: this.withdrawForm.value.source
      };

      this.walletService.withdraw(withdrawData, this.token).subscribe({
        next: (response:any) => {
          this.toastr.success(response.body.message || 'Withdrawal request submitted successfully', '', {
            toastClass: 'toast-custom toast-success',
            positionClass: 'toast-bottom-center',
            closeButton: false,
            timeOut: 3000,
            progressBar: true
          });
          this.getUserData();
          this.withdrawForm.reset();
          this.withdrawForm.patchValue({ chain: 'BEP20' }); // Reset chain to default value
          this.authServices.toggleLoader(false);
        },
        error: (err) => {
          this.authServices.toggleLoader(false);
          const errorMessage = err.error?.message || 'Failed to process withdrawal request';
          this.toastr.error(errorMessage, '', {
            toastClass: 'toast-custom toast-error',
            positionClass: 'toast-bottom-center',
            closeButton: false,
            timeOut: 3000,
            progressBar: true
          });
        }
      });
    } else {
      this.toastr.error('Please fill all required fields correctly', '', {
        toastClass: 'toast-custom toast-error',
        positionClass: 'toast-bottom-center',
        closeButton: false,
        timeOut: 3000,
        progressBar: true
      });
    }
  }

  getUserData() {
    this.authServices.toggleLoader(true);
    this.authServices.getProfile(this.token).subscribe({
      next: (response: any) => {
        this.userBlance = response.data.BUSDBalance;
        this.authServices.toggleLoader(false);
      },
      error: (error: any) => {
        this.toastr.error('Failed to load balance information', 'Error');
        this.authServices.toggleLoader(false);
      }
    });
  }
}
