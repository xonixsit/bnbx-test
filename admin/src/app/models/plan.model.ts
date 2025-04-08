export interface Plan {
  _id?: string;
  name: string;
  rate: number;
  min: number;
  max: number;
  duration: number;
  isActive: boolean;
}