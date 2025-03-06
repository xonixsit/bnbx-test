import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { ToastrService } from 'ngx-toastr';
import { SearchPipe } from 'src/app/search.pipe';
import { AuthServicesService } from 'src/app/services/auth/auth-services.service';

@Component({
  selector: 'app-tree-list',
  templateUrl: './tree-list.component.html',
  styleUrls: ['./tree-list.component.scss'],
  providers: [SearchPipe]
})
export class TreeListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  public currentPage: number = 1;
  public itemPerPage: number = 10;
  pagelength: any;
  loading = false;
  isDarkMode: boolean = false;
  token: any;
  referralTree: any[] = [];
  filteredReferrals: any[] = [];
  searchTerm: string = '';
  pageSize: number = 10;
  selectedReferral: any;

  constructor(
    private authService: AuthServicesService,
    private toastr: ToastrService,
    public searchFilterPipe: SearchPipe
  ) { }

  ngOnInit(): void {
    this.token = localStorage.getItem('authToken');
    this.fetchReferralTree();  
  }

  fetchReferralTree(): void {
    this.authService.toggleLoader(true); 
    this.authService.getReferralTree(this.token).subscribe({
      next: (response: any) => {
        this.referralTree = response.data; // Adjust this according to actual API response
        this.pagelength = this.referralTree.length;
        // this.filterReferrals();
        this.localPagination()
        this.authService.toggleLoader(false); 
      },
      error: (err) => {
        console.error('Failed to fetch referral tree', err);
        this.toastr.error('Failed to fetch referral data');
        this.authService.toggleLoader(false); 
        this.pagelength = 0;
      }
    });
  }
  
  async filterReferrals() {
    this.filteredReferrals = await this.searchFilterPipe.transform(this.referralTree, this.searchTerm);
    this.currentPage = 1;
    let toPage = this.itemPerPage * this.currentPage;
    let fromPage = toPage - this.itemPerPage;
    this.filteredReferrals = this.filteredReferrals.slice(fromPage, toPage);
    this.paginator.pageIndex = 0;
  }

  getReferralInfo(referralCode: string): void {
    this.authService.getReferralInfomation(referralCode, this.token).subscribe({
      next: (response: any) => {
        this.selectedReferral = response.data
        // Process the referral information as needed
      },
      error: (err) => {
        console.error('Failed to retrieve referral info', err);
        this.toastr.error('Failed to retrieve referral data');
      }
    });
  }

  onPageChange($event: any) {
    this.currentPage = $event.pageIndex + 1;
    if (this.itemPerPage !== $event.pageSize) {
      this.itemPerPage = $event.pageSize;
    }
    this.localPagination()
  }

  localPagination() {
    let toPage = this.itemPerPage * this.currentPage;
    let fromPage = toPage - this.itemPerPage;
    this.filteredReferrals = this.referralTree.slice(fromPage, toPage);
  }
}
