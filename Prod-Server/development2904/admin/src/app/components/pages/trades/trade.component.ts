import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { TradeService } from '../../../services/trade.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-trade',
  templateUrl: './trade.component.html',
  styleUrls: ['./trade.component.scss']
})
export class TradeComponent implements OnInit {
  environment = environment;
  uploadForm: FormGroup;
  imagePreview: string | null = null;
  isUploading: boolean = false;
  uploadedImages: any;

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private tradeService: TradeService  // Add this
  ) {
    this.uploadForm = this.fb.group({
      image: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadImages();
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

  onSubmit() {
    if (this.uploadForm.valid) {
      this.isUploading = true;
      const formData = new FormData();
      const fileInput = document.querySelector('#imageInput') as HTMLInputElement;
      if (fileInput && fileInput.files && fileInput.files.length > 0) {
        formData.append('image', fileInput.files[0]);
        
        this.tradeService.uploadImage(formData).subscribe({
          next: (response) => {
            this.toastr.success('Image uploaded successfully');
            this.loadImages();
            this.resetForm();
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

  private resetForm() {
    this.uploadForm.reset();
    this.imagePreview = null;
  }
}