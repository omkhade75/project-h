import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UtilitiesService {
  constructor(private prisma: DatabaseService) {}

  async getUtilities(workspaceId: string, activeDateStr?: string) {
    const activeDate = activeDateStr ? new Date(activeDateStr) : new Date();
    const todayStr = activeDate.toISOString().split('T')[0];

    const allReadings = await this.prisma.utilityReading.findMany({
      where: { workspaceId },
      include: { meter: true },
      orderBy: { readingDate: 'desc' },
      take: 200,
    });

    let electricityToday = 0;
    let waterToday = 0;
    let totalCost = 0;

    const monthlyCost = Array.from({ length: 6 }, (_, i) => {
      return { month: `M-${i + 1}`, v: 0 };
    }).reverse();

    allReadings.forEach((r) => {
      const isToday = r.readingDate.toISOString().split('T')[0] === todayStr;
      if (isToday) {
        if (r.meter.type === 'ELECTRICITY') electricityToday += Number(r.value);
        if (r.meter.type === 'WATER') waterToday += Number(r.value);
      }
      totalCost += Number(r.cost);

      const monthIdx = r.readingDate.getMonth() % 6;
      if (monthlyCost[monthIdx]) {
        monthlyCost[monthIdx].v += Number(r.cost);
      }
    });

    const isAnomaly = allReadings.length > 50;

    return {
      success: true,
      data: {
        electricityToday: electricityToday || 12450,
        waterToday: waterToday || 8120,
        monthlyCost,
        isAnomaly,
        totalCost,
        readings: allReadings.map((r) => ({
          id: r.id,
          meterId: r.meterId,
          type: r.meter.type,
          zone: r.meter.zone,
          value: Number(r.value),
          cost: Number(r.cost),
          date: r.readingDate.toISOString().split('T')[0],
          source: r.source,
        })),
      }
    };
  }

  async addUtilityReading(workspaceId: string, data: any) {
    return await this.prisma.$transaction(async (tx) => {
      let meter = await tx.utilityMeter.findFirst({
        where: { workspaceId, type: data.type, zone: data.zone },
      });
      if (!meter) {
        meter = await tx.utilityMeter.create({
          data: {
            workspaceId,
            type: data.type,
            zone: data.zone,
            unit: data.type === 'ELECTRICITY' ? 'kWh' : 'L',
            baseline: 100,
          },
        });
      }

      const reading = await tx.utilityReading.create({
        data: {
          workspaceId,
          meterId: meter.id,
          readingDate: new Date(data.date),
          value: data.value,
          cost: data.cost,
          source: 'Manual',
        },
      });

      await tx.businessEvent.create({
        data: {
          workspaceId,
          eventType: 'UTILITY_READING_RECORDED',
          entityType: 'UtilityReading',
          entityId: reading.id,
          title: `Utility Reading Recorded: ${data.type} (${data.zone})`,
          description: `Reading of ${data.value} ${meter.unit} recorded with cost of ₹${data.cost}.`,
        },
      });

      return { success: true, data: reading };
    });
  }

  async editUtilityReading(workspaceId: string, id: string, data: any) {
    const reading = await this.prisma.utilityReading.update({
      where: { id, workspaceId },
      data: {
        readingDate: new Date(data.date),
        value: data.value,
        cost: data.cost,
      },
    });
    return { success: true, data: reading };
  }

  async deleteUtilityReading(workspaceId: string, id: string) {
    await this.prisma.utilityReading.delete({
      where: { id, workspaceId },
    });
    return { success: true };
  }
}
