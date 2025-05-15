import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import * as CryptoJS from 'crypto-js';
import { UserServicesService } from 'src/app/services/user-services/user-services.service';
import { TreeNode } from 'primeng/api'; // Import TreeNode from PrimeNG
import { Location } from '@angular/common';
import { TransactionServicesService } from 'src/app/services/transaction/transaction-services.service';
import { PageEvent } from '@angular/material/paginator';
import { AuthServicesService } from 'src/app/services/auth/auth-services.service';
import { ViewportScroller } from '@angular/common';
interface TreCustomTreeNode extends TreeNode {
  label: string;
  referralCode?: string;
  children: TreeNode[];
  icon?: string;
  data?: any;  // Add this to store additional node data
}
@Component({
  selector: 'app-user-update',
  templateUrl: './user-update.component.html',
  styleUrls: ['./user-update.component.scss'],
  providers: []
})
export class UserUpdateComponent {
  error: string | null = null;
  activeSection: string = 'profile'; // Default section
  profileForm!: FormGroup;
  secretKey = '123456789';
  decryptedId: string = '';
  isDarkMode: boolean = true;
  token: any;
  changeTraxPassword: FormGroup;
  chnageLoginPassword: FormGroup;
  fundDeposite: FormGroup;
  showConfirmPassword = false;
  showPrevPassword = false;
  showNewPassword = false;
  showConfirmNewPassword = false;
  showPassword = false;
  selectedReferral: any
  nodes: any[] = [];
  profileForm2!:FormGroup
  searchTerm: string = '';
  transactions:any = []
  totalCredited: number = 0;
  totalDebited: number = 0;
  pageSize: number = 10;
  currentPage: number = 1;
  transactionType: string = '';
  status: string = '';
  isSubmitting = true;
  isAdminProfile: boolean = true;
  totalTransactions: number = 0; // total transactions for paginator
  totalPages: number = 1; // total number of pages for pagination
  constructor(
    private fb: FormBuilder,
    private authService: UserServicesService,
    private toastr: ToastrService,
    private route: ActivatedRoute,
    private authServices: AuthServicesService,
    private location: Location,
    private transactionService: TransactionServicesService,
    private viewportScroller: ViewportScroller
  ) {

    this.changeTraxPassword = this.fb.group({
      userId: ['', Validators.required],
      password: ['', Validators.required],
    });

    this.chnageLoginPassword = this.fb.group({
      userId: ['', Validators.required],
      password: ['', Validators.required],
    });
    this.fundDeposite = this.fb.group({
      amount: ['', Validators.required],
      referralCode: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    // Get the encrypted ID from query parameters
    this.route.queryParams.subscribe((params) => {
      const encryptedId = params['id'];

      if (encryptedId) {
        // Decrypt the ID
        const bytes = CryptoJS.AES.decrypt(encryptedId, this.secretKey);
        this.decryptedId = bytes.toString(CryptoJS.enc.Utf8);
      }
    });


    // Initialize the form group with validators
    this.profileForm = this.fb.group({
      userId: [''],
      name: ['',],
      isEmailVerified: [''],
      isMobileVerified: [''],
      isWithdrawAllowed: [''],
      isStakingAllowed: [''],
      isInternalTransferAllowed: [''],
      // isReferralAllowed: [''],
      isAvailableForReward: [''],

    });
    this.profileForm2 = this.fb.group({
      email: [''],
      BUSDBalance: [''],
      mobile: ['',],
      bonusBalance: [''],
      totalStakedBalance: [''],
      totalWithdrawalBalance: [''],
      totalTeamTurnoverBalance: [''],
      // totalDirectTeamTurnoverBalance: [''],
      // totalRemovedStakedBalance: [''],
      TRADEBalance: [''],
      // totalDelegateRewardBalance: [''],
      // totalUnlockRewardBalnce: ['',],
      totalReferralRewardBalance: [''],
      // totalStakingRewardBalance: [''],
      // totalRankBonusBalance: [''],
      totalRewardBalance: [''],
      isTrxPassCreated: ['']
    });
    
    // Retrieve the token and profile info
    this.token = localStorage.getItem('authToken');
    this.getProfileInfo();
    this.getRefrralTreeData()
    this.fetchTransactions(this.currentPage , this.pageSize)
  }

  goBack(): void {
    this.location.back();
    // Alternatively, use the router for specific navigation:
    // this.router.navigate(['/previous-route']);
  }


  getProfileInfo(): void {

    this.authService.getUserDataWithId(this.token, this.decryptedId).subscribe({
      next: (response) => {
        this.isAdminProfile = response.data.role === 'ADMIN' || response.data.isAdmin;
        this.authServices.toggleLoader(false);
        this.profileForm.patchValue({
          userId: response.data._id,
          name: response.data.name,
          isEmailVerified: response.data.isEmailVerified,
          isMobileVerified: response.data.isMobileVerified,
          isWithdrawAllowed: response.data.isWithdrawAllowed,
          isStakingAllowed: response.data.isStakingAllowed,
          isInternalTransferAllowed: response.data.isInternalTransferAllowed,
          isAvailableForReward: response.data.isAvailableForReward,
        });

        // Map the new balance structure to existing form fields
        this.profileForm2.patchValue({
          email: response.data.email,
          mobile: response.data.mobile,
          BUSDBalance: response.data.balanceDetails?.BUSDBalance || 0,
          bonusBalance: response.data.balanceDetails?.components?.bonus || 0,
          totalStakedBalance: response.data.balanceDetails?.components?.staked || 0,
          totalWithdrawalBalance: response.data.balanceDetails?.components?.withdrawn?.total || 0,
          totalTeamTurnoverBalance: response.data.balanceDetails?.totalTeamTurnover || 0,
          totalReferralRewardBalance: response.data.balanceDetails.totalReferralRewardBalance || 0,
          totalRewardBalance: response.data.balanceDetails.totalBonusBalance,
          TRADEBalance: (response.data.balanceDetails?.components?.mainToTrade || 0) - 
          (response.data.balanceDetails?.components?.tradeToMain || 0),

          isTrxPassCreated: response.data.isTrxPassCreated,

        });

        // Update password form fields
        this.chnageLoginPassword.patchValue({
          userId: response.data._id
        });
        this.changeTraxPassword.patchValue({
          userId: response.data._id
        });
      },
      error: (error) => {
        this.toastr.error('Failed to load profile information', 'Error');

      }
    });
  }

  onSectionChange(event: Event) {
    const target = event.target as HTMLSelectElement;  // Type assertion in TypeScript
    if (target.value === 'delete') {
      this.deleteUser();
    } else {
      this.setActiveSection(target.value);
    }
  }

  setActiveSection(value: string) {
    this.activeSection = value;
  }


  // Method to handle form submission and update the profile
  updateProfile(): void {
    if (this.profileForm.valid) {
      // Show loader

      // Extract only the necessary fields
      const updatedData = {
        ...this.profileForm.value,
        ...this.profileForm2.value
      };


      // Call the update profile service
      this.authService.updateProfile( updatedData ,this.token, ).subscribe({
        next: (response) => {
          this.toastr.success('Profile updated successfully!', 'Success', {
            positionClass: 'toast-bottom-center',
            timeOut: 3000,
            progressBar: true,
            toastClass: 'toast-custom toast-success toast-fixed'
          });
        },
        error: (error) => {
          console.error('Profile update error:', error);
          this.toastr.error('Failed to update profile. Please try again later.', 'Error');

        },
        complete: () => {
          // Additional actions if needed after the request is complete
        }
      });
    } else {
      this.toastr.warning('Please fill out the form correctly.', 'Warning');
    }
  }


  // Method to handle form submission and update the profile
  fundDepositeData(): void {
    if (this.profileForm.valid) {
      // Show loader


      // Extract only the necessary fields
      const updatedData = this.fundDeposite.value;


      // Call the update profile service
      this.authService.fundDpositeTransaction( updatedData ,this.token ).subscribe({
        next: (response) => {
          this.toastr.success('Profile updated successfully!', 'Success');

        },
        error: (error) => {
          console.error('Profile update error:', error);
          this.toastr.error('Failed to update profile. Please try again later.', 'Error');

        },
        complete: () => {
          // Additional actions if needed after the request is complete
        }
      });
    } else {
      this.toastr.warning('Please fill out the form correctly.', 'Warning');
    }
  }



  changeTranxPassword() {
    if (this.changeTraxPassword.valid) {
      const createTransactionPassword = this.changeTraxPassword.value;

      this.authService.changeTranxPawword(createTransactionPassword, this.token).subscribe({
        next: (response) => {
          this.toastr.success(response.body.message, '', {
            toastClass: 'toast-custom toast-success',
            positionClass: 'toast-bottom-center',
            closeButton: false,
            timeOut: 3000,
            progressBar: true
          });
          // Hide the form after successful creation
        },
        error: (err) => {
          const errorMessage = err.error?.message || 'Error creating transaction password';
          this.toastr.error(errorMessage, '', {
            toastClass: 'toast-custom toast-error',
            positionClass: 'toast-bottom-center',
            closeButton: false,
            timeOut: 3000,
            progressBar: true
          });
        }
      });
    }
  }

  changeUserLoginPassword() {
    if (this.chnageLoginPassword.valid) {
      const chnageLoginPassword = this.chnageLoginPassword.value;

      this.authService.changeLoginPassword(chnageLoginPassword, this.token).subscribe({
        next: (response) => {
          this.toastr.success(response.body.message, '', {
            toastClass: 'toast-custom toast-success',
            positionClass: 'toast-bottom-center',
            closeButton: false,
            timeOut: 3000,
            progressBar: true
          });
        },
        error: (err) => {
          const errorMessage = err.error?.message || 'Error changing transaction password';
          this.toastr.error(errorMessage, '', {
            toastClass: 'toast-custom toast-error',
            positionClass: 'toast-bottom-center',
            closeButton: false,
            timeOut: 3000,
            progressBar: true
          });
        }
      });
    }
  }

  getRefrralTreeData() {

    this.authService.getReferralList(this.token, this.decryptedId).subscribe({
      next: (apiResponse) => {
        console.log(apiResponse);
        this.nodes = this.transformDataToTree(apiResponse.data);
      },
      error: (err) => {

      }

    })

  }

  transformDataToTree(data: any): TreCustomTreeNode[] {
    const nodes: TreCustomTreeNode[] = [];

    for (const [key, value] of Object.entries(data)) {
      const node: TreCustomTreeNode = {
        label: key,
        referralCode: key.split('-')[1],
        children: [],
        icon: 'pi pi-user',
        data: {
          referralCode: key.split('-')[1],  // Store referral code in data
        }
      };

      if (value && typeof value === 'object' && !('_id' in value)) {
        node.children = this.transformDataToTree(value);
      }

      nodes.push(node);
    }
    return nodes;
  }

  onNodeSelect(event: any): void {
    const node = event.node;
    if (node) {
      const referralCode = node.referralCode;
      const userId = node.data.userId; // Get userId from data object
      this.getReferralInfo(referralCode, userId);
    }
  }

  getReferralInfo(referralCode: string, userId: string): void {
    this.authService.getReferralInfomation(referralCode, this.token, userId).subscribe({
      next: (response: any) => {
        this.selectedReferral = response.data;
      },
      error: (err) => {
        console.error('Failed to retrieve referral info', err);
        this.toastr.error('Failed to retrieve referral data');
      }
    });
  }

  // Remove the extractUserIdFromNode method since we're not using it anymore


  fetchTransactions(page:any ,size:any ): void {
      // Construct parameters object
      const params: any = {
        page:page,
        sizePerPage:size,
        userId:this.decryptedId
      };

      // Add filtering parameters only if they have values
      if (this.transactionType) {
        params.transactionType = this.transactionType;
      }
      if (this.status) {
        params.status = this.status;
      }

    this.transactionService.getTransactionsById(this.token , params).subscribe({
      next: (response: any) => {
        this.transactions = response.data.docs;
        this.totalTransactions = response.data.totalDocs;
        this.totalPages = Math.ceil(this.totalTransactions / this.pageSize);
        this.calculateTotals(); // Calculate totals when transactions are fetched

      },
      error: (err) => {
        this.transactions=[]
        this.error = 'Failed to load transactions';
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
      .filter((transaction: { amount: number; }) => transaction.amount > 0)
      .reduce((sum: any, transaction: { amount: any; }) => sum + transaction.amount, 0);

    this.totalDebited = this.transactions
      .filter((transaction: { amount: number; }) => transaction.amount < 0)
      .reduce((sum: number, transaction: { amount: number; }) => sum + Math.abs(transaction.amount), 0);
  }


  scrollToTop(): void {
    this.viewportScroller.scrollToPosition([0, 0]);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1; // MatPaginator pageIndex starts from 0
    this.pageSize = event.pageSize;
    this.fetchTransactions(this.currentPage , this.pageSize);
  }

  onPageSizeChange(): void {
    this.currentPage = 1; // Reset to first page when changing page size
    this.fetchTransactions(this.currentPage, this.pageSize);
  }

deleteUser(): void {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      this.authService.deleteUser(this.decryptedId, this.token).subscribe({
        next: (response) => {
          this.toastr.success('User deleted successfully', 'Success', {
            positionClass: 'toast-bottom-center',
            timeOut: 3000,
            progressBar: true
          });
          this.location.back();
        },
        error: (error) => {
          this.toastr.error(error.error.message || 'Failed to delete user', 'Error', {
            positionClass: 'toast-bottom-center',
            timeOut: 3000,
            progressBar: true
          });
        }
      });
    }
  }
}