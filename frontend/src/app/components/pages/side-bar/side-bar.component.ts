import { Component, ElementRef, HostListener, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-side-bar',
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.scss']
})
export class SideBarComponent {
  @ViewChildren('container') containers!: QueryList<ElementRef>;

  isSidebarCollapsed = false;
  isDarkMode = false;
  
  constructor(private router: Router){}

  toggleSidebar() {
    // this.isSidebarCollapsed = !this.isSidebarCollapsed;
    // const sidebar = document.getElementById('sidebar');
    // if (sidebar) {
    //   sidebar.classList.toggle('active');
    // }

    // this.containers.forEach((container) => {
    //   container.nativeElement.classList.add('active-container');
    //   console.log('Updated:', container.nativeElement.className); // Debugging
    // });
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
