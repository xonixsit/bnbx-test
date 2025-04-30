import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SettingServicesService } from '../../../services/setting/setting-services.service';
import { ToastrService } from 'ngx-toastr';
import { AuthServicesService } from 'src/app/services/auth/auth-services.service';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.scss']
})
export class SettingComponent implements OnInit {
  updateWalletAddressForm: FormGroup;
  createTransactionPasswordForm: FormGroup;
  changeTransactionPasswordForm: FormGroup;
  loading = false;
  token: any;
  showCreateTransactionPassword: any; // Flag for creating password form
  showUpdateWalletAddress: any; // Flag for updating wallet address form
  showPassword = false;
  showConfirmPassword = false;
  showPrevPassword = false;
  showNewPassword = false;
  showConfirmNewPassword = false;
  constructor(
    private settingServicesService: SettingServicesService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private authService: AuthServicesService,
  ) {
    this.createTransactionPasswordForm = this.fb.group({
      password: ['', Validators.required],
      cnfPassword: ['', Validators.required]
    });
    this.changeTransactionPasswordForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', Validators.required],
      cnfPassword: ['', Validators.required]
    });

    // Add validators after form initialization
    this.changeTransactionPasswordForm.valueChanges.subscribe(() => {
      this.validatePasswords();
    });

    this.updateWalletAddressForm = this.fb.group({
      address: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.token = localStorage.getItem('authToken');
    this.getProfileInfo()
  }

  getProfileInfo(): void {
    this.authService.toggleLoader(true);
    this.authService.getProfile(this.token).subscribe({
      next: (response) => {
        this.showCreateTransactionPassword = response.data?.isTrxPassCreated === false;
        this.showUpdateWalletAddress = response.data?.isWalletAdded === false;
        this.authService.toggleLoader(false);
      },
      error: (error) => {
        this.toastr.error('Failed to load profile information', 'Error');
        this.authService.toggleLoader(false);
      }
    });
  }

  createTransactionPassword() {
    if (this.createTransactionPasswordForm.valid) {
      const createTransactionPassword = this.createTransactionPasswordForm.value;
      this.settingServicesService.createTransactionPasswordData(createTransactionPassword, this.token).subscribe({
        next: (response) => {
          const successMessage = response.body.message || 'Transaction password created successfully';
          this.toastr.success('Transaction password created successfully', 'Success', {
            toastClass: 'toast-custom toast-success',
            positionClass: 'toast-bottom-center',
            closeButton: false,
            progressAnimation: 'increasing',
            timeOut: 3000,
            progressBar: true,
            enableHtml: true
          });
        },
        error: (err) => {
          const errorMessage = err.error?.message || 'Error creating transaction password';
          this.toastr.error(errorMessage, '', {
            toastClass: 'toast-custom toast-error',
            positionClass: 'toast-bottom-center',
            progressAnimation: 'increasing',
            closeButton: false,
            timeOut: 3000,
            progressBar: true,
            enableHtml: true
          });
        }
      });
    }
  }

  // Updated validation method
  validatePasswords() {
    const oldPassword = this.changeTransactionPasswordForm.get('oldPassword')?.value;
    const newPassword = this.changeTransactionPasswordForm.get('newPassword')?.value;
    const cnfPassword = this.changeTransactionPasswordForm.get('cnfPassword')?.value;

    if (oldPassword && newPassword && oldPassword === newPassword) {
      this.changeTransactionPasswordForm.get('newPassword')?.setErrors({ sameAsOld: true });
      this.toastr.error('New password cannot be same as previous password', '', {
        toastClass: 'toast-custom toast-error',
        positionClass: 'toast-bottom-center',
        closeButton: false,
        timeOut: 3000,
        progressBar: true
      });
    }

    if (newPassword && cnfPassword && newPassword !== cnfPassword) {
      this.changeTransactionPasswordForm.get('cnfPassword')?.setErrors({ mismatch: true });
      this.toastr.error('New password and confirm password do not match', '', {
        toastClass: 'toast-custom toast-error',
        positionClass: 'toast-bottom-center',
        closeButton: false,
        timeOut: 3000,
        progressBar: true
      });
    }
  }

  changeTransactionPassword() {
    if (this.changeTransactionPasswordForm.valid) {
      const changeTransactionPassword = this.changeTransactionPasswordForm.value;
      this.settingServicesService.changeTransactionPasswordData(changeTransactionPassword, this.token).subscribe({
        next: (response) => {
          this.toastr.success(response.message || 'Password changed successfully', 'Success', {
            toastClass: 'toast-custom toast-success',
            positionClass: 'toast-bottom-center',
            closeButton: false,
            timeOut: 3000,
            progressBar: true,
            progressAnimation: 'increasing',
            enableHtml: true
          });
          // Reset form after successful submission
          this.changeTransactionPasswordForm.reset();
          Object.keys(this.changeTransactionPasswordForm.controls).forEach(key => {
            this.changeTransactionPasswordForm.get(key)?.setErrors(null);
          });
        },
        error: (err) => {
          const errorMessage = err.error?.message || 'Error changing transaction password';
          this.toastr.error(errorMessage, 'Error', {
            toastClass: 'toast-custom toast-error',
            positionClass: 'toast-bottom-center',
            closeButton: false,
            timeOut: 3000,
            progressBar: true,
            progressAnimation: 'increasing',
            enableHtml: true
          });
        }
      });
    } else {
      // Show validation errors
      if (this.changeTransactionPasswordForm.hasError('sameAsOld')) {
        this.toastr.error('New password cannot be same as old password', 'Error', {
          timeOut: 3000,
          progressBar: true
        });
      }
    }
  }

  updateWalletAddress() {
    if (this.updateWalletAddressForm.valid) {
      const updateWalletAddress = this.updateWalletAddressForm.value;
      this.settingServicesService.updateWalletAddressData(updateWalletAddress, this.token).subscribe({
        next: (response) => {
          this.toastr.success(response.body.message, '', {
            toastClass: 'toast-custom toast-success',
            positionClass: 'toast-bottom-center',
            closeButton: false,
            timeOut: 3000,
            progressBar: true
          });
          this.showUpdateWalletAddress = false; // Hide the form after successful update
        },
        error: (err) => {
          const errorMessage = err.error?.message || 'Error updating wallet address';
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
