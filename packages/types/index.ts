// packages/types/index.ts
export interface Order {
  id: string;
  status: 'pending' | 'preparing' | 'delivered';
}
