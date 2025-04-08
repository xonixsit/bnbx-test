export interface ActivePlan {
    planName: string;
    amount: number;
    depositAmount: number;
    depositDate: string;
    lockPeriod: string;
    dailyRate: number;
    expiryDate: string;
    status: string;
}

export interface BalanceBreakdown {
    totalBalance: number;
    regularDeposits: number;
    bondedAmount: number;
    referralIncome: number;
    lockedAmount: number;
    withdrawableAmount: number;
    totalWithdrawn: number;
    bonusAmount: number;
}

export interface LockStatus {
    isLocked: boolean;
    lockedUntil: string;
}