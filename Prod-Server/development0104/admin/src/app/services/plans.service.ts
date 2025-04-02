import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Plan } from '../models/plan.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PlansService {
  private apiUrl = `${environment.apiUrl}`;
  constructor(private http: HttpClient) { }

  getPlans(token:any): Observable<any> {

    const headers = new HttpHeaders().set('Authorization', token);
    
    return this.http.get(`${this.apiUrl}/admin/plans/list`, { headers });
  }

  updatePlan(planId: string, planData: Partial<Plan>, token:any): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', token);

    return this.http.put(`${this.apiUrl}/admin/plans/update/${planId}`, planData, { headers });
  }
}