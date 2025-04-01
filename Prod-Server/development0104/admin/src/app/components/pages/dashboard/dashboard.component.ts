import { Component } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { ToastrService } from 'ngx-toastr';
import { AuthServicesService } from 'src/app/services/auth/auth-services.service';
import { TransactionServicesService } from 'src/app/services/transaction/transaction-services.service';
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  token: any;
  userBlance: any = 0
  totalStakedBalance: any = 0
  totalWithdrawalBalance: any = 0
  totalTeamTurnoverBalance: any = 0
  totalDirectTeamTurnoverBalance: any = 0
  totalInternalTransferBalance: any = 0
  totalUnlockRewardBalnce: any = 0
  totalReferralRewardBalance: any = 0
  totalRankBonusBalance: any = 0
  totalRewardBalance: any = 0
  pendingReward: any = 0
  refferalcode: any = ''
  bondBalance: any = ''
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
  transactions: any[] = [];
  error: any;
  pendingDepositBalance: any = 0         // Need to add for Pending Deposit
  pendingWithdrawalBalance: any = 0      // Need to add for Pending Withdrawal
  totalBonusBalance: any = 0             // Need to add for Total Bonus Balance
  totalDeposits: number = 0             // Need to add for Total Deposits
  constructor(private authService: AuthServicesService,
    private toastr: ToastrService, private transactionService: TransactionServicesService) {
  }
  ngOnInit(): void {
    // Retrieve the token and profile info
    this.token = localStorage.getItem('authToken');
    this.getProfileInfo();
    this.fetchTransactions(this.currentPage, this.pageSize);
  }

  getProfileInfo(): void {
    this.authService.getProfile(this.token).subscribe({
      next: (response) => {
        console.log(response.data);
        this.userBlance = response.data.totalBUSDBalance
        this.totalStakedBalance = response.data.totalStakedBalance
        this.totalWithdrawalBalance = response.data.totalWithdrawalBalance
        this.pendingDepositBalance = response.data.totalPendingDeposits || 0  // Add this line
        this.pendingWithdrawalBalance = response.data.totalPendingWithdraws || 0  // Add this line
        this.totalReferralRewardBalance = response.data.totalReferralRewardBalance
        this.totalBonusBalance = response.data.totalBonusBalance || 0  // Add this line
        this.totalRankBonusBalance = response.data.totalRankBonusBalance
        this.totalDirectTeamTurnoverBalance = response.data.totalDirectTeamTurnoverBalance
        this.totalInternalTransferBalance = response.data.totalTRADEBalance
        this.totalTeamTurnoverBalance = response.data.totalTeamTurnoverBalance
        this.totalUnlockRewardBalnce = response.data.totalUnlockRewardBalnce
        this.bondBalance = response.data.totalStakingRewardBalance
        this.totalDeposits = response.data.totalDeposits || 0  // Add this line
        this.refferalcode = localStorage.getItem('referralCode');
        this.pendingReward = response.data.pendingReward
        // localStorage.setItem('balance', this.pendingReward)
        // localStorage.setItem('isTrxPassCreated', response.data[0].isTrxPassCreated)
        // localStorage.setItem('isWalletAdded', response.data[0].isWalletAdded)
      },
      error: (error) => {
        this.toastr.error('Failed to load profile information', 'Error');
      }
    });
  }

  fetchTransactions(page: number, size: number): void {
    // Construct parameters object
    const params: any = {
      page: page.toString(),
      sizePerPage: '10',
      // limit: '10', // Limit to the latest 10 transactions
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
    this.authService.toggleLoader(true);
    this.transactionService.getTransactions(page, size, this.token!, params).subscribe({
      next: (response: any) => {
        this.transactions = response.data.docs;
        this.filteredTransactions = [...this.transactions]; // Initialize filtered transactions
        
        this.totalTransactions = response.data.totalDocs; // total count for pagination
        this.calculateTotals(); // Calculate totals when transactions are fetched
        this.authService.toggleLoader(false);
      },
      error: (err) => {
        this.transactions=[]
        this.error = 'Failed to load transactions';
        this.authService.toggleLoader(false);
      }
    });
  }

  copyReferralLink(): void {
    const referralLink = `${window.location.origin}/signup?referralCode=${this.refferalcode}`;
    navigator.clipboard.writeText(referralLink)
      .then(() => {
        this.toastr.success('Referral link copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy referral link: ', err);
        this.toastr.error('Failed to copy referral link.');
      });
  }

  applyFilters(): void {
    this.currentPage = 1;
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

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.fetchTransactions(this.currentPage, this.pageSize);
  }

}
