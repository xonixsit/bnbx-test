import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from 'src/environments/environment.staging';

@Injectable({
  providedIn: 'root'
})
export class SettingServicesService {
  private baseUrl = `${environment.apiUrl}`; // Adjust to your API endpoint
  constructor(private http: HttpClient) { }

  createTransactionPasswordData(body: any, token: string): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', token);
    return this.http.post(`${this.baseUrl}/user/wallet/create/transaction/password`, body, { headers, observe: 'response' })
      .pipe(
        catchError(this.handleError) // Handle error gracefully
      );
  }

  changeTransactionPasswordData(body: any, token: string): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', token);
    return this.http.put(`${this.baseUrl}/user/auth/change/password`, body, { headers, observe: 'response' })
      .pipe(
        catchError(this.handleError) // Handle error gracefully
      );
  }

  updateWalletAddressData(body: any, token: string): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', token);
    return this.http.put(`${this.baseUrl}/user/wallet/update/address`, body, { headers, observe: 'response' })
      .pipe(
        catchError(this.handleError) // Handle error gracefully
      );
  }

  private handleError(error: any): Observable<never> {
    console.error('An error occurred:', error);
    return throwError(error);
  }

}

