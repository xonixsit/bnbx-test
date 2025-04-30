import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TradeService {
  private baseUrl = environment.apiUrl;
  private apiPath = `${this.baseUrl}/admin/trades`;

  constructor(private http: HttpClient) { }

  private getHeaders(token: string | null): HttpHeaders {
    return new HttpHeaders().set('Authorization', `${token}`);
  }

  getTradeImage(): Observable<any> {
    return this.http.get(`${this.apiPath}/get`);
  }
}