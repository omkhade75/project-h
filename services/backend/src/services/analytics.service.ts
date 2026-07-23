import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
// Note: WhatsApp integration mocked or simplified for now

@Injectable()
export class AnalyticsService {
  constructor(private prisma: DatabaseService) {}

  async getCommandCenter(workspaceId: string, activeDateStr?: string, timeRangeStr?: string) {
    const activeDate = activeDateStr ? new Date(activeDateStr) : new Date();
    const timeRange = timeRangeStr || 'today';

    let startDate = new Date(activeDate);
    let endDate = new Date(activeDate);
    endDate.setHours(23, 59, 59, 999);

    if (timeRange === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (timeRange === 'yesterday') {
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
    } else if (timeRange === '7d') {
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (timeRange === '30d') {
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    }

    const transactions = await this.prisma.transaction.findMany({
      where: {
        workspaceId,
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const expenses = await this.prisma.expense.findMany({
      where: {
        workspaceId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const grossRevenue = transactions.reduce((sum, t) => sum + Number(t.totalAmount), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const netProfit = grossRevenue * 0.4 - totalExpenses;

    const activeAnomalies = await this.prisma.utilityReading.count({
      where: {
        workspaceId,
        readingDate: {
          gte: startDate,
          lte: endDate,
        },
        value: { gt: 1000 },
      },
    });

    return {
      success: true,
      data: {
        grossRevenue,
        netProfit,
        orders: transactions.length,
        expenses: totalExpenses,
        activeAnomalies,
        activeRecommendations: 2,
      }
    };
  }

  async getAnomalies(workspaceId: string, activeDateStr?: string) {
    const anomalies = await this.prisma.anomaly.findMany({
      where: { workspaceId },
      orderBy: { detectedAt: 'desc' },
    });

    if (anomalies.length === 0 && workspaceId === 'grandsquare-mall') {
      const seeded = [
        await this.prisma.anomaly.create({
          data: {
            workspaceId,
            type: 'Energy Surge',
            severity: 'High',
            title: 'Grid energy draw spike',
            description: 'Suspect compressor valve failure on Roof Unit B.',
            evidence: JSON.stringify({ expected: '24 kWh', actual: '41 kWh', deviation: '+71%' }),
            entityType: 'UtilityReading',
            status: 'Active',
            detectedAt: new Date(),
          },
        }),
        await this.prisma.anomaly.create({
          data: {
            workspaceId,
            type: 'Expiry Risk',
            severity: 'Medium',
            title: 'Yogurt Expiry Velocity',
            description: 'Shelf placement obscured by new promotional stand.',
            evidence: JSON.stringify({ expected: '12 units/day', actual: '3 units/day', deviation: '-75%' }),
            entityType: 'Product',
            status: 'Active',
            detectedAt: new Date(),
          },
        }),
      ];
      
      const mapped = seeded.map((a) => ({
        id: a.id,
        severity: a.severity,
        metric: a.type,
        expected: JSON.parse(a.evidence).expected,
        actual: JSON.parse(a.evidence).actual,
        deviation: JSON.parse(a.evidence).deviation,
        when: 'Just now',
        cause: a.description,
        action: 'Investigate immediate mitigation options.',
        status: a.status,
      }));
      return { success: true, data: mapped };
    }

    const mapped = anomalies.map((a) => {
      let parsedEvidence = { expected: 'N/A', actual: 'N/A', deviation: '0%' };
      try {
        parsedEvidence = JSON.parse(a.evidence);
      } catch {}
      return {
        id: a.id,
        severity: a.severity,
        metric: a.type,
        expected: parsedEvidence.expected,
        actual: parsedEvidence.actual,
        deviation: parsedEvidence.deviation,
        when: a.detectedAt.toISOString().split('T')[0],
        cause: a.description,
        action: 'Relocate stand or apply markdown / dispatch contractor.',
        status: a.status,
      };
    });

    return { success: true, data: mapped };
  }

  async getRecommendations(workspaceId: string) {
    const recs = await this.prisma.recommendation.findMany({
      where: { workspaceId },
      orderBy: { generatedAt: 'desc' },
    });

    if (recs.length === 0 && workspaceId === 'grandsquare-mall') {
      const seeded = [
        await this.prisma.recommendation.create({
          data: {
            workspaceId,
            type: 'MARKDOWN',
            title: 'Apply 20% markdown on expiring Yogurt',
            summary: 'Accelerate sales velocity for remaining batch expiring in 48 hours.',
            evidence: JSON.stringify({ expectedVelocity: '12/day', actual: '3/day' }),
            confidence: 0.95,
            priority: 'high',
            expectedImpact: '₹1,200 recovered margin',
            status: 'New',
          },
        }),
        await this.prisma.recommendation.create({
          data: {
            workspaceId,
            type: 'PO',
            title: 'Reorder Lakmé Foundation (24 units)',
            summary: 'Current stock level (4 units) is below reorder point (15 units).',
            evidence: JSON.stringify({ stock: 4, reorder: 15 }),
            confidence: 0.88,
            priority: 'medium',
            expectedImpact: 'Prevent stockout sales loss',
            status: 'New',
          },
        }),
      ];
      const mapped = seeded.map((r) => ({
        id: r.id,
        category: r.type,
        title: r.title,
        evidence: r.summary,
        impact: r.expectedImpact || '',
        confidence: Number(r.confidence),
        priority: r.priority,
        status: r.status,
        generated: 'Just now',
      }));
      return { success: true, data: mapped };
    }

    const mapped = recs.map((r) => ({
      id: r.id,
      category: r.type,
      title: r.title,
      evidence: r.summary,
      impact: r.expectedImpact || '',
      confidence: Number(r.confidence),
      priority: r.priority,
      status: r.status,
      generated: r.generatedAt.toISOString().split('T')[0],
    }));

    return { success: true, data: mapped };
  }

  async getForecasting(workspaceId: string, horizonStr?: string, scenarioStr?: string) {
    const horizon = horizonStr || '7d';
    const scenario = scenarioStr || 'Normal';

    let pastDays = 14;
    let futureDays = 7;
    if (horizon === '30d') {
      pastDays = 30;
      futureDays = 30;
    } else if (horizon === '90d') {
      pastDays = 30;
      futureDays = 90;
    }
    const totalDays = pastDays + futureDays;

    const txns = await this.prisma.transaction.findMany({
      where: { workspaceId },
      take: 100,
    });
    const totalAmount = txns.reduce((sum, t) => sum + Number(t.totalAmount), 0);
    const isGrandSquare = workspaceId === 'grandsquare-mall';
    const avgRevenue = txns.length > 0 ? (totalAmount / txns.length) * 15 : (isGrandSquare ? 150000 : 0);

    let multiplier = 1.0;
    let volatility = 0.15;
    if (scenario === 'Festival Demand') {
      multiplier = 1.35;
      volatility = 0.25;
    } else if (scenario === 'Promotion Campaign') {
      multiplier = 1.2;
      volatility = 0.1;
    } else if (scenario === 'Rainy Weekend') {
      multiplier = 0.8;
      volatility = 0.12;
    } else if (scenario === 'Supplier Delay') {
      multiplier = 0.85;
      volatility = 0.18;
    }

    const forecastData = Array.from({ length: totalDays }, (_, i) => {
      const past = i < pastDays;
      const cycle = Math.sin(i / 1.1) * (avgRevenue * 0.2);
      const base = avgRevenue + cycle;
      const actualVal = past ? Math.round(base + Math.sin(i * 3) * (avgRevenue * 0.05)) : null;
      const forecastVal = !past ? Math.round(base * multiplier * 1.03) : null;
      const upperVal = !past ? Math.round(base * multiplier * (1 + volatility)) : null;
      const lowerVal = !past ? Math.round(base * multiplier * (1 - volatility)) : null;

      return {
        day: `Day ${i + 1}`,
        actual: actualVal,
        forecast: forecastVal,
        upper: upperVal,
        lower: lowerVal,
      };
    });

    return { success: true, data: forecastData };
  }

  async dispatchEodReport(workspaceId: string, activeDateStr?: string) {
    const date = activeDateStr ? new Date(activeDateStr) : new Date();
    const dateStr = date.toISOString().split('T')[0];

    const transactions = await this.prisma.transaction.findMany({
      where: {
        workspaceId,
        transactionDate: {
          gte: new Date(`${dateStr}T00:00:00.000Z`),
          lte: new Date(`${dateStr}T23:59:59.999Z`),
        },
      },
    });

    const expenses = await this.prisma.expense.findMany({
      where: {
        workspaceId,
        date: {
          gte: new Date(`${dateStr}T00:00:00.000Z`),
          lte: new Date(`${dateStr}T23:59:59.999Z`),
        },
      },
    });

    const grossRevenue = transactions.reduce((sum, t) => sum + Number(t.totalAmount), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const netProfit = grossRevenue * 0.4 - totalExpenses;

    const stats = {
      date: dateStr,
      revenue: grossRevenue,
      profit: netProfit,
      orders: transactions.length,
      anomalies: 2,
    };

    // In a real scenario, integrate WhatsApp service here.
    return { success: true, data: { stats } };
  }
}
