import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class LogisticsService {
  constructor(private prisma: DatabaseService) {}

  async getDispatches(workspaceId: string) {
    const dispatches = await this.prisma.deliveryDispatch.findMany({
      where: { workspaceId },
      orderBy: { dispatchedAt: 'desc' },
    });

    const mapped = dispatches.map((d) => ({
      id: d.id,
      orderNumber: d.orderNumber,
      customerName: d.customerName,
      destination: d.destination,
      driverName: d.driverName,
      vehicleNumber: d.vehicleNumber,
      itemsCount: d.itemsCount,
      status: d.status,
      delayReason: d.delayReason,
      dispatchedAt: d.dispatchedAt.toISOString(),
      deliveredAt: d.deliveredAt ? d.deliveredAt.toISOString() : null,
    }));

    return { success: true, data: mapped };
  }

  async createDispatch(workspaceId: string, data: any) {
    const result = await this.prisma.deliveryDispatch.create({
      data: {
        workspaceId,
        orderNumber: data.orderNumber,
        customerName: data.customerName,
        destination: data.destination,
        driverName: data.driverName,
        vehicleNumber: data.vehicleNumber,
        itemsCount: data.itemsCount,
        status: 'Dispatched',
      },
    });

    await this.prisma.businessEvent.create({
      data: {
        workspaceId,
        eventType: 'DELIVERY_DISPATCHED',
        entityType: 'DeliveryDispatch',
        entityId: result.id,
        title: `Delivery Dispatched: ${data.orderNumber}`,
        description: `Order dispatched to ${data.customerName} via driver ${data.driverName} (${data.vehicleNumber}).`,
        metadata: JSON.stringify({ driver: data.driverName, destination: data.destination }),
      },
    });

    return { success: true, data: result };
  }

  async updateStatus(workspaceId: string, dispatchId: string, status: string, delayReason?: string) {
    const deliveredDate = status === 'Delivered' ? new Date() : null;

    const result = await this.prisma.deliveryDispatch.update({
      where: { id: dispatchId },
      data: {
        status,
        delayReason: delayReason || null,
        deliveredAt: deliveredDate,
      },
    });

    if (status === 'Delivered') {
      await this.prisma.businessEvent.create({
        data: {
          workspaceId,
          eventType: 'DELIVERY_COMPLETED',
          entityType: 'DeliveryDispatch',
          entityId: result.id,
          title: `Delivery Completed: ${result.orderNumber}`,
          description: `Order successfully delivered to ${result.customerName} at ${result.destination}.`,
        },
      });
    }

    return { success: true, data: result };
  }
}
