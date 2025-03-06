import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthServicesService } from '../../../services/auth/auth-services.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  isDarkMode = false;
  isPasswordVisible: boolean = false;
  isForgotPassword: boolean = false;  // Flag to toggle between login and forgot password forms
  loginForm: FormGroup; // Define the login form
  changePasswordFormOTP: FormGroup; // Define the login form
  changePasswordForm: FormGroup;  // Define the forgot password form
  changePassword: FormGroup;  // Define the forgot password form
  isOldPasswordVisible: boolean = false;
  isNewPasswordVisible: boolean = false;
  isConfirmPasswordVisible: boolean = false;
  currentStep = 1; // Tracks the current step in the process
  token: any
  constructor(
    private fb: FormBuilder,
    private authServices: AuthServicesService,
    private router: Router,
    private toastr: ToastrService
  ) {
    // Initialize the login form with validation
    this.loginForm = this.fb.group({
      loginId: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
    this.changePasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],


    });
    this.changePasswordFormOTP = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      otp: [''],

    });
    this.changePassword = this.fb.group({

      newPassword: ['', [Validators.required]],
      cnfPassword: ['', [Validators.required]],

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

  ngOnInit() {
    this.authServices.toggleLoader(false);
    this.token = localStorage.getItem('authToken');
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark-mode');
      this.isDarkMode = true;
    }
  }

  togglePasswordVisibility() {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const loginId = this.loginForm.value.loginId;
      const password = this.loginForm.value.password;
      
      this.authServices.login(loginId , password ).subscribe({
        next: (response: any) => {
          const token = response.data.token;
          if (token) {
            localStorage.setItem('authToken', token); // Save token to localStorage
            this.toastr.success(response.message, '', {
              toastClass: 'toast-custom toast-success',
              positionClass: 'toast-bottom-center',
              closeButton: false,
              timeOut: 3000,
              progressBar: true
            });
            this.router.navigate(['/dashboard']); // Navigate to the dashboard
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
      console.log('Form is invalid');
    }
  }

  showForgotPassword() {
    this.isForgotPassword = true;
    this.currentStep = 2; // Move to OTP verification


  }

  toggleOldPasswordVisibility(): void {
    this.isOldPasswordVisible = !this.isOldPasswordVisible;
  }

  toggleNewPasswordVisibility(): void {
    this.isNewPasswordVisible = !this.isNewPasswordVisible;
  }

  toggleConfirmPasswordVisibility(): void {
    this.isConfirmPasswordVisible = !this.isConfirmPasswordVisible;
  }

  backToLogin() {
    this.isForgotPassword = false;
  }

  sendOtp() {
    if (this.changePasswordForm.valid) {
      const email = this.changePasswordForm.value.email;
      this.authServices.forgotLoginPassword(email).subscribe({
        next: (response: any) => {
          this.isForgotPassword = false;
          this.currentStep = 3; // Move to OTP verification
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
  }

  dataToken: any
  verifyOtp() {
    const email = this.changePasswordForm.value.email;
    const otp = this.changePasswordFormOTP.value.otp;
    this.authServices.verifyOtp(email, otp).subscribe({
      next: (response: any) => {
        this.currentStep = 4; // Move to OTP verification
        this.dataToken = response.data
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

  resetPassword() {
    const newPassword = this.changePassword.value.newPassword;
    const cnfPassword = this.changePassword.value.cnfPassword;
  
    if (newPassword !== cnfPassword) {
      alert('Passwords do not match.');
      return;
    }
  
    this.authServices.resetPassword(newPassword, cnfPassword, this.dataToken).subscribe({
      next: (response: any) => {
        this.toastr.success(response.message, '', {
          toastClass: 'toast-custom toast-success',
          positionClass: 'toast-bottom-center',
          closeButton: false,
          timeOut: 3000,
          progressBar: true
        });
  
        // Refresh the page after the success message
        setTimeout(() => {
          window.location.reload(); // Refresh the entire page
        }, 3000); // Adjust timeout to match your toast duration
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
  

}
