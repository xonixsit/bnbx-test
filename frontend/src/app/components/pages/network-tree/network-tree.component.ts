import { Component } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { AuthServicesService } from 'src/app/services/auth/auth-services.service';
import { TreeNode } from 'primeng/api'; // Import TreeNode from PrimeNG

interface TreCustomTreeNode extends TreeNode {
  label: string;
  referralCode?: string;  // Add referralCode property to the node
  children: TreeNode[];
  icon?: string;  // Add the icon property
}
@Component({
  selector: 'app-network-tree',
  templateUrl: './network-tree.component.html',
  styleUrls: ['./network-tree.component.scss']
})
export class NetworkTreeComponent {
  token: any;
  nodes: any[] = [];
  selectedReferral: any
  constructor(private authService: AuthServicesService, private toastr: ToastrService,) { }

  ngOnInit(): void {
    this.token = localStorage.getItem('authToken');
    this.getRefrralTreeData()
  }

  getRefrralTreeData() {
    this.authService.toggleLoader(true);
    this.authService.getReferralList(this.token).subscribe({
      next: (apiResponse) => {
        this.nodes = this.transformDataToTree(apiResponse.data);
        this.authService.toggleLoader(false);
      },
      error: (err) => {
        console.error('Error fetching referral tree data:', err);
        this.authService.toggleLoader(false);
      }
    });
  }

  transformDataToTree(data: any): TreCustomTreeNode[] {
    const nodes: TreCustomTreeNode[] = [];
    for (const [key, value] of Object.entries(data)) {
      const node: TreCustomTreeNode = {
        label: key,
        referralCode: key.split('-')[1],
        children: [],
        icon: 'pi pi-user'
      };
      if (value && typeof value === 'object') {
        node.children = this.transformDataToTree(value);
      }
      nodes.push(node);
    }
    return nodes;
  }

  onNodeSelect(event: any): void {
    const node = event.node;  // Get the clicked node from event.node
    if (node) {
      this.getReferralInfo(node.referralCode);  // Fetch referral info using referralCode
    }
  }

  doSomething(event: any, item: any) {
    event.stopPropagation();
  }

  getReferralInfo(referralCode: string): void {
    this.authService.getReferralInfomation(referralCode, this.token).subscribe({
      next: (response: any) => {
        this.selectedReferral = response.data
      },
      error: (err) => {
        console.error('Failed to retrieve referral info', err);
        this.toastr.error('Failed to retrieve referral data');
      }
    });
  }
}
