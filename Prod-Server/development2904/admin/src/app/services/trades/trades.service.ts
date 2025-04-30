import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TradeResponse, Trade } from '../../interfaces/trade.interface';
import { environment } from '../../../environments/environment';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class TradesService {
  private baseUrl = environment.apiUrl;
  private apiPath = `${this.baseUrl}/admin/trades`;

  constructor(private http: HttpClient) { 
    
  }

  getLiveTrades(token: any): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', token);
    return this.http.get<any>(`${this.apiPath}/live`, { headers });
  }

  createTrade(tradeData: Trade, token:any): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', token);
    return this.http.post(`${this.apiPath}/create`, tradeData,{ headers });
  }

  updateTrade(tradeId: string, tradeData: Trade, token:any): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', token);
    return this.http.put(`${this.apiPath}/update/${tradeId}`, tradeData,{ headers });
  }

  deleteTrade(tradeId: string, token:any): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', token);
    return this.http.delete(`${this.apiPath}/delete/${tradeId}`, { headers });
  }
}