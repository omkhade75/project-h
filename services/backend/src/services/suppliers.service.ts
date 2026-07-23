import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class SuppliersService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(workspaceId: string) {
    return this.db.client.supplier.findMany({ where: { workspaceId } });
  }

  async create(data: any, workspaceId: string) {
    return this.db.client.supplier.create({ data: { ...data, workspaceId } });
  }

  async update(id: string, data: any, workspaceId: string) {
    return this.db.client.supplier.updateMany({ where: { id, workspaceId }, data });
  }

  async remove(id: string, workspaceId: string) {
    return this.db.client.supplier.deleteMany({ where: { id, workspaceId } });
  }

  async getOrders(workspaceId: string) {
    return this.db.client.purchaseOrder.findMany({ where: { workspaceId }, include: { supplier: true, items: true } });
  }

  async getOrder(id: string, workspaceId: string) {
    return this.db.client.purchaseOrder.findFirst({ where: { id, workspaceId }, include: { items: true, supplier: true } });
  }

  async createOrder(data: any, workspaceId: string) {
    const { items, ...poData } = data;
    return this.db.client.purchaseOrder.create({
      data: {
        ...poData,
        workspaceId,
        items: {
          create: items.map((i: any) => ({ ...i, workspaceId }))
        }
      }
    });
  }

  async updateOrderStatus(id: string, status: string, workspaceId: string) {
    return this.db.client.purchaseOrder.updateMany({ where: { id, workspaceId }, data: { status } });
  }

  async receiveOrder(id: string, data: any, userId: string, workspaceId: string) {
    return this.db.client.goodsReceipt.create({
      data: {
        purchaseOrderId: id,
        receivedBy: userId,
        notes: data.notes,
        workspaceId,
        items: {
          create: data.items.map((i: any) => ({ ...i, workspaceId }))
        }
      }
    });
  }
}
