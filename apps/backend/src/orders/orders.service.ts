import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, Prisma } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  private computeTotals(items: { quantity: number; price: Prisma.Decimal }[]) {
    const subtotal = items.reduce((acc, it) => acc.plus(it.price.mul(it.quantity)), new Prisma.Decimal(0));
    const taxRate = new Prisma.Decimal(0.06); // 6%
    const serviceFeeRate = new Prisma.Decimal(0.05); // 5%
    const taxAmount = subtotal.mul(taxRate);
    const serviceFee = subtotal.mul(serviceFeeRate);
    const deliveryFee = new Prisma.Decimal(0); // placeholder (dynamic later)
    const tipAmount = new Prisma.Decimal(0);
    const discountTotal = new Prisma.Decimal(0);
    const grandTotal = subtotal.plus(taxAmount).plus(serviceFee).plus(deliveryFee).plus(tipAmount).minus(discountTotal);
    return { subtotal, taxAmount, serviceFee, deliveryFee, tipAmount, discountTotal, grandTotal };
  }

  findAll() { return this.prisma.order.findMany({ orderBy: { createdAt: 'desc' }, include: { items: true, group: { select: { id: true, name: true } } } }); }
  findOne(id: string) { return this.prisma.order.findUnique({ where: { id }, include: { items: true, group: { include: { users: true } } } }); }

  async create(input: { restaurantId: string; groupId: string; userId: string; currency?: string; deliveryAddressLine: string; deliveryPostalCode: string; deliveryCity: string; deliveryLat?: number; deliveryLng?: number; scheduledFor?: Date | null; specialInstructions?: string | null; }) {
    const membership = await this.prisma.group.findFirst({ where: { id: input.groupId, users: { some: { id: input.userId } } }, select: { id: true } });
    if (!membership) throw new Error('User must be a member of group');
    return this.prisma.order.create({ data: {
      userId: input.userId,
      groupId: input.groupId,
      restaurantId: input.restaurantId,
      currency: input.currency || 'EUR',
      deliveryAddressLine: input.deliveryAddressLine,
      deliveryPostalCode: input.deliveryPostalCode,
      deliveryCity: input.deliveryCity,
      deliveryLat: input.deliveryLat ?? null,
      deliveryLng: input.deliveryLng ?? null,
      scheduledFor: input.scheduledFor ?? null,
      specialInstructions: input.specialInstructions ?? null,
    }, include: { items: true } });
  }

  async addItem(orderId: string, userId: string, menuItemId: string, quantity: number, comment?: string | null) {
  const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { group: { include: { users: true } }, items: true } });
    if (!order) throw new Error('Order not found');
    if (order.isFinalized) throw new Error('Order is finalized');
    if (!order.group.users.some(u => u.id === userId)) throw new Error('User not in group');
    const menuItem = await this.prisma.menuItem.findUnique({ where: { id: menuItemId } });
    if (!menuItem || !menuItem.isEnabled) throw new Error('Menu item unavailable');
    if (quantity <= 0) throw new Error('Quantity must be positive');
  const item = await this.prisma.orderItem.create({ data: { orderId, menuItemId, addedByUserId: userId, quantity, price: menuItem.price, comment: comment || null } });
    await this.recalculateTotals(orderId);
    return item;
  }

  async updateItemQuantity(orderItemId: string, userId: string, quantity: number) {
    if (quantity <= 0) throw new Error('Quantity must be positive');
  const item = await this.prisma.orderItem.findUnique({ where: { id: orderItemId }, include: { order: { include: { group: { include: { users: true } } } } } });
    if (!item) throw new Error('Item not found');
    if (item.order.isFinalized) throw new Error('Order finalized');
    if (!item.order.group.users.some(u => u.id === userId)) throw new Error('User not in group');
    await this.prisma.orderItem.update({ where: { id: orderItemId }, data: { quantity } });
    await this.recalculateTotals(item.orderId);
    return this.findOne(item.orderId);
  }

  async removeItem(orderItemId: string, userId: string) {
  const item = await this.prisma.orderItem.findUnique({ where: { id: orderItemId }, include: { order: { include: { group: { include: { users: true } } } } } });
    if (!item) throw new Error('Item not found');
    if (item.order.isFinalized) throw new Error('Order finalized');
    if (!item.order.group.users.some(u => u.id === userId)) throw new Error('User not in group');
    await this.prisma.orderItem.delete({ where: { id: orderItemId } });
    await this.recalculateTotals(item.orderId);
    return true;
  }

  async finalize(orderId: string, userId: string) {
  const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { group: { include: { users: true } } } });
    if (!order) throw new Error('Order not found');
    if (!order.group.users.some(u => u.id === userId)) throw new Error('User not in group');
    if (order.isFinalized) return order;
    return this.prisma.order.update({ where: { id: orderId }, data: { isFinalized: true, finalizedAt: new Date(), status: OrderStatus.ACCEPTED } });
  }

  async changeStatus(orderId: string, status: OrderStatus) { return this.prisma.order.update({ where: { id: orderId }, data: { status } }); }

  private async recalculateTotals(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) return;
  const breakdown = this.computeTotals(order.items.map(i => ({ quantity: i.quantity, price: i.price as unknown as Prisma.Decimal })));
  await this.prisma.order.update({ where: { id: orderId }, data: {
    subtotal: breakdown.subtotal,
    taxAmount: breakdown.taxAmount,
    serviceFee: breakdown.serviceFee,
    deliveryFee: breakdown.deliveryFee,
    tipAmount: breakdown.tipAmount,
    discountTotal: breakdown.discountTotal,
    grandTotal: breakdown.grandTotal,
  }});
  }
}
