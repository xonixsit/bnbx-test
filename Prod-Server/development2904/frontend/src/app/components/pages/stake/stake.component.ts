import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { from } from 'rxjs';
import { AuthServicesService } from 'src/app/services/auth/auth-services.service';
import { WalletServiceService } from 'src/app/services/wallet/wallet-service.service';
interface InvestmentPlan {
  id: number;
  name: string;
  min: number;
  max: number;
  rate: number;
}

@Component({
  selector: 'app-stake',
  templateUrl: './stake.component.html',
  styleUrls: ['./stake.component.scss']
})


export class StakeComponent implements OnInit {
  balanceTypes = BALANCE_TYPES;
  stakeForm: FormGroup;
  depositStakeForm: FormGroup;
  token: string | null = null;
  transactionHash: string = '';
  qrCodeUrl: string | null = null;
  expirationMessage: string | null = null;
  depositAddress: any;
  imageShow: boolean = false;
  stakingMethod: 'wallet' | 'deposit' = 'wallet';
  selectedBalanceTypes: ('deposits' | 'referrals' | 'bonus')[] = [];
  selectedAmounts: { [key: string]: number } = {
    deposits: 0,
    referrals: 0,
    bonus: 0
  };
  balanceComponents: { [key: string]: number } = {
    deposits: 0,
    referrals: 0,
    bonus: 0
  };
  // Timer variables
  timer: number = 15 * 60;
  intervalId: any;
  buttonEnabled: boolean = true;
  verificationNetwork: string = 'BEP20';
  profileData: any;

  // Add new properties for network-specific data
  bep20QrCode: string | null = null;
  trc20QrCode: string | null = null;
  bep20Address: string | null = null;
  trc20Address: string | null = null;

  // Add these properties with existing ones
  selectedPlan: number = 0;
  dailyReturn: number = 0;
  depositDailyReturn: number = 0;
  plansArray: InvestmentPlan[] = [];

  // Update constructor to handle fromDeposit changes more effectively
  constructor(private authService: AuthServicesService, private walletService: WalletServiceService, private fb: FormBuilder, private toastr: ToastrService, private router: Router) {
    this.stakeForm = this.fb.group({
      amount: [0, [Validators.required]],
      network: ['BEP20', Validators.required],
      lockPeriod: ['30', Validators.required]
    });

    this.depositStakeForm = this.fb.group({
      amount: [0, [Validators.required]],
      lockPeriod: ['30', Validators.required],
      balanceType: ['deposits', Validators.required]
    });
  }
   selectPlan(plan: InvestmentPlan) {
    this.selectedPlan = plan.id;
    const amountControl = this.stakeForm.get('amount');
    
    // Set initial amount to plan minimum
    amountControl?.setValue(plan.min);
    
    // Update validators
    amountControl?.setValidators([
      Validators.required,
      Validators.min(plan.min),
      Validators.max(plan.max || 9999999999)
    ]);
    
    amountControl?.updateValueAndValidity({ emitEvent: true });
    this.calculateDailyReturn();
  }
  
  validateStakeAmount() {
    const amount = this.stakeForm.get('amount')?.value;
    const selectedPlan = this.getSelectedPlan();

    if (selectedPlan && amount < selectedPlan.min) {
      this.stakeForm.get('amount')?.setErrors({ 
        minimumRequired: `Minimum amount required for ${selectedPlan.name} plan is ${selectedPlan.min} USDT`
      });
    }
  }

  ngOnInit(): void {
    this.token = localStorage.getItem('authToken');
    this.getProfileInfo();
    this.walletService.toggleLoader(false);
    this.loadInvestmentPlans();
  }

  loadInvestmentPlans() {
    this.walletService.getInvestmentPlans().subscribe({
      next: (response: any) => {
        if (response.status && response.data) {
          this.plansArray = response.data;
        }
      },
      error: (err) => {
        this.toastr.error('Error loading investment plans');
      }
    });
  }

  ngOnDestroy(): void {
    // Clear the timer when component is destroyed
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  // Method to start the timer
  startTimer() {
    this.intervalId = setInterval(() => {
      this.timer--;
      if (this.timer <= 0) {
        this.buttonEnabled = false;
        this.expirationMessage = 'Time up';
        clearInterval(this.intervalId); // Stop the timer
      }
    }, 1000); // Update every second
  }

  get minutes(): number {
    return Math.floor(this.timer / 60);  // Get full minutes from total seconds
  }

  get seconds(): number {
    return this.timer % 60;  // Get the remaining seconds
  }

  // Update form validity check
  get isFormValid(): boolean {
    const amount = this.stakeForm.get('amount')?.value;
    const selectedPlan = this.getSelectedPlan();
    
    // Detailed form control validation logging
    const amountControl = this.stakeForm.get('amount');
    const networkControl = this.stakeForm.get('network');
    const lockPeriodControl = this.stakeForm.get('lockPeriod');
    
    // Basic controls validation
    const isNetworkValid = networkControl?.valid;
    const isLockPeriodValid = lockPeriodControl?.valid;
    
    // Non-deposit case or when wallet balance is 0
    return !!(amountControl?.valid && isNetworkValid && isLockPeriodValid) && 
           this.selectedPlan !== 0 && 
           amount > 0;
  }
  
  // Update calculateDailyReturn method
  calculateDailyReturn() {
    const amount = this.stakeForm.get('amount')?.value;
    const selectedPlan = this.getSelectedPlan();
    
    if (selectedPlan && amount > 0) {
      const dailyRate = selectedPlan.rate;
      const lockPeriod = this.stakeForm.get('lockPeriod')?.value;
      this.dailyReturn = amount * dailyRate;
      
      // Calculate total return for the lock period
      const totalReturn = this.dailyReturn * lockPeriod;
      return {
        daily: this.dailyReturn.toFixed(2),
        total: totalReturn.toFixed(2)
      };
    }
    return null;
  }

  // Update the deposit method
  stake() {
    if (!this.selectedPlan) {
      this.toastr.error('Please select an investment plan');
      return;
    }
    if (this.stakeForm.valid) {
      const selectedPlanDetails = this.plansArray.find(plan => plan.id === this.selectedPlan);
      if (!selectedPlanDetails) {
        this.toastr.error('Invalid plan selected');
        return;
      }

      this.walletService.toggleLoader(true);
      const inputAmount = this.stakeForm.get('amount')?.value;
    
        // Regular staking process with deposit
        const stakeDataSend = {
          amount: inputAmount,
          network: this.stakeForm.get('network')?.value,
          planId: this.selectedPlan,
          planName: selectedPlanDetails.name,
          dailyRate: selectedPlanDetails.rate,
          lockPeriod: this.stakeForm.get('lockPeriod')?.value,
        };

        this.walletService.stake(stakeDataSend, this.token!).subscribe({
          next: (response: any) => {
            this.toastr.success(response.body.message, '', {
              toastClass: 'toast-custom toast-success',
              positionClass: 'toast-bottom-center',
              closeButton: false,
              timeOut: 3000,
              progressBar: true
            });
            this.imageShow = true;
            // Extract data from the API response
            this.qrCodeUrl = response.body.body.data;
            this.expirationMessage = response.body.body.message1;
            this.depositAddress = response.body.body.depositAddress;
            // Start the timer for verification
            this.timer = 15 * 60;
            this.buttonEnabled = true;
            if (this.intervalId) {
              clearInterval(this.intervalId);
            }
            this.startTimer();
            this.walletService.toggleLoader(false);
          },
          error: (err) => {
            this.walletService.toggleLoader(false);
            const errorMessage = err.error?.message || 'Error processing stake';
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

  copyLoginIdLink() {
    navigator.clipboard.writeText(this.depositAddress)
      .then(() => {
        this.toastr.success('Deposit Address copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy Deposit Address  ', err);
        this.toastr.error('Failed to copy Deposit Address ');
      });
  }

  verifyTransactionHash(transactionHash: string) {
    if (!this.token) {
      this.toastr.error('Token not found. Please log in again.');
      return;
    }

    const amount = this.stakeForm.get('amount')?.value;

    if (!amount) {
      this.toastr.error('Please enter deposit amount');
      return;
    }

    const selectedPlanDetails = this.plansArray.find(plan => plan.id === this.selectedPlan);
    if (!selectedPlanDetails) {
      this.toastr.error('Invalid plan selected');
      return;
    }

    const verificationData = {
      transactionHash,
      amount: amount, // Only send the input amount for verification
      network: this.stakeForm.get('network')?.value,
      planId: this.selectedPlan,
      planName: selectedPlanDetails.name,
      dailyRate: selectedPlanDetails.rate,
      lockPeriod: this.stakeForm.get('lockPeriod')?.value,
      netwok:this.stakeForm.get('network')?.value,
    };

    this.walletService.verifyTransactionHash(verificationData, this.token).subscribe({
      next: (response) => {
        this.toastr.success('Transaction sent for verification', '', {
          toastClass: 'toast-custom toast-success',
          positionClass: 'toast-bottom-center',
          closeButton: false,
          timeOut: 3000,
          progressBar: true
        });
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Error verifying transaction';
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

  copyToClipboard(inputElement: HTMLInputElement) {
    inputElement.select();
    document.execCommand('copy');
    this.toastr.success('Address copied to clipboard!');
  }

  // Add this helper method
  getSelectedPlan(): InvestmentPlan | undefined {
    return this.plansArray.find(plan => plan.id === this.selectedPlan);
  }
  validateMinAmount() {
      const amountControl = this.stakeForm.get('amount');
      const selectedPlan = this.getSelectedPlan();
      
      if (amountControl && selectedPlan) {
        const amount = amountControl.value;
          amountControl.setValue(selectedPlan.min);
          this.calculateDailyReturn();
          return selectedPlan.min;
      }
      return 0;
    }
  // Add this helper method
    getMinAmount(): number {
      const selectedPlan = this.getSelectedPlan();
      return selectedPlan?.min || 0;
    }

    // Method to switch between staking methods
    selectStakingMethod(method: 'wallet' | 'deposit') {
      this.stakingMethod = method;
      this.imageShow = false;
      if (method === 'deposit') {
        this.selectedBalanceTypes = [];
        this.resetSelectedAmounts();
        this.depositStakeForm.get('amount')?.setValue(this.getMinAmount());
        this.calculateDepositDailyReturn();
      } else {
        this.stakeForm.get('amount')?.setValue(this.getMinAmount());
        this.calculateDailyReturn();
      }
    }

    // Toggle balance type selection
    toggleBalanceType(type: 'deposits' | 'referrals' | 'bonus') {
      const index = this.selectedBalanceTypes.indexOf(type);
      if (index === -1) {
        this.selectedBalanceTypes.push(type);
        this.updateSelectedAmount(type);
      } else {
        this.selectedBalanceTypes.splice(index, 1);
        this.selectedAmounts[type] = 0;
      }
      this.updateDepositFormAmount();
    }

    // Update selected amount for a balance type
    updateSelectedAmount(type: string) {
      const availableBalance = this.balanceComponents[type];
      const remainingRequired = this.getRemainingRequiredAmount();
      this.selectedAmounts[type] = Math.min(availableBalance, remainingRequired);
    }

    // Get remaining required amount after considering other selections
    getRemainingRequiredAmount(): number {
      const totalSelected = this.getTotalSelectedAmount();
      const requiredAmount = this.depositStakeForm.get('amount')?.value || 0;
      return Math.max(0, requiredAmount - totalSelected);
    }

    // Reset all selected amounts
    resetSelectedAmounts() {
      this.selectedAmounts = {
        deposits: 0,
        referrals: 0,
        bonus: 0
      };
    }

    // Get selected amount for a specific balance type
    getSelectedAmount(type: string): number {
      return this.selectedAmounts[type] || 0;
    }

    // Calculate total selected amount across all balance types
    getTotalSelectedAmount(): number {
      return Object.values(this.selectedAmounts).reduce((sum, amount) => sum + amount, 0);
    }

    // Update deposit form amount when balance selections change
    updateDepositFormAmount() {
      const totalSelected = this.getTotalSelectedAmount();
      this.depositStakeForm.get('amount')?.setValue(totalSelected);
      this.calculateDepositDailyReturn();
    }

    // Validate deposit stake amount
    validateDepositStakeAmount() {
      const amount = this.depositStakeForm.get('amount')?.value;
      const selectedPlan = this.getSelectedPlan();

      if (selectedPlan && amount < selectedPlan.min) {
        this.depositStakeForm.get('amount')?.setErrors({ 
          minimumRequired: `Minimum amount required for ${selectedPlan.name} plan is ${selectedPlan.min} USDT`
        });
      }
    }

    getProfileInfo(): void {
      this.authService.toggleLoader(true);
      this.authService.getProfile(this.token!).subscribe({
        next: (response) => {
          this.profileData = response.data;
          this.balanceComponents = {
            deposits: this.profileData.balanceComponents.deposits || 0,
            referrals: this.profileData.balanceComponents.referrals || 0,
            bonus: this.profileData.balanceComponents.bonus || 0
          };
          this.authService.toggleLoader(false);
        },
        error: (error) => {
          this.toastr.error('Failed to load profile information', 'Error');
          this.authService.toggleLoader(false);
        }
      });
    }
  
    // Calculate daily return for deposit staking
    calculateDepositDailyReturn() {
      const amount = this.depositStakeForm.get('amount')?.value;
      const selectedPlan = this.getSelectedPlan();
      
      if (selectedPlan && amount > 0) {
        const dailyRate = selectedPlan.rate;
        const lockPeriod = this.depositStakeForm.get('lockPeriod')?.value;
        this.depositDailyReturn = amount * dailyRate;
        
        const totalReturn = this.depositDailyReturn * lockPeriod;
        return {
          daily: this.depositDailyReturn.toFixed(2),
          total: totalReturn.toFixed(2)
        };
      }
      return null;
    }

    // Check if deposit staking form is valid
    get isDepositFormValid(): any {
      const amount = this.depositStakeForm.get('amount')?.value || 0;
      const lockPeriodControl = this.depositStakeForm.get('lockPeriod');
      const balanceTypeControl = this.depositStakeForm.get('balanceType');
      const selectedPlan = this.getSelectedPlan();
     
      // Validate amount against selected balance type
      const maxBalance = this.balanceComponents[this.selectedBalanceTypes];
      let isAmountValid = false;
      
      if (selectedPlan) {
        isAmountValid = amount > 0 && 
                       amount >= selectedPlan.min && 
                       amount <= Math.min(maxBalance, selectedPlan.max || Number.MAX_SAFE_INTEGER);
      }
      
      return this.depositStakeForm.valid && 
             this.selectedPlan !== 0 && 
             lockPeriodControl?.valid &&
             balanceTypeControl?.valid;
    }

    // Select balance type for staking
    selectBalanceType(type: BalanceType) {
      this.selectedBalanceType = type;
      this.depositStakeForm.patchValue({ balanceType: type });
      
      // Set max amount based on selected balance type
      const maxAmount = this.balanceComponents[type];
      const selectedPlan = this.getSelectedPlan();
      
      if (selectedPlan) {
        const currentAmount = this.depositStakeForm.get('amount')?.value;
        if (currentAmount > maxAmount) {
          this.depositStakeForm.patchValue({ amount: maxAmount });
        }
        
        // Update amount validator to include max balance
        this.depositStakeForm.get('amount')?.setValidators([
          Validators.required,
          Validators.min(selectedPlan.min),
          Validators.max(maxAmount)
        ]);
        this.depositStakeForm.get('amount')?.updateValueAndValidity();
      }
    }

    // Handle deposit staking
    stakeFromDeposit() {
      if (!this.selectedPlan) {
        this.toastr.error('Please select an investment plan');
        return;
      }
      if (this.depositStakeForm.valid) {
        const selectedPlanDetails = this.plansArray.find(plan => plan.id === this.selectedPlan);
        if (!selectedPlanDetails) {
          this.toastr.error('Invalid plan selected');
          return;
        }

        if (this.selectedBalanceTypes.length === 0) {
          this.toastr.error('Please select at least one balance type');
          return;
        }

        const totalAmount = this.getTotalSelectedAmount();
        const requestedAmount = this.depositStakeForm.get('amount')?.value;

        if (totalAmount !== requestedAmount) {
          this.toastr.error('Selected amounts do not match the required stake amount');
          return;
        }

        // Validate each selected balance type
        for (const type of this.selectedBalanceTypes) {
          const selectedAmount = this.selectedAmounts[type];
          if (selectedAmount > this.balanceComponents[type]) {
            this.toastr.error(`Insufficient ${type} balance`);
            return;
          }
        }

        this.walletService.toggleLoader(true);
        const stakeData = {
          amount: totalAmount,
          planId: this.selectedPlan,
          planName: selectedPlanDetails.name,
          dailyRate: selectedPlanDetails.rate,
          lockPeriod: this.depositStakeForm.get('lockPeriod')?.value,
          balanceTypes: this.selectedBalanceTypes.map(type => ({
            type,
            amount: this.selectedAmounts[type]
          }))
        };

        this.walletService.stakeFromDeposit(stakeData, this.token!).subscribe({
          next: (response: any) => {
            this.toastr.success('Stake successful');
            this.router.navigate(['/dashboard']);
            this.walletService.toggleLoader(false);
          },
          error: (err) => {
            this.walletService.toggleLoader(false);
            const errorMessage = err.error?.message || 'Error processing stake';
            this.toastr.error(errorMessage);
          }
        });
      }
    }
}
type BalanceType = 'deposits' | 'referrals' | 'bonus';

// Add available balance types array for template iteration
const BALANCE_TYPES: BalanceType[] = ['deposits', 'referrals', 'bonus'];