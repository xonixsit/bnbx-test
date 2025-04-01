import { Component } from '@angular/core';
import { AuthServicesService } from 'src/app/services/auth/auth-services.service';

@Component({
  selector: 'app-trade-room',
  templateUrl: './trade-room.component.html',
  styleUrls: ['./trade-room.component.scss']
})
export class TradeRoomComponent {
  constructor(private authService: AuthServicesService) {}

  ngAfterViewInit(): void {
    this.authService.toggleLoader(true); 
    this.loadTradingViewScript();
  }

  loadTradingViewScript(): void {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: 'XAUUSD',
      interval: '3',
      timezone: 'Etc/UTC',
      theme: 'light',
      style: '1',
      locale: 'en',
      allow_symbol_change: false,
      calendar: false,
      support_host: 'https://www.tradingview.com'
    });

    const container = document.querySelector('.tradingview-widget-container__widget');
    if (container) {
      container.appendChild(script);
      script.onload = () => {
        this.authService.toggleLoader(false); 
      };
      script.onerror = () => {
        this.authService.toggleLoader(false); 
        console.error('Failed to load TradingView widget.');
      };
    }
  }
}
