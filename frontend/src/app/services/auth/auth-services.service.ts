import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.staging';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthServicesService {
  private apiUrl = `${environment.apiUrl}`; // Adjust the endpoint according to your API
  constructor(private http: HttpClient) { }

  // Method to sign up a user
  signUp(userData: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(`${this.apiUrl}/user/auth/register`, userData, { headers });
  }
 

  forgotPassword(body: string, token: any): Observable<any> {
    const headers = new HttpHeaders({ 'Authorization': token, 'Content-Type': 'application/x-www-form-urlencoded' });
    return this.http.put<any>(`${this.apiUrl}/user/auth/change/password`, { body }, { headers });
  }








  // forgotLoginPassword(body: string, token: any): Observable<any> {
  //   const headers = new HttpHeaders({ 'Authorization': token, 'Content-Type': 'application/x-www-form-urlencoded' });
  //   return this.http.put<any>(`${this.apiUrl}/user/auth/forgot/password/sendotp`, { body }, { headers });
  // }

 // Method to sign up a user
 login(email: any , password:any): Observable<any> {

  const headers = new HttpHeaders({
    'Content-Type': 'application/x-www-form-urlencoded',
  });
  const body = new URLSearchParams();
  body.set('loginId', email);
  body.set('password', password);
  return this.http.post(`${this.apiUrl}/user/auth/login`, body.toString(), { headers });
}

  forgotLoginPassword(email: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });
    const body = new URLSearchParams();
    body.set('email', email);
    return this.http.post(`${this.apiUrl}/user/auth/forgot/password/sendotp`, body.toString(), { headers });
  }

  verifyOtp(email: string, otp: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });
    const body = new URLSearchParams();
    body.set('email', email);
    body.set('otp', otp);
    return this.http.patch(`${this.apiUrl}/user/auth/forgot/password/verify/otp`, body.toString(), { headers });
  }

  resetPassword(newPassword: string, confirmPassword: string, token: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: token, // Replace with actual token
    });
    const body = new URLSearchParams();
    body.set('newPassword', newPassword);
    body.set('cnfPassword', confirmPassword);
    return this.http.put(`${this.apiUrl}/user/auth/reset/password`, body.toString(), { headers });
  }







  

  // Method to send OTP to email
  sendEmailOtp(email: string, mobile: string): Observable<any> {
    const body = { email, mobile };
    return this.http.post(`${this.apiUrl}/user/auth/send/otp`, body);
  }
  getReferralInfo(referralCode: string): Observable<any> {
    const params = new HttpParams().set('referralCode', referralCode);
    return this.http.get(`${this.apiUrl}/user/auth/referral/info`, { params });
  }

  // Method to verify OTP
  mobileVerifyOtp(mobile: string, otp: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });
    const body = new URLSearchParams();
    body.set('mobile', mobile);
    body.set('otp', otp);
    return this.http.patch(`${this.apiUrl}/user/auth/verify/otp`, body.toString(), { headers });
  }

  // Method to verify OTP
  emailVerifyOtp(email: string, otp: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });
    const body = new URLSearchParams();
    // body.set('mobile', mobile);
    body.set('email', email);
    body.set('otp', otp);

    return this.http.patch(`${this.apiUrl}/user/auth/verify/otp`, body.toString(), { headers });
  }

  getProfile(token: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: token
    });
    return this.http.get(`${this.apiUrl}/user/profile`, { headers });
  }

  // Method to sign up a user
  updateProfile(token: string, updatedData: any): Observable<any> {
    const headers = new HttpHeaders({ 'Authorization': token, 'Content-Type': 'application/json' });
    return this.http.put(`${this.apiUrl}/user/profile/update`, updatedData, { headers });
  }

  getReferralTree(token: any): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', token);
    return this.http.get<any>(`${this.apiUrl}/user/profile/referral/list`, { headers });
  }

  getReferralInfomation(referralCode: string, token: string): Observable<any> {
    const headers = new HttpHeaders({ Authorization: token });
    return this.http.get(`${this.apiUrl}/user/profile/referral/info?referralCode=${referralCode}`, { headers });
  }

  private apiUrls = 'https://fcsapi.com/api-v3/forex/profile?symbol=XAU/USD&access_key=OFMirVmCdgfldHkJ3V1i';
  private apiurslss = "https://fcsapi.com/api-v3/forex/latest?symbol=XAU/USD&access_key=OFMirVmCdgfldHkJ3V1i";

  getLatestForexDetails(): Observable<any> {
    return this.http.get(this.apiUrls);
  }
  getLatestForexLatest(): Observable<any> {
    return this.http.get(this.apiurslss);
  }

  getReferralList(token: any): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', token);
    return this.http.get(`${this.apiUrl}/user/profile/referral/tree`, { headers });
  }

  toggleLoader(show: boolean) {
    const loader = document.getElementById('loader');
    if (loader) {
      loader.style.display = show ? 'flex' : 'none';
    }
  }
}
