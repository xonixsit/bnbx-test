import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ]

})
export class FooterComponent implements OnInit {
  contactForm!: FormGroup;  // Using the definite assignment assertion
  isSubmitting = false;
  submitSuccess = false;
  submitError = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    // Initialize the form in constructor
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit() {
    // Other initialization logic if needed
  }

  async onSubmit() {
    if (this.contactForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.submitError = '';

    try {
      const response = await this.http.post('/api/contact', this.contactForm.value).toPromise();
      this.submitSuccess = true;
      this.contactForm.reset();
    } catch (error) {
      this.submitError = 'Failed to send message. Please try again later.';
      console.error('Contact form submission error:', error);
    } finally {
      this.isSubmitting = false;
    }
  }

  get nameErrors() {
    const control = this.contactForm.get('name');
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'Name is required';
      if (control.errors['minlength']) return 'Name must be at least 2 characters';
    }
    return '';
  }

  get emailErrors() {
    const control = this.contactForm.get('email');
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'Email is required';
      if (control.errors['email']) return 'Please enter a valid email';
    }
    return '';
  }

  get messageErrors() {
    const control = this.contactForm.get('message');
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'Message is required';
      if (control.errors['minlength']) return 'Message must be at least 10 characters';
    }
    return '';
  }
}
