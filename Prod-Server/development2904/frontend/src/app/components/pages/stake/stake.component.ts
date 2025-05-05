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
  selectedBalanceTypes: BalanceSelection[] = BALANCE_TYPES.map(type => ({
    type,
    selected: false,
    amount: 0
  }));
  balanceComponents: { [key: string]: number } = {
    deposits: 0,
    referrals: 0,
    bonus: 0,
    returnInterest:0
  };
  // Timer variables
  timer: number = 15 * 60;
  intervalId: any;
  buttonEnabled: boolean = true;
  verificationNetwork: string = 'BEP20';
  profileData: any;
  isBonusStake: boolean = false;
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
      lockPeriod: ['30', Validators.required],
      isBonusStake: [false]
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

  selectedBalanceType: BalanceSelection = { type: BALANCE_TYPES[0], selected: false, amount: 0 }; // Initialize with the first balance type

  // Update selection logic to ensure exclusive selection
  selectBalanceType(type: BalanceType) {
    this.selectedBalanceType = { type, selected: true, amount: 0 };
    this.depositStakeForm.patchValue({ balanceType: type });
    this.selectedBalanceTypes.forEach(balanceType => {
      balanceType.selected = balanceType.type === type;
    });
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
          lockPeriod: this.stakeForm.get('lockPeriod')?.value
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
      amount: amount, // Only send the input amount for verification
      planId: this.selectedPlan,
      planName: selectedPlanDetails.name,
      dailyRate: selectedPlanDetails.rate,
      lockPeriod: this.stakeForm.get('lockPeriod')?.value,
      network:this.stakeForm.get('network')?.value,
      transactionHash: transactionHash,
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
        this.depositStakeForm.get('amount')?.setValue(this.getMinAmount());
        this.calculateDepositDailyReturn();
      } else {
        this.stakeForm.get('amount')?.setValue(this.getMinAmount());
        this.calculateDailyReturn();
      }
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

      if (selectedPlan && amount > selectedPlan.max) {
        this.depositStakeForm.get('amount')?.setErrors({
          maximumRequired: `Maximum amount allowed for ${selectedPlan.name} plan is ${selectedPlan.max} USDT`
        });
      }

      //amount should not greater than balance
      if (selectedPlan && amount > this.balanceComponents[this.depositStakeForm.get('balanceType')?.value || 'deposits']) {
        this.depositStakeForm.get('amount')?.setErrors({
          maximumRequired: `Maximum amount allowed for ${selectedPlan.name} plan is ${this.balanceComponents[this.depositStakeForm.get('balanceType')?.value || 'deposits']} USDT`
        })
      }
    }

    getProfileInfo(): void {
      this.authService.toggleLoader(true);
      this.authService.getProfile(this.token!).subscribe({
        next: (response) => {
          this.profileData = response.data;
          this.balanceComponents = {
            deposits: this.profileData.balanceComponents.deposits || 0,
            referrals: this.profileData.balanceComponents.referral || 0,
            bonus: this.profileData.balanceComponents.bonus || 0,
            returnInterest: this.profileData.balanceComponents.returnInterest || 0,
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
    get isDepositFormValid(): boolean {
      const amount = this.depositStakeForm.get('amount')?.value || 0;
      const lockPeriodControl = this.depositStakeForm.get('lockPeriod');
      const balanceTypeControl = this.depositStakeForm.get('balanceType');
      const selectedPlan = this.getSelectedPlan();
      const selectedBalanceType = balanceTypeControl?.value;
      
      // Validate amount against selected balance type
      const maxBalance = selectedBalanceType ? this.balanceComponents[selectedBalanceType] : 0;
      let isAmountValid = false;
      
      if (selectedPlan && selectedBalanceType) {
        isAmountValid = amount > 0 && 
                       amount >= selectedPlan.min && 
                       amount <= Math.min(maxBalance, selectedPlan.max || Number.MAX_SAFE_INTEGER);
      }
      
      return this.depositStakeForm.valid && 
             this.selectedPlan !== 0 && 
             (lockPeriodControl?.valid ?? false) &&
             (balanceTypeControl?.valid ?? false) &&
             isAmountValid;
    }

    // Toggle balance type selection for staking
    toggleBalanceType(type: BalanceType) {
      const balanceSelection = this.selectedBalanceTypes.find(b => b.type === type);
      if (balanceSelection) {
        balanceSelection.selected = !balanceSelection.selected;
        
        // Reset amount when deselecting
        if (!balanceSelection.selected) {
          balanceSelection.amount = 0;
        }
        
        this.updateTotalStakingAmount();
      }
    }

    // Update amount for a specific balance type
    updateBalanceAmount(type: BalanceType, amount: number) {
      const balanceSelection = this.selectedBalanceTypes.find(b => b.type === type);
      if (balanceSelection && balanceSelection.selected) {
        const maxAmount = this.balanceComponents[type];
        balanceSelection.amount = Math.min(amount, maxAmount);
        this.updateTotalStakingAmount();
      }
    }

    // Calculate and update total staking amount
    updateTotalStakingAmount() {
      const totalAmount = this.selectedBalanceTypes
        .filter(b => b.selected)
        .reduce((sum, b) => sum + b.amount, 0);

      this.depositStakeForm.patchValue({ amount: totalAmount });
      this.calculateDepositDailyReturn();
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

        this.walletService.toggleLoader(true);
          
        const stakeDataSend = {
          amount: this.depositStakeForm.get('amount')?.value,
          planId: this.selectedPlan,
          planName: selectedPlanDetails.name,
          dailyRate: selectedPlanDetails.rate,
          lockPeriod: this.depositStakeForm.get('lockPeriod')?.value,
          fromDeposit: true,
          balanceType: this.selectedBalanceType.type,
          isBonusStake:this.isBonusStake,
          transactionHash: `Staking from Deposit balance type ${this.selectedBalanceType.type}`
        };

        this.walletService.verifyTransactionHash(stakeDataSend, this.token!).subscribe({
          next: (response: any) => {
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
    
// Method to toggle isBonusStake
onBonusStakeToggle() {
  this.isBonusStake = !this.isBonusStake;
  this.stakeForm.patchValue({ isBonusStake: this.isBonusStake });
}
}
type BalanceType = 'deposits' | 'referrals' | 'returnInterest';

// Add available balance types array for template iteration
const BALANCE_TYPES: BalanceType[] = ['deposits', 'referrals','returnInterest'];

interface BalanceSelection {
  type: BalanceType;
  selected: boolean;
  amount: number;
}
