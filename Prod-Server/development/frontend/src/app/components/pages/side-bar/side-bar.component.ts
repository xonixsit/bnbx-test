import { Component, ElementRef, EventEmitter, HostListener, Input, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-side-bar',
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.scss']
})

export class SideBarComponent {
  @ViewChildren('container') containers!: QueryList<ElementRef>;
  @Input() isSidebarCollapsed: boolean = true;
  @Output() sidebarStateChange = new EventEmitter<boolean>();
  isDarkMode = true;
  @Output() messageEvent = new EventEmitter<boolean>(); // Create an event emitter

  constructor(private router: Router) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const sidebar = document.getElementById('sidebar');
    const toggleButton = document.querySelector('.sidebar-toggle');
    const target = event.target as HTMLElement;
  
    // Only close the sidebar if it's open and click is outside
    if (sidebar && toggleButton && 
        !sidebar.contains(target) && 
        !toggleButton.contains(target) && 
        !this.isSidebarCollapsed) {
      // this.closeSidebar();
    }
  }
  
  // Method to only close the sidebar
  closeSidebar() {
    this.isSidebarCollapsed = true;
    this.sidebarStateChange.emit(this.isSidebarCollapsed);
  }
  
  closeSidebarAndNavigate(route: string) {
    this.closeSidebar();
    this.router.navigate([route]);
  }
  
  // Keep the toggle method for the button click
  toggleSidebar() {
     this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
  
  toggleDarkMode(isDark: any) {
    this.isDarkMode = isDark;
    if (isDark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }

  logout(): void {
    localStorage.removeItem('authToken');
    this.router.navigate(['/login']).then(() => {
      window.location.reload();
  });
  }
}
