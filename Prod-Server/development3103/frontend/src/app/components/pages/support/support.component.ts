import { Component } from '@angular/core';
import { AuthServicesService } from 'src/app/services/auth/auth-services.service';

@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss']
})
export class SupportComponent {
  constructor(private authServices: AuthServicesService){}
  
  ngOnInit() {
    this.authServices.toggleLoader(false);
  }
}
