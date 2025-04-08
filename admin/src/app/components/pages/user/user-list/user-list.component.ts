import { Component, OnInit, ViewChild } from '@angular/core';
import { TransactionServicesService } from '../../../../services/transaction/transaction-services.service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { UserServicesService } from 'src/app/services/user-services/user-services.service';
import { Router } from '@angular/router';
import * as CryptoJS from 'crypto-js';
import { SearchPipe } from 'src/app/search.pipe';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  providers: [SearchPipe]
})

export class UserListComponent {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  transactions: any[] = [];
  error: string | null = null;
  token: any;
  totalCredited: number = 0;
  totalDebited: number = 0;
  totalTransactions: number = 0; // total transactions for paginator
  pageSize: number = 10;
  currentPage: number = 1;
  filteredTransactions: any[] = []; // Store filtered transactions
  // Filter properties
  pagelength: any;
  transactionType: string = '';
  status: string = '';
  startDate: string = '';
  endDate: string = '';
  secretKey = '123456789';
  filteredReferrals: any[] = [];
  public itemPerPage: number = 10;
  searchTerm: string = '';
  isFiltering = false;
  totalPages: number = 1;

  // Define the type for filters
  filter: {
    search: string;
    greaterThan: string;
    lessThan: string;
    type: string;
    startDate: string;
    endDate: string;
  } = {
      search: '',
      greaterThan: '',
      lessThan: '',
      type: '',
      startDate: '',
      endDate: ''
    };

  constructor(private UserServicesServices: UserServicesService, private router: Router, public searchFilterPipe: SearchPipe) { }

  ngOnInit(): void {
    this.token = localStorage.getItem('authToken');
    this.userList(this.currentPage, this.pageSize);
  }

  userList(page: number, size: number): void {
    const params: Record<string, string> = {
      page: page.toString(),
      sizePerPage: size.toString(),
    };
    // Add only the search filter if it's active
    if (this.filter.search) {
      params['search'] = this.filter.search;
    } else if (this.isFiltering) {
      Object.keys(this.filter).forEach((key) => {
        if (this.filter[key as keyof typeof this.filter]) {
          params[key] = this.filter[key as keyof typeof this.filter];
        }
      });
    }
    this.UserServicesServices.toggleLoader(true);
    this.UserServicesServices.getUserList(page, size, this.token!, params).subscribe({
      next: (response: any) => {
        this.transactions = response.data.docs;
        this.filteredTransactions = [...this.transactions];
        this.totalTransactions = response.data.totalDocs;
        this.UserServicesServices.toggleLoader(false);
        this.totalPages = Math.ceil(this.totalTransactions / this.pageSize);

      },
      error: () => {
        this.transactions=[]
        this.error = 'Failed to load transactions';
        this.UserServicesServices.toggleLoader(false);
      }
    });
  }

  applyFilters(): void {
    // Check if only the search filter is applied
    this.isFiltering = Object.keys(this.filter).some((key) => key === 'search' && this.filter[key] !== '');
    const page = 1; // Reset to the first page when applying filters
    const size = 20; // Example page size
    this.userList(page, size);
  }

  resetFilters(): void {
    // Reset all filters
    this.filter = {
      search: '',
      greaterThan: '',
      lessThan: '',
      type: '',
      startDate: '',
      endDate: ''
    };
    this.isFiltering = false;
    this.userList(1, 20); // Load all data
  }
  async filterReferrals() {
    this.filteredReferrals = await this.searchFilterPipe.transform(this.transactions, this.searchTerm);
    this.currentPage = 1;
    let toPage = this.itemPerPage * this.currentPage;
    let fromPage = toPage - this.itemPerPage;
    this.filteredReferrals = this.filteredReferrals.slice(fromPage, toPage);
    this.paginator.pageIndex = 0;
  }

  getFreeraTree(id: any) {
    const encryptedId = CryptoJS.AES.encrypt(id.toString(), this.secretKey).toString();
    this.router.navigate(['/reffral-tree'], { queryParams: { id: encryptedId } });
  }

  updateUser(id: any) {
    const encryptedId = CryptoJS.AES.encrypt(id.toString(), this.secretKey).toString();
    this.router.navigate(['/update-user'], { queryParams: { id: encryptedId } });
  }

  // Update the pagination methods
  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.userList(this.currentPage, this.pageSize);
    }
  }
  
  onPageSizeChange() {
    this.currentPage = 1;
    this.userList(this.currentPage, this.pageSize);
  }
  
  // onPageChange(event: PageEvent): void {
  //   this.currentPage = event.pageIndex + 1;
  //   this.pageSize = event.pageSize;
  //   this.userList(this.currentPage, this.pageSize);
  // }
}

