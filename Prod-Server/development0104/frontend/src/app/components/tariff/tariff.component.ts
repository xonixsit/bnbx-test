import { Component, OnInit } from '@angular/core';
import { WalletServiceService } from '../../services/wallet/wallet-service.service';

interface InvestmentPlan {
  id: number;
  name: string;
  min: number;
  max: number;
  rate: number;
  thirtyDaysReturn: number;
  sixtyDaysReturn: number;
  ninetyDaysReturn: number;
  dailyProfit: number;
}

@Component({
  selector: 'app-tariff',
  templateUrl: './tariff.component.html',
  styleUrls: ['./tariff.component.scss']
})
export class TariffComponent implements OnInit {
  investmentPlans: InvestmentPlan[] = [];
  isLoading: boolean = true;
  error: string | null = null;

  constructor(private walletService: WalletServiceService) {}

  ngOnInit(): void {
    this.loadInvestmentPlans();
  }

  private loadInvestmentPlans(): void {
    this.walletService.getInvestmentPlans()
      .subscribe({
        next: (response: any) => {
          if (response.status && response.data) {
            this.investmentPlans = response.data.map((plan: any) => {
              const formatNumber = (num: number) => {
                if (num % 1 === 0) {
                  return `${Math.round(num)}%`;
                }
                return `${num.toFixed(1)}%`;
              };

              const formatDailyProfit = (num: number) => {
                if (num % 1 === 0) {
                  return `${Math.round(num)}%`;
                }
                return `${num.toFixed(2)}%`;
              };

              const thirtyDays = plan.rate * 30 * 100;
              const sixtyDays = plan.rate * 60 * 100;
              const ninetyDays = plan.rate * 90 * 100;
              const daily = plan.rate * 100;

              return {
                ...plan,
                dailyProfit: formatDailyProfit(daily),
                thirtyDaysReturn: formatNumber(thirtyDays),
                sixtyDaysReturn: formatNumber(sixtyDays),
                ninetyDaysReturn: formatNumber(ninetyDays)
              };
            });
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading investment plans:', error);
          this.error = 'Failed to load investment plans. Please try again later.';
          this.isLoading = false;
        }
      });
  }
}
