import { Component } from '@angular/core';
import { TradeService } from '../../services/trade/trade.service';
import { ToastrService } from 'ngx-toastr';

export interface Portfolio {
  tradingFunds: number;
  safuFunds: number;
  timestamp: Date;
}

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.scss']
})


export class PortfolioComponent {

  portfolio: Portfolio = {
    tradingFunds: 0,
    safuFunds: 0,
    timestamp: new Date()
  };
  constructor(
    private tradeService: TradeService,
    private toastr: ToastrService
  ) {}
  ngOnInit() {
    this.getPortfolio();
  }

  getPortfolio(): void {
    this.tradeService.getPortfolio().subscribe(
      (data: Portfolio) => {
        this.portfolio.safuFunds = data.safuFunds;
        this.portfolio.tradingFunds = data.tradingFunds;
        console.log(data);
      },
      (error: any) => {
        console.log(error);
      }
    );
  }

}