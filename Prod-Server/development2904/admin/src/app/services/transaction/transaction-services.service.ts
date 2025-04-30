// src/app/services/transaction-services.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.staging';

@Injectable({
  providedIn: 'root'
})
export class TransactionServicesService {
  private baseUrl = `${environment.apiUrl}`; // Adjust to your API endpoint

  constructor(private http: HttpClient) { }


  getTransactions(page: number, size: number, token: string, params: any): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', token);

    return this.http.get<any>(`${this.baseUrl}/admin/transaction/list`, { headers, params });
  }


  getTransactionsById( token: any , params:any): Observable<any> {


    const headers = new HttpHeaders({
      Authorization: token,
    });

    return this.http.get<any>(`${this.baseUrl}/admin/transaction/list`, { headers , params });
  }

  verifyDeposit(transactionId: string, status: string, token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': token,
      'Content-Type': 'application/x-www-form-urlencoded'
    });
    
    const body = new URLSearchParams();
    body.set('transactionId', transactionId);
    body.set('status', status); // 'COMPLETED' or 'REJECTED'
    
    return this.http.post(`${this.baseUrl}/admin/transaction/verify/deposit`, body.toString(), {
      headers,
      observe: 'response'
    });
}

verifyWidthdraw(transactionId: string, status: string, token: string): Observable<any> {
  const headers = new HttpHeaders({
    'Authorization': token,
    'Content-Type': 'application/x-www-form-urlencoded'
  });
  
  const body = new URLSearchParams();
  body.set('transactionId', transactionId);
  body.set('status', status); // 'COMPLETED' or 'REJECTED'
  
  return this.http.post(`${this.baseUrl}/admin/transaction/verify/withdraw`, body.toString(), {
    headers,
    observe: 'response'
  });
}
  
  toggleLoader(show: boolean) {
    const loader = document.getElementById('loader');
    if (loader) {
      loader.style.display = show ? 'flex' : 'none';
    }
  }

}