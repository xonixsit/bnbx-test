import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from 'src/environments/environment.staging';

@Injectable({
  providedIn: 'root'
})
export class UserServicesService {

  private baseUrl = `${environment.apiUrl}`; // Adjust to your API endpoint

  constructor(private http: HttpClient) { }

  // getTransactions(page: number, size: number , token:any): Observable<any[]> {
  //   const headers = new HttpHeaders({
  //     'Authorization': token // Replace with your actual token
  //   });

  //   return this.http.get<any[]>(`${this.baseUrl}/user/wallet?page=${page}&sizePerPage=${size}`, { headers });
  // }

  getUserList(page: number, size: number, token: string, params: any): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', token);

    return this.http.get<any>(`${this.baseUrl}/admin/user/list`, { headers, params });
  }

  getReferralInfomation(referralCode: string, token: string, userId?:string): Observable<any> {
    const headers = new HttpHeaders({ Authorization: token });
    let url = `${this.baseUrl}/admin/user/details?referralCode=${referralCode}`;
    if (userId) {
      url += `&userId=${userId}`;
    }
    console.log(url);
    return this.http.get(url, { headers });
  }
  
  getReferralList(token: any, id: any): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', token);
    return this.http.get(`${this.baseUrl}/admin/user/referral/tree?userId=${id}`, { headers });
  }

  getUserDataWithId(token: any, id: any): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', token);
    return this.http.get(`${this.baseUrl}/admin/user/${id}`, { headers });
  }

  // Method to sign up a user
  updateProfile(updatedData: any , token: string ): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: token,
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    const body = new URLSearchParams();
    Object.keys(updatedData).forEach((key) => {
      body.set(key, updatedData[key]);
    });

    return this.http.put(`${this.baseUrl}/admin/user/update`, body, { headers }).pipe(
      catchError((error) => {
        console.error('Error:', error.error.message || 'Unknown error');
        return throwError(() => error);
      })
    );;
  }
  // Method to sign up a user
  fundDpositeTransaction(updatedData: any , token: string ): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: token,
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    const body = new URLSearchParams();
    Object.keys(updatedData).forEach((key) => {
      body.set(key, updatedData[key]);
    });

    return this.http.post(`${this.baseUrl}/admin/transaction/deposit/usdt`, body, { headers }).pipe(
      catchError((error) => {
        console.error('Error:', error.error.message || 'Unknown error');
        return throwError(() => error);
      })
    );;
  }
  changeTranxPawword(
    data: { userId: string; password: string },
    token: string
  ): Observable<any> {
    // Set headers with Authorization token
    const headers = new HttpHeaders({
      Authorization: token,
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    // Format the request body as x-www-form-urlencoded
    const body = new URLSearchParams();
    body.set('userId', data.userId);
    body.set('password', data.password);

    // Send the PUT request
    return this.http.put(`${this.baseUrl}/admin/user/change/trx/password`, body.toString(), { headers, observe: 'response' });
  }

  // changeTranxPawword(body: any,  token: string): Observable<any> {
  //   const headers = new HttpHeaders({'Authorization': token , 'Content-Type': 'application/json' });

  //   return this.http.post(`${this.baseUrl}/admin/user/change/trx/password`, body, { headers, observe: 'response' })
  //     .pipe(
  //       catchError(this.handleError) // Handle error gracefully
  //     );
  // }
  changeLoginPassword(body: any,  token: string): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', token);

    return this.http.put(`${this.baseUrl}/admin/user/change/login/password`, body, { headers, observe: 'response' })
      .pipe(
        catchError(this.handleError) // Handle error gracefully
      );
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
}
