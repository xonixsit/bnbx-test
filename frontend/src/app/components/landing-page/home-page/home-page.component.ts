import { Component, OnInit } from '@angular/core';
import { AuthServicesService } from 'src/app/services/auth/auth-services.service';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit {
  isDarkMode: boolean = false;
  forexDetail: any;
  forexLatest: any;

  constructor(private authServices: AuthServicesService) { }

  ngOnInit() {
    this.authServices.toggleLoader(false);
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark-mode');
      this.isDarkMode = true;
    }
    // Fetch forex details data
    this.authServices.getLatestForexDetails().subscribe(
      (response) => {
        if (response && response.response) {
          this.forexDetail = response.response[0];
        }
        this.authServices.toggleLoader(false);
      },
      (error) => console.error('Error fetching forex details', error)
    );

    // Fetch latest forex data
    this.authServices.getLatestForexLatest().subscribe(
      (response) => {
        if (response && response.response) {
          this.forexLatest = response.response[0];
        }
        this.authServices.toggleLoader(false);
      },
      (error) => console.error('Error fetching forex latest data', error)
    );
    this.authServices.toggleLoader(false);
  }

  toggleDarkMode(data: boolean) {
    this.isDarkMode = data;
    const rootElement = document.documentElement;
    if (data) {
      rootElement.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      rootElement.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }

}
