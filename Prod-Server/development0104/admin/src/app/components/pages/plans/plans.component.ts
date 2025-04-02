import { Component, OnInit } from '@angular/core';
import { Plan } from '../../../models/plan.model';
import { PlansService } from '../../../services/plans.service';
import { ToastrService } from 'ngx-toastr';
import { AuthServicesService } from 'src/app/services/auth/auth-services.service';

@Component({
  selector: 'app-plans',
  templateUrl: './plans.component.html',
  styleUrls: ['./plans.component.scss']
})
export class PlansComponent implements OnInit {
  plans: (Plan & { isEditing?: boolean; originalData?: Plan })[] = [];
  token: string | null = null;
  constructor(
    private plansService: PlansService,
    private toastr: ToastrService,
    private authServices: AuthServicesService,

  ) { }

  ngOnInit(): void {
    this.loadPlans();
  }

  loadPlans(): void {
    this.token = localStorage.getItem('authToken');

    this.plansService.getPlans(this.token).subscribe({
      next: (response) => {
        this.authServices.toggleLoader(false);

        this.plans = response.data.map((plan: Plan) => ({
          ...plan,
          isEditing: false
        }));
      },
      error: (error) => {
        this.toastr.error('Failed to load plans');
        console.error('Error loading plans:', error);
      }
    });
  }

  startEditing(plan: any): void {
    plan.originalData = { ...plan };
    plan.isEditing = true;
  }

  cancelEditing(plan: any): void {
    Object.assign(plan, plan.originalData);
    plan.isEditing = false;
    delete plan.originalData;
  }

  savePlan(plan: any): void {
    const updateData = {
      rate: plan.rate,
      min: plan.min,
      max: plan.max,
      duration: plan.duration
    };
    this.token = localStorage.getItem('authToken');
    // console.log(this.token);
    this.plansService.updatePlan(plan.id, updateData, this.token).subscribe({
      next: (response) => {
        plan.isEditing = false;
        delete plan.originalData;
        this.toastr.success('Plan updated successfully');
      },
      error: (error) => {
        this.toastr.error('Failed to update plan');
        console.error('Error updating plan:', error);
      }
    });
  }
}
