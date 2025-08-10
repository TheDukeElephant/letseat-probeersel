// Shared domain enums & types derived from Prisma schema
// Keep frontend/backend aligned without importing generated Prisma directly into web/mobile.

export enum Role {
  USER = 'USER',
  RESTAURANT = 'RESTAURANT',
  ADMIN = 'ADMIN'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  AUTHORIZED = 'AUTHORIZED',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export enum DeliveryStatus {
  QUEUED = 'QUEUED',
  ASSIGNED = 'ASSIGNED',
  PICKED_UP = 'PICKED_UP',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export interface BasicRestaurant {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
}

export interface BasicMenuItem {
  id: string;
  name: string;
  price: string; // stringified decimal for transport
  imageUrl?: string | null;
  isEnabled: boolean;
}

export interface OrderSummary {
  id: string;
  status: OrderStatus;
  totalAmount: string; // decimal as string
  currency: string;
  createdAt: string; // ISO
}
