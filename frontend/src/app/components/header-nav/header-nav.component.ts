import { Component, HostListener } from '@angular/core';
import { Router, NavigationEnd, Event } from '@angular/router';
import { ViewportScroller } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header-nav',
  templateUrl: './header-nav.component.html',
  styleUrls: ['./header-nav.component.scss']
})
export class HeaderNavComponent {
  isScrolled = false;
  currentUrl: string = '';
  currentFragment: string | null = null;
  isMenuOpen = false;

  constructor(
    private router: Router,
    private viewportScroller: ViewportScroller
  ) {
    // Configure smooth scrolling
    this.viewportScroller.setOffset([0, 70]); // Adjust offset if you have a fixed header
    
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      // Update current URL and fragment
      this.currentUrl = event.urlAfterRedirects.split('#')[0] || '/';
      const tree = this.router.parseUrl(event.urlAfterRedirects);
      this.currentFragment = tree.fragment;
      
      if (tree.fragment) {
        setTimeout(() => {
          if (tree.fragment !== null) {
            const element = document.getElementById(tree.fragment);
            if (element) {
              element.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
              });
            }
          }
        }, 100);
      }
    });
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    // Check if window is scrolled beyond a threshold (e.g., 50px)
    this.isScrolled = window.scrollY > 50;
  }

  /**
   * Check if the given route is active
   * @param route The route to check
   * @param fragment The fragment to check (optional)
   * @returns True if the route is active
   */
  isActive(route: string, fragment?: string): boolean {
    if (route === '/' && this.currentUrl === '/') {
      // For home page
      if (fragment) {
        return this.currentFragment === fragment;
      }
      return !this.currentFragment;
    }
    
    // For other pages
    if (route !== '/' && this.currentUrl.includes(route)) {
      if (fragment) {
        return this.currentFragment === fragment;
      }
      return true;
    }
    
    return false;
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

}
