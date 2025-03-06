import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  constructor(private router: Router){}
  isDarkMode: boolean = false;
  isSidebarCollapsed: boolean = false;

  // // Toggle dark mode
  // toggleDarkMode(enableDarkMode: boolean) {
  //   this.isDarkMode = enableDarkMode;
  //   if (enableDarkMode) {
  //     document.body.classList.add('dark-mode');
  //   } else {
  //     document.body.classList.remove('dark-mode');
  //   }
  // }

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
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark-mode');
      this.isDarkMode = true;
      this.updateIframeTheme('dark');
    } else {
      this.updateIframeTheme('light');
    }
  }
  

  updateIframeTheme(theme: string) {
    const iframe = document.getElementById('fx-iframe') as HTMLIFrameElement;
    iframe.src = `https://fxpricing.com/fx-widget/technical-indicator-widget.php?id=1984&pair_weight=normal&click_target=blank&theme=${theme}&tm-cr=FFFFFF&hr-cr=00000013&by-cr=28A745&sl-cr=DC3545&flags=circle&value_alignment=center&tab=5M,15M,30M,1D&lang=en&font=Arial, sans-serif`;
  }

  logout(): void {
    localStorage.removeItem('authToken');
    this.router.navigate(['/login']).then(() => {
      window.location.reload();
  });
  }

}
