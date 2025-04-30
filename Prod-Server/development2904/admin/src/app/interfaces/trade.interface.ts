export interface Trade {
  _id: string;
  product: string;
  cross: string;
  quantity: string;
  value: string;
  entryPrice: string;
  marketPrice: string;
  liquidationPrice: {
    usdt: string;
    usd: string;
  };
  im: {
    usdt: string;
    usd: string;
  };
  mm: {
    usdt: string;
    percentage: string;
    usd: string;
  };
}

export interface TradeResponse {
  liveTrades: Trade[];
}