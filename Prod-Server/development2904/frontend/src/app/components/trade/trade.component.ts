import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { TradeService } from '../../services/trade/trade.service';

@Component({
  selector: 'app-trade',
  templateUrl: './trade.component.html',
  styleUrls: ['./trade.component.scss']
})
export class TradeComponent implements OnInit {
  isLoading: boolean = false;
  tradeImage: any;
  imageData: string = '';

  constructor(
    private tradeService: TradeService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.loadImages();
  }

  loadImages() {
    this.isLoading = true;
    this.tradeService.getTradeImage().subscribe({
      next: (response:any) => {
        if (response?.data) {
          this.tradeImage = response.data;
          this.imageData = `data:${response.data.contentType};base64,${response.data.imageData}`;
        }
        this.isLoading = false;
      },
      error: (error:any) => {
        this.toastr.error('Failed to load images');
        this.isLoading = false;
      }
    });
  }
}