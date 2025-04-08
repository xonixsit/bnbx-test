import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment.staging';

@Injectable({
  providedIn: 'root'
})
export class WalletServiceService {
  private baseUrl = `${environment.apiUrl}`; // Replace with your actual base URL

  constructor(private http: HttpClient) { }

  verifyTransactionHash(verificationData: any, token: string) {
    const headers = new HttpHeaders().set('Authorization', `${token}`);
    return this.http.post(`${this.baseUrl}/user/wallet/verify/stakeHash`, verificationData, { headers });
  }

  verifyDepositTxnHash(verificationData: any, token: string) {
    const headers = new HttpHeaders().set('Authorization', `${token}`);
    return this.http.post(`${this.baseUrl}/user/wallet/verify/depositTxnHash`, verificationData, { headers });
  }

  convertWalletFormData(token: string): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', token);
    return this.http.post(`${this.baseUrl}/user/wallet/convert`, {}, { headers })
      .pipe(
        catchError(this.handleError) // Handle error gracefully
      );
  }

  fundTransferData(depositData: any, token: string): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', token);

    const body = {
      ...depositData,
    };

    return this.http.post(`${this.baseUrl}/user/wallet/transfer`, body, { 
      headers,
      observe: 'response'
    }).pipe(
      catchError(this.handleError)  // Add error handling like other methods
    );
  }

  transferToMain(data: any, token: string): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', token);
    const body = {
      ...data,
      user: this.getUserFromToken(token)
    };
    
    return this.http.post<any>(`${this.baseUrl}/user/wallet/trade-to-main`, body, {
      headers,
      observe: 'response'
    }).pipe(
      catchError(this.handleError)
    );
  }

  getWalletTransactions(page: number, sizePerPage: number, transactionType: string, token: string): Observable<any> {
    const url = `${this.baseUrl}/user/wallet/?page=${page}&sizePerPage=${sizePerPage}&transactionType=${transactionType}`;
    const headers = new HttpHeaders({
      'Authorization': token
    });
    return this.http.get(url, { headers });
  }

  private handleError(error: any): Observable<never> {
    console.error('An error occurred:', error);
    return throwError(error);
  }

  toggleLoader(show: boolean) {
    const loader = document.getElementById('loader');
    if (loader) {
      loader.style.display = show ? 'flex' : 'none';
    }
  }

withdraw(withdrawData: any, token: string) {
  const headers = new HttpHeaders().set('Authorization', token);
    // Ensure user data is included in the request body
    const body = {
      ...withdrawData,
      user: this.getUserFromToken(token) // Add user data from token
    };
  
    return this.http.post(`${this.baseUrl}/user/wallet/withdraw/usdt`, body, { 
      headers, 
      observe: 'response' 
    }).pipe(
      catchError(this.handleError)
    );
  
}

private getUserFromToken(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error decoding token:', e);
    return null;
  }
}

deposit(depositData:any, token: string) {
  const headers = new HttpHeaders()
    .set('Authorization', token)
    .set('Content-Type', 'application/json');
  return this.http.post(`${this.baseUrl}/user/wallet/deposit/address`, depositData, { 
    headers, 
    observe: 'response' 
  });
}

stake(stakeDataSend:any, token: string) {
  const headers = new HttpHeaders()
    .set('Authorization', token)
    .set('Content-Type', 'application/json');
  return this.http.post(`${this.baseUrl}/user/wallet/stake/address`, stakeDataSend, { 
    headers, 
    observe: 'response' 
  });
}

transferBetweenWallets(data: any, token: string) {  
    const body = {
      ...data,
      user: this.getUserFromToken(token) // Add user data from token
    };
  return this.http.post<any>(`${this.baseUrl}/user/wallet/transfer-between-wallets`, body, {
    headers: {
      Authorization: `${token}`
    }
  });
}


getInvestmentPlans() {
  return this.http.get(`${this.baseUrl}/plans/investment-plans`);
}
getWithdrawalLockStatus(token: string) {
  return this.http.get(`${this.baseUrl}/user/wallet/withdrawal-lock-status`, {
    headers: { Authorization: `${token}` }
  });
}
getWithdrawableBalance(token: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/user/wallet/withdrawable-balance`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
}