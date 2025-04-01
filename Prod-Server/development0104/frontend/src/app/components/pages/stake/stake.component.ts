import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
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
  stakeForm: FormGroup;
  token: string | null = null;
  transactionHash: string = '';
  qrCodeUrl: string | null = null;
  expirationMessage: string | null = null;
  depositAddress: any;
  imageShow: boolean = false
  // Timer variables
  timer: number = 15 * 60;
  intervalId: any;
  buttonEnabled: boolean = true;
  verificationNetwork: string = 'BEP20'; // Add this property

  // Add new properties for network-specific data
  bep20QrCode: string | null = null;
  trc20QrCode: string | null = null;
  bep20Address: string | null = null;
  trc20Address: string | null = null;

  // Add these properties with existing ones
  selectedPlan: number = 0  ;
  dailyReturn: number = 0;
  
  plans = {
    basic: { min: 100, max: 499, rate: 0.0166 },
    advance: { min: 500, max: 999, rate: 0.02 },
    premium: { min: 1000, max: 4999, rate: 0.0233 },
    expert: { min: 5000, max: 9999999999, rate: 0.025 }
  };

  // Update the constructor with proper form initialization
  // Update the form initialization in constructor
  // Remove the hardcoded plansArray
  plansArray: InvestmentPlan[] = [];

  constructor(private walletService: WalletServiceService, private fb: FormBuilder, private toastr: ToastrService, private router: Router) {
    this.stakeForm = this.fb.group({
      amount: [0, [Validators.required]],
      network: ['BEP20', Validators.required],
      lockPeriod: ['30', Validators.required]
    });
  }

  ngOnInit(): void {
    this.token = localStorage.getItem('authToken');
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

  // Update selectPlan method
  selectPlan(plan: InvestmentPlan) {
    this.selectedPlan = plan.id;
    const amountControl = this.stakeForm.get('amount');
    amountControl?.setValue(plan.min); // Set minimum amount based on selected plan
    amountControl?.setValidators([
      Validators.required,
      Validators.min(plan.min),
      Validators.max(plan.max || 9999999999)
    ]);
    amountControl?.updateValueAndValidity();
    this.calculateDailyReturn();
  }

  // Update the selectedPlan type to match plan IDs  
  // Update calculateDailyReturn method
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
  
  // Add this method to check form state
  get isFormValid(): boolean {
    return this.stakeForm.valid && this.selectedPlan !== 0 && this.stakeForm.get('amount')?.value > 0;
  }
  
  // Update the deposit method
  stake() {
    console.log('Form State:', {
      formValid: this.stakeForm.valid,
      selectedPlan: this.selectedPlan,
      amount: this.stakeForm.get('amount')?.value
    });
    
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
  
      // const depositData = {
      //   ...this.depositForm.value,
      //   plan: this.selectedPlan,
      //   dailyRate: selectedPlanDetails.rate
      // };
      this.walletService.toggleLoader(true);
      // Store current values before any operations
      // Store current values and plan details
      const currentAmount = this.stakeForm.get('amount')?.value;
      const currentNetwork = this.stakeForm.get('network')?.value;
      // const selectedPlanDetails = this.plansArray.find(plan => plan.id === this.selectedPlan);
      
      const stakeDataSend = {
        amount: currentAmount,
        network: currentNetwork,
        planId: this.selectedPlan,
        planName: selectedPlanDetails?.name,
        dailyRate: selectedPlanDetails?.rate,
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
          this.imageShow = true
          // Extract data from the API response
          this.qrCodeUrl = response.body.body.data; // QR code image in base64 format
          this.expirationMessage = response.body.body.message1; // Expiry message
          this.depositAddress = response.body.body.depositAddress; // Deposit address
          // Start the timer for verification
          this.timer = 15 * 60; // Reset timer to 15 minutes
          this.buttonEnabled = true; // Enable the button
          // Start the timer again after a successful deposit
          if (this.intervalId) {
            clearInterval(this.intervalId); // Clear any existing interval
          }
          this.startTimer(); // Start a new timer
          this.imageShow = true;
          this.qrCodeUrl = response.body.body.data;
          this.expirationMessage = response.body.body.message1;
          this.depositAddress = response.body.body.depositAddress;          
          this.walletService.toggleLoader(false);
        },
        error: (err) => {
          this.walletService.toggleLoader(false);
          const errorMessage = err.error?.message || 'Error validating deposit';
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
      amount,
      planId: this.selectedPlan,
      planName: selectedPlanDetails.name,
      dailyRate: selectedPlanDetails.rate,
      lockPeriod: this.stakeForm.get('lockPeriod')?.value
    };

    this.walletService.verifyTransactionHash(verificationData, this.token).subscribe({
      next: (response) => {
        this.toastr.success('Transaction verified successfully.', '', {
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
      
      if (amountControl && selectedPlan && amountControl.value < selectedPlan.min) {
        amountControl.setValue(selectedPlan.min);
        this.calculateDailyReturn();
      }
    }
}