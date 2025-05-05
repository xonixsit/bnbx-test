import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../../services/seo.service';
import { AuthServicesService } from 'src/app/services/auth/auth-services.service';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { Meta } from '@angular/platform-browser';
import { HostListener } from '@angular/core';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss'],
  animations: [
    trigger('fadeInOut', [
      state('void', style({ opacity: 0, transform: 'translateY(20px)' })),
      transition(':enter', [
        animate('0.6s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideIn', [
      state('void', style({ transform: 'translateX(-100%)' })),
      transition(':enter', [
        animate('0.5s ease-out', style({ transform: 'translateX(0)' }))
      ])
    ]),
    trigger('iconFloat', [
      state('float', style({ transform: 'translateY(0)' })),
      state('sink', style({ transform: 'translateY(10px)' })),
      transition('float <=> sink', [
        animate('2s ease-in-out')
      ])
    ])
  ],
})
export class HomePageComponent implements OnInit {
  isDarkMode: boolean = true;
  forexDetail: any;
  forexLatest: any;
  iconState = 'float';

  constructor(private authServices: AuthServicesService, private meta: Meta, private seoService: SeoService) {
    // Start the floating animation
    setInterval(() => {
      this.iconState = this.iconState === 'float' ? 'sink' : 'float';
    }, 2000);
  }

  ngOnInit() {
    this.seoService.updateTitle('Home');
    this.seoService.updateMetaTags({
      title: 'BNBX - Smart Investment Solutions',
      description: 'Maximize Your Earnings with AI and Smart Investment Solutions. Join BNBX for secure, innovative trading experiences.',
      image: 'assets/images/hero/hero-banner.jpg'
    });

    this.meta.addTags([
      { rel: 'preconnect', href: 'https://fonts.gstatic.com' },
      { rel: 'preload', href: 'assets/images/hero/animated-banner.svg', as: 'image' }
    ]);

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

  showScrollTop = false;

  @HostListener('window:scroll')
  onWindowScroll() {
    this.showScrollTop = window.scrollY > 300;
  }

  scrollToTop(event: Event) {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
