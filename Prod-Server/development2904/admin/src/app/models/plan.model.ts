export interface Plan {
  _id?: string;
  name: string;
  rate: number;
  min: number;
  max: number;
  duration: number;
  isActive: boolean;
}

export interface Portfolio {
  tradingFunds: number;
  safuFunds: number;
  timestamp: Date;
}