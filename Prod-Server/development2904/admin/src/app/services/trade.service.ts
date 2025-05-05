import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Portfolio } from '../models/plan.model';

@Injectable({
  providedIn: 'root'
})

export class TradeService {
  private apiUrl = `${environment.apiUrl}/admin/trades`;
  private portfolioUrl = `${environment.apiUrl}/admin/portfolio`;

  constructor(private http: HttpClient) { }

  private getHeaders() {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders().set('Authorization', `${token}`);
  }

  uploadImage(formData: FormData): Observable<any> {
    // Get user data from localStorage
    const token:any = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', token);
    return this.http.post(`${this.apiUrl}/upload`, formData, {
      headers
    });
  }

  getImage(): Observable<any> {
    const token:any = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', token);
    return this.http.get(`${this.apiUrl}/get`, {headers});
  }

  updateImage(imgId: string, formData: FormData): Observable<any> {
    const userData = localStorage.getItem('userData');
    if (userData) {
      formData.append('user', userData);
    }

    return this.http.put(`${this.apiUrl}/update/${imgId}`, formData, {
      headers: this.getHeaders()
    });
  }

  deleteImage(imgId: string): Observable<any> {
    const userData = localStorage.getItem('userData');
    const body = userData ? { user: JSON.parse(userData) } : {};

    return this.http.delete(`${this.apiUrl}/delete/${imgId}`, {
      headers: this.getHeaders(),
      body: body
    });
  }

  getImageUrl(filename: string): string {
      return `${environment.apiUrl}/uploads/trades/${filename}`;
    }

  getImageAsBlob(filename: string): Observable<Blob> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', token || '');
    
    return this.http.get(`${environment.apiUrl}/uploads/trades/${filename}`, {
      headers,
      responseType: 'blob'
    });
  }

  createImageFromBlob(image: Blob): Observable<string> {
    return new Observable(observer => {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        observer.next(reader.result as string);
        observer.complete();
      });
      reader.readAsDataURL(image);
    });
  }

  // Portfolio related methods
  getPortfolio(): Observable<any> {
    return this.http.get(`${this.portfolioUrl}`, {
      headers: this.getHeaders()
    });
  }

  updatePortfolio(portfolio: Portfolio): Observable<any> {
    return this.http.post(`${this.portfolioUrl}`, portfolio, {
      headers: this.getHeaders()
    });
  }

  getLatestPortfolio(): Observable<any> {
    return this.http.get(`${this.portfolioUrl}/latest`, {
      headers: this.getHeaders()
    });
  }
}