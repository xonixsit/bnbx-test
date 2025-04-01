// src/app/auth/auth.guard.ts

import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('authToken'); // Change as per your authentication logic

    if (token) {
      return true; // User is authenticated
    } else {
      this.router.navigate(['/login']); // Redirect to login if not authenticated
      return false; // User is not authenticated
    }
  }
}
