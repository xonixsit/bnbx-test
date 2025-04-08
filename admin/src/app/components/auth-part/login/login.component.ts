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
  isDarkMode = true;
  isPasswordVisible: boolean = false;
  isForgotPassword: boolean = false;  // Flag to toggle between login and forgot password forms
  loginForm: FormGroup; // Define the login form
  changePasswordForm: FormGroup;  // Define the forgot password form
  isOldPasswordVisible: boolean = false;
  isNewPasswordVisible: boolean = false;
  isConfirmPasswordVisible: boolean = false;
  token: any
  constructor(
    private fb: FormBuilder,
    private authServices: AuthServicesService,
    private router: Router,
    private toastr: ToastrService
  ) {
    // Initialize the login form with validation
    this.loginForm = this.fb.group({
      mobile: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
    this.changePasswordForm = this.fb.group({
      oldPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      cnfPassword: ['', [Validators.required, Validators.minLength(6)]]
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
      
      const loginData = this.loginForm.value;
      this.authServices.login(loginData).subscribe({
        next: (response: any) => {
          const token = response.data.token;
          const referralCode = response.data.sendData.referralCode;
          if (token) {
            localStorage.setItem('authToken', token); // Save token to localStorage
            localStorage.setItem('referralCode', referralCode); // Save referralCode to localStorage
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

  // Show the forgot password form
  showForgotPassword() {
    this.isForgotPassword = true;
  }

  // Toggle Old Password visibility
  toggleOldPasswordVisibility(): void {
    this.isOldPasswordVisible = !this.isOldPasswordVisible;
  }

  // Toggle New Password visibility
  toggleNewPasswordVisibility(): void {
    this.isNewPasswordVisible = !this.isNewPasswordVisible;
  }

  // Toggle Confirm Password visibility
  toggleConfirmPasswordVisibility(): void {
    this.isConfirmPasswordVisible = !this.isConfirmPasswordVisible;
  }


  // Back to login form
  backToLogin() {
    this.isForgotPassword = false;
  }

  // Forgot Password form submission
  onForgotPasswordSubmit() {
    if (this.changePasswordForm.valid) {
      const changePasswordData = this.changePasswordForm.value;

      this.authServices.forgotPassword(changePasswordData, this.token).subscribe({
        next: (response: any) => {
          this.toastr.success(response.message, '', {
            toastClass: 'toast-custom toast-success',
            positionClass: 'toast-bottom-center',
            closeButton: false,
            timeOut: 3000,
            progressBar: true
          });
          this.backToLogin(); // Go back to login form after password reset request
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
}
