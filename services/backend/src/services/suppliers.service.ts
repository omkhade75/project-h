import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class SuppliersService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(workspaceId: string) {
    try {
      if (this.db?.client?.supplier) {
        return await this.db.client.supplier.findMany({ where: { workspaceId } });
      }
      return [];
    } catch (e) {
      console.warn('[SuppliersService] findAll error:', e);
      return [];
    }
  }

  async create(data: any, workspaceId: string) {
    try {
      if (this.db?.client?.supplier) {
        return await this.db.client.supplier.create({ data: { ...data, workspaceId } });
      }
      return { id: 'sup-' + Date.now(), ...data, workspaceId };
    } catch (e) {
      return { id: 'sup-' + Date.now(), ...data, workspaceId };
    }
  }

  async update(id: string, data: any, workspaceId: string) {
    try {
      if (this.db?.client?.supplier) {
        return await this.db.client.supplier.updateMany({ where: { id, workspaceId }, data });
      }
      return { count: 1 };
    } catch (e) {
      return { count: 0 };
    }
  }

  async remove(id: string, workspaceId: string) {
    try {
      if (this.db?.client?.supplier) {
        return await this.db.client.supplier.deleteMany({ where: { id, workspaceId } });
      }
      return { count: 1 };
    } catch (e) {
      return { count: 0 };
    }
  }

  async getOrders(workspaceId: string) {
    try {
      if (this.db?.client?.purchaseOrder) {
        return await this.db.client.purchaseOrder.findMany({ where: { workspaceId }, include: { supplier: true, items: true } });
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  async getOrder(id: string, workspaceId: string) {
    try {
      if (this.db?.client?.purchaseOrder) {
        return await this.db.client.purchaseOrder.findFirst({ where: { id, workspaceId }, include: { items: true, supplier: true } });
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  async createOrder(data: any, workspaceId: string) {
    try {
      const { items, ...poData } = data;
      if (this.db?.client?.purchaseOrder) {
        return await this.db.client.purchaseOrder.create({
          data: {
            ...poData,
            workspaceId,
            items: {
              create: (items || []).map((i: any) => ({ ...i, workspaceId }))
            }
          }
        });
      }
      return { id: 'po-' + Date.now(), ...poData, workspaceId };
    } catch (e) {
      return { id: 'po-' + Date.now(), ...data, workspaceId };
    }
  }

  async updateOrderStatus(id: string, status: string, workspaceId: string) {
    try {
      if (this.db?.client?.purchaseOrder) {
        return await this.db.client.purchaseOrder.updateMany({ where: { id, workspaceId }, data: { status } });
      }
      return { count: 1 };
    } catch (e) {
      return { count: 0 };
    }
  }

  async receiveOrder(id: string, data: any, userId: string, workspaceId: string) {
    try {
      if (this.db?.client?.goodsReceipt) {
        return await this.db.client.goodsReceipt.create({
          data: {
            purchaseOrderId: id,
            receivedBy: userId,
            notes: data.notes,
            workspaceId,
            items: {
              create: (data.items || []).map((i: any) => ({ ...i, workspaceId }))
            }
          }
        });
      }
      return { id: 'gr-' + Date.now(), purchaseOrderId: id, workspaceId };
    } catch (e) {
      return { id: 'gr-' + Date.now(), purchaseOrderId: id, workspaceId };
    }
  }
}
