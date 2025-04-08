import { Component, Output, EventEmitter, HostListener, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, AfterViewInit {
  constructor(private router: Router){}
  isDarkMode: boolean = true;
  isSidebarCollapsed: boolean = true;

  toggleDarkMode(data:boolean) {
    this.isDarkMode = !this.isDarkMode;
    const rootElement = document.documentElement; // <html> element
    if (data) {
      rootElement.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      rootElement.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }

  // Toggle sidebar collapse
  @Output() toggleSidebar = new EventEmitter<void>();
  
  // Update the toggle method
  onToggleSidebar() {
    this.toggleSidebar.emit();
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  ngOnInit(): void {
    // Remove updateIframeTheme from here
  }

  ngAfterViewInit(): void {
    // Move it here instead
    setTimeout(() => {
      this.updateIframeTheme();
    });
  }

  updateIframeTheme(): void {
    const iframe = document.querySelector('iframe');
    if (iframe) {
      iframe.src = this.getThemeUrl();
    }
  }

  private getThemeUrl(): string {
    // Your existing theme URL logic
    return 'your-theme-url';
  }

  logout(): void {
    localStorage.removeItem('authToken');
    this.router.navigate(['/login']).then(() => {
      window.location.reload();
  });
  }

  // @HostListener('document:click', ['$event'])
  // onDocumentClick(event: MouseEvent) {
  //   const sidebar = document.getElementById('sidebar');
  //   const toggleButton = document.querySelector('.sidebar-toggle');
  //   const target = event.target as HTMLElement;
  
  //   if (sidebar && toggleButton && 
  //       !sidebar.contains(target) && 
  //       !toggleButton.contains(target) && 
  //       !this.isSidebarCollapsed) {
  //     // this.onToggleSidebar();
  //     this.isSidebarCollapsed = true;
  //   }
  // }
}
