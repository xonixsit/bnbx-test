import { Component, OnInit, ViewChild } from '@angular/core';
import { TransactionServicesService } from '../../../services/transaction/transaction-services.service';
import { PageEvent } from '@angular/material/paginator';
import { ToastrService } from 'ngx-toastr'; // Add this import

@Component({
  selector: 'app-transaction',
  templateUrl: './transaction.component.html',
  styleUrls: ['./transaction.component.scss']
})
export class TransactionComponent implements OnInit {
  // Add this property
  sidebarOpen: boolean = true;
  totalPages: number = 1;

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
  transactionType: string = '';
  status: string = '';
  startDate: string = '';
  endDate: string = '';

  constructor(private transactionService: TransactionServicesService,private toastr: ToastrService ) { }

  ngOnInit(): void {
    this.token = localStorage.getItem('authToken');
    this.fetchTransactions(this.currentPage, this.pageSize);
  }

  fetchTransactions(page: number = 1, size: number = 10): void {
    // Construct parameters object
    const params: any = {
      page: page.toString(),
      sizePerPage: size.toString(),
    };

    // Add filtering parameters only if they have values
    if (this.transactionType) {
      params.transactionType = this.transactionType;
    }
    if (this.status) {
      params.status = this.status;
    }
    if (this.startDate) {
      params.startDate = this.startDate;
    }
    if (this.endDate) {
      params.endDate = this.endDate;
    }
    this.transactionService.toggleLoader(true);
    this.transactionService.getTransactions(page, size, this.token!, params).subscribe({
      next: (response: any) => {
        this.transactions = response.data.docs;
        this.filteredTransactions = [...this.transactions]; // Initialize filtered transactions
        this.totalTransactions = response.data.totalDocs; // total count for pagination
        this.calculateTotals(); // Calculate totals when transactions are fetched
        this.transactionService.toggleLoader(false);
        this.totalPages = Math.ceil(this.totalTransactions / this.pageSize);
      },
      error: (err) => {
        this.transactions =[]
        this.error = 'Failed to load transactions';
        this.transactionService.toggleLoader(false);
      }
    });
  }

  applyFilters(): void {
    // Reset current page to 1 when applying new filters
    this.currentPage = 1;
    // Call fetchTransactions with updated filters
    this.fetchTransactions(this.currentPage, this.pageSize);
  }

  calculateTotals(): void {
    this.totalCredited = this.transactions
      .filter(transaction => transaction.amount > 0)
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    this.totalDebited = this.transactions
      .filter(transaction => transaction.amount < 0)
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
  }

  // onPageChange(event: PageEvent): void {
  //   this.currentPage = event.pageIndex + 1;
  //   this.pageSize = event.pageSize;
  //   this.fetchTransactions(this.currentPage, this.pageSize);
  // }

  // Update these methods
onPageChange(page: number) {
  this.currentPage = page;
  // this.loadTransactions();
  this.fetchTransactions(this.currentPage, this.pageSize);
}

onPageSizeChange() {
  this.currentPage = 1; // Reset to first page
  this.fetchTransactions(this.currentPage, this.pageSize);
}

  verifyDeposit(transactionId: string, status: 'COMPLETED' | 'REJECTED') {
    const token = localStorage.getItem('authToken');
    if (!token) {
      this.toastr.error('Authentication token not found');
      return;
    }

    this.transactionService.verifyDeposit(transactionId, status, token).subscribe({
      next: (response) => {
        this.toastr.success(`Deposit ${status.toLowerCase()} successfully`);
        // Refresh the transaction list
        this.fetchTransactions(this.currentPage, this.pageSize);
      },
      error: (error) => {
        const errorMessage = error.error?.message || `Failed to ${status.toLowerCase()} deposit`;
        this.toastr.error(errorMessage);
      }
    });
}

verifyWithdraw(transactionId: string, status: 'COMPLETED' | 'REJECTED') {
  const token = localStorage.getItem('authToken');
  if (!token) {
    this.toastr.error('Authentication token not found');
    return;
  }

  this.transactionService.verifyWidthdraw(transactionId, status, token).subscribe({
    next: (response) => {
      this.toastr.success(`Withdraw ${status.toLowerCase()} successfully`);
      // Refresh the transaction list
      this.fetchTransactions(this.currentPage, this.pageSize);
    },
    error: (error) => {
      const errorMessage = error.error?.message || `Failed to ${status.toLowerCase()} deposit`;
      this.toastr.error(errorMessage);
    }
  });
}


// Optional: Add this method if you want to toggle sidebar
  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }
}
