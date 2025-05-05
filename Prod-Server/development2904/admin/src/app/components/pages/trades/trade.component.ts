import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { TradeService } from '../../../services/trade.service';
import { environment } from '../../../../environments/environment';
import { Portfolio } from '../../../models/plan.model';

@Component({
  selector: 'app-trade',
  templateUrl: './trade.component.html',
  styleUrls: ['./trade.component.scss']
})
export class TradeComponent implements OnInit {
  environment = environment;
  imageForm: FormGroup;
  portfolioForm: FormGroup;
  imagePreview: string | null = null;
  isUploading: boolean = false;
  uploadedImages: any;
  portfolio: Portfolio = {
    tradingFunds: 0,
    safuFunds: 0,
    timestamp: new Date()
  };

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private tradeService: TradeService  // Add this
  ) {
    this.imageForm = this.fb.group({
      image: ['', Validators.required]
    });

    this.portfolioForm = this.fb.group({
      tradingFunds: ['', [Validators.required, Validators.min(0)]],
      safuFunds: ['', [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit() {
    this.loadImages();
    this.getPortfolio();
  }

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Preview the image
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmitImage() {
    if (this.imageForm.valid) {
      this.isUploading = true;
      const formData = new FormData();
      const fileInput = document.querySelector('#imageInput') as HTMLInputElement;

      if (fileInput && fileInput.files && fileInput.files.length > 0) {
        formData.append('image', fileInput.files[0]);
        
        this.tradeService.uploadImage(formData).subscribe({
          next: (response) => {
            this.toastr.success('Image uploaded successfully');
            this.loadImages();
            this.resetImageForm();
          },
          error: (error) => {
            this.toastr.error('Failed to upload image');
          },
          complete: () => {
            this.isUploading = false;
          }
        });
      } else {
        this.toastr.error('Please select an image');
        this.isUploading = false;
      }
    }
  }

  loadImages() {
    this.tradeService.getImage().subscribe({
      next: (response) => {
        if (response?.data) {
          this.uploadedImages = response.data;
        }
      },
      error: (error) => {
        // this.toastr.error('Failed to load images');
      }
    });
  }

  deleteImage(imageId: string) {
    this.tradeService.deleteImage(imageId).subscribe({
      next: () => {
        this.toastr.success('Image deleted successfully');
        this.loadImages();
        this.uploadedImages = '';
      },
      error: (error) => {
        // this.toastr.error('Failed to delete image');
      }
    });
  }

  private resetImageForm() {
    this.imageForm.reset();
    this.imagePreview = null;
  }

  private resetPortfolioForm() {
    this.portfolioForm.reset();
  }

  
  onSubmitPortfolio() {
    if (this.portfolioForm.valid) {
      const portfolioData = {
        tradingFunds: this.portfolioForm.get('tradingFunds')?.value,
        safuFunds: this.portfolioForm.get('safuFunds')?.value,
        timestamp: new Date()
      };

      this.tradeService.updatePortfolio(portfolioData).subscribe({
        next: (response) => {
          this.toastr.success('Portfolio data saved successfully');
          this.resetPortfolioForm();
          this.getPortfolio();
        },
        error: (error) => {
          this.toastr.error('Failed to save portfolio data');
        }
      });
    }
  }
  //implement get portfolio
  getPortfolio() {
    this.tradeService.getPortfolio().subscribe({
      next: (response) => {
        if (response) {
          console.log(response);
          this.portfolioForm.patchValue({
            tradingFunds: response.tradingFunds,
            safuFunds: response.safuFunds
          });
        }
      },
      error: (error) => {
        this.toastr.error('Failed to load portfolio data');
      }
    });
  }
}