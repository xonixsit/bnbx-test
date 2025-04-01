import { Component, ElementRef, HostListener, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-side-bar',
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.scss']
})
export class SideBarComponent {
  @ViewChildren('container') containers!: QueryList<ElementRef>;

  isSidebarCollapsed = true;  // Default to closed
  isDarkMode = true;
  
  constructor(private router: Router){}

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
      this.closeSidebar();
    }
  }
  
  closeSidebar() {
    this.isSidebarCollapsed = true;
    console.log('closeSidebar')
  }
  
  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  logout(): void {
    localStorage.removeItem('authToken');
    this.router.navigate(['/login']);
  }
}
