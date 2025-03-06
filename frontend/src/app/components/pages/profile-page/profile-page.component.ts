import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { ToastrService } from 'ngx-toastr';
import { AuthServicesService } from 'src/app/services/auth/auth-services.service';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss']
})
export class ProfilePageComponent implements OnInit {
  profileForm!: FormGroup;
  loading = false;
  isDarkMode: boolean = false;
  token: any;

  constructor(private fb: FormBuilder, private authService: AuthServicesService, private toastr: ToastrService) { }

  ngOnInit(): void {
    // Initialize the form group with validators
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      mobile: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
    });

    // Retrieve the token and profile info
    this.token = localStorage.getItem('authToken');
    this.getProfileInfo();
  }

  getProfileInfo(): void {
    this.authService.toggleLoader(true);
    this.authService.getProfile(this.token).subscribe({
      next: (response) => {
        this.profileForm.patchValue({
          name: response.data.name,
          email: response.data.email,
          mobile: response.data.mobile,
        });
        this.authService.toggleLoader(false);
      },
      error: (error) => {
        this.toastr.error('Failed to load profile information', 'Error');
        this.authService.toggleLoader(false);
      }
    });
  }

  // Method to handle form submission and update the profile
  updateProfile(): void {
    if (this.profileForm.valid) {
      this.authService.toggleLoader(true);
      // Extract only the necessary fields
      const { name, email, mobile } = this.profileForm.value;
      const updatedData = { name, email, mobile }; // Create an object with only the needed fields
      this.authService.updateProfile(this.token, updatedData).subscribe({
        next: (response) => {
          this.toastr.success('Profile updated successfully!', 'Success');
          this.authService.toggleLoader(false);
        },
        error: (error) => {
          this.toastr.error('Failed to update profile', 'Error');
          this.authService.toggleLoader(false);
        }
      });
    } else {
      this.toastr.warning('Please fill out the form correctly', 'Warning');
    }
  }

}
