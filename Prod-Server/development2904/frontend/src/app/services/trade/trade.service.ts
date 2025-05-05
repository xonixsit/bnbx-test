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
  private portfolioUrl = `${this.baseUrl}/admin/portfolio`;

  constructor(private http: HttpClient) { }

  getTradeImage(): Observable<any> {
    return this.http.get(`${this.apiPath}/get`);
  }

  // Portfolio related methods
  getPortfolio(): Observable<any> {
    return this.http.get(`${this.portfolioUrl}`, {
    });
  }

}