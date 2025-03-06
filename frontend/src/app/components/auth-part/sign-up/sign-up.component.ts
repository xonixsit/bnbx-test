import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthServicesService } from '../../../services/auth/auth-services.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent {
  signUpForm: any;
  otpForm: any;  // Add an OTP form for user input
  isOtpSent: boolean = false; // Track if OTP has been sent
  isDarkMode: boolean = false;
  isPasswordVisible: boolean = false;
  referralName: any = '';
  timer: number = 60;
  resendEnabled: boolean = false;
  interval: any;
  loginIdData: any
  constructor(
    private fb: FormBuilder,
    private authServices: AuthServicesService,
    private router: Router,
    private toastr: ToastrService,
    private route: ActivatedRoute,

  ) {
    this.signUpForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      mobile: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      cnfPassword: ['', Validators.required],
      referral: ['', Validators.required],
      termsConditions: [false, Validators.requiredTrue],
    });

    // Initialize the OTP form
    this.otpForm = this.fb.group({
      otp: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.authServices.toggleLoader(false);
    const theme = localStorage.getItem('theme');
    // this.loginIdData = localStorage.getItem('loginId')
    if (theme === 'dark') {
      document.documentElement.classList.add('dark-mode');
      this.isDarkMode = true;
    }
    this.startTimer();
    this.route.queryParams.subscribe(params => {
      const referralCode = params['referralCode'];
      if (referralCode) {
        this.signUpForm.controls['referral'].setValue(referralCode);
      }
    });
  }

  toggleDarkMode(data: boolean) {
    this.isDarkMode = !this.isDarkMode;
    const rootElement = document.documentElement;
    if (data) {
      rootElement.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      rootElement.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }

  startTimer() {
    this.resendEnabled = false;
    this.timer = 60;
    this.interval = setInterval(() => {
      if (this.timer > 0) {
        this.timer--;
      } else {
        this.resendEnabled = true;
        clearInterval(this.interval);
      }
    }, 1000);
  }

  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  onSubmit() {
    if (this.signUpForm.valid) {
      const userData = this.signUpForm.value;

      this.authServices.signUp(userData).subscribe({
        next: (response: any) => {

          this.loginIdData = response.data.userData.loginId; // Store loginId from response
         
          this.toastr.success(response.message, '', {
            toastClass: 'toast-custom toast-success',
            positionClass: 'toast-bottom-center',
            closeButton: false,
            timeOut: 3000,
            progressBar: true
          });
          this.sendOtp(userData.mobile, userData.email); // Send OTP after successful signup
        },

        error: (err) => {
          const errorMessage = err.error?.message || 'Something went wrong';
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
      this.toastr.error('Please fill out all required fields correctly.', '', {
        toastClass: 'toast-custom toast-error',
        positionClass: 'toast-bottom-center',
        closeButton: false,
        timeOut: 3000,
        progressBar: true
      });
    }
  }


  sendOtp(mobile: string, email: string) {
    this.authServices.sendEmailOtp(email, mobile).subscribe({
      next: (response) => {
        this.startTimer();
        this.isOtpSent = true; // Set flag to true indicating OTP has been sent
        this.toastr.success(response.message, '', {
          toastClass: 'toast-custom toast-success',
          positionClass: 'toast-bottom-center',
          closeButton: false,
          timeOut: 3000,
          progressBar: true
        });
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Something went wrong';
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


copyLoginIdLink(){

  navigator.clipboard.writeText(this.loginIdData)
  .then(() => {
    this.toastr.success('LoginId link copied to clipboard!');
    this.router.navigate(['/login'])
  })
  .catch(err => {
    console.error('Failed to copy loginId link: ', err);
    this.toastr.error('Failed to copy loginId link.');
  });

  
}

  mobileVerifyOtp() {
    const otpValue = this.otpForm.value.otp;
    const mobile = this.signUpForm.value.mobile;

    this.authServices.mobileVerifyOtp(mobile, otpValue).subscribe({
      next: (response) => {
        this.toastr.success(response.message, '', {
          toastClass: 'toast-custom toast-success',
          positionClass: 'toast-bottom-center',
          closeButton: false,
          timeOut: 3000,
          progressBar: true
        });
        this.router.navigate(['/login']); // Redirect to login page
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Something went wrong';
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
  emailVerifyOtp() {
    const otpValue = this.otpForm.value.otp;
    const email = this.signUpForm.value.email;

    this.authServices.mobileVerifyOtp(email, otpValue).subscribe({
      next: (response) => {
        this.toastr.success(response.message, '', {
          toastClass: 'toast-custom toast-success',
          positionClass: 'toast-bottom-center',
          closeButton: false,
          timeOut: 3000,
          progressBar: true
        });
        this.router.navigate(['/login']); // Redirect to login page
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Something went wrong';
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

  checkReferralCode() {

    const referralCode = this.signUpForm.get('referral')?.value;
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

  // copyLoginId() {
  //   if (this.loginIdData) {
  //     navigator.clipboard.writeText(this.loginIdData).then(() => {
  //       this.toastr.success('Login ID copied to clipboard', '', {
  //         toastClass: 'toast-custom toast-success',
  //         positionClass: 'toast-bottom-center',
  //         closeButton: false,
  //         timeOut: 3000,
  //         progressBar: true
  //       });
  //       this.loginIdData = null; // Hide loginId after copying
  //     }).catch(() => {
  //       this.toastr.error('Failed to copy Login ID', '', {
  //         toastClass: 'toast-custom toast-error',
  //         positionClass: 'toast-bottom-center',
  //         closeButton: false,
  //         timeOut: 3000,
  //         progressBar: true
  //       });
  //     });
  //   }
  // }
}
