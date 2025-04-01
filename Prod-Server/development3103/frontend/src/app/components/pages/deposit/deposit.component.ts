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
  selector: 'app-deposit',
  templateUrl: './deposit.component.html',
  styleUrls: ['./deposit.component.scss']
})


export class DepositComponent implements OnInit {
  depositForm: FormGroup;
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
    this.depositForm = this.fb.group({
      amount: [0, [Validators.required]],
      network: ['BEP20', Validators.required]
    });
  }

  ngOnInit(): void {
    this.token = localStorage.getItem('authToken');
    this.walletService.toggleLoader(false);
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
  
  // Add this method to check form state
  get isFormValid(): boolean {
    return this.depositForm.valid && this.depositForm.get('amount')?.value > 0;
  }
  
  // Update the deposit method
  deposit() {
    
    if (this.depositForm.valid) {
      this.walletService.toggleLoader(true);
      const currentAmount = this.depositForm.get('amount')?.value;
      const currentNetwork = this.depositForm.get('network')?.value;
      
      const depositDataSend = {
        amount: currentAmount,
        network: currentNetwork,
      };

      this.walletService.deposit(depositDataSend, this.token!).subscribe({
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

  verifyDepositTxnHash(transactionHash: string) {
    if (!this.token) {
      this.toastr.error('Token not found. Please log in again.');
      return;
    }

    const amount = this.depositForm.get('amount')?.value;
    if (!amount) {
      this.toastr.error('Please enter deposit amount');
      return;
    }

    const verificationData = {
      transactionHash,
      amount,
    };

    this.walletService.verifyDepositTxnHash(verificationData, this.token).subscribe({
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

}