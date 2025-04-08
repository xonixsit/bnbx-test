import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  isDarkMode: boolean = true;
  isSidebarCollapsed: boolean = true;  // Set default to true (closed)

  constructor(private router: Router){}

  // Toggle sidebar collapse
  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    const sidebar = document.getElementById('sidebar');
    const containers = document.getElementsByClassName('container');
  
    if (sidebar) {
      sidebar.classList.toggle('active');
    }
  
    Array.from(containers).forEach((container: Element) => {
      container.classList.toggle('active-container');
    });
  }

  ngOnInit() {
  }

  
  
  logout(): void {
    localStorage.removeItem('authToken');
    this.router.navigate(['/login']).then(() => {
      window.location.reload();
  });
  }



}
