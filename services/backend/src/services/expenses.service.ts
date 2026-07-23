import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { LedgerService } from './ledger.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly ledgerService: LedgerService
  ) {}

  async getExpenses(workspaceId: string) {
    const expenses = await this.db.expense.findMany({
      where: { workspaceId },
      include: { category: true },
      orderBy: { date: 'desc' },
    });

    return expenses.map((e) => ({
      id: e.id,
      expenseNumber: e.expenseNumber,
      date: e.date.toISOString().split('T')[0],
      category: e.category.name,
      description: e.description,
      vendor: e.vendor,
      amount: Number(e.amount),
      departmentId: e.departmentId,
      status: e.status,
      paymentMethod: e.paymentMethod,
    }));
  }

  async addExpense(workspaceId: string, email: string, data: {
    category: string;
    description: string;
    vendor: string;
    amount: number;
    date: string;
    paymentMethod: string;
    departmentId?: string;
  }) {
    return this.db.$transaction(async (tx) => {
      let category = await tx.expenseCategory.findFirst({
        where: { name: data.category, workspaceId },
      });
      if (!category) {
        category = await tx.expenseCategory.create({
          data: { name: data.category, workspaceId },
        });
      }

      const expense = await tx.expense.create({
        data: {
          expenseNumber: `EXP-${Math.floor(100000 + Math.random() * 900000)}`,
          date: new Date(data.date),
          categoryId: category.id,
          description: data.description,
          vendor: data.vendor,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          departmentId: data.departmentId || null,
          createdBy: email,
          status: 'Paid',
          workspaceId,
        },
      });

      let expenseCode = '5400';
      const catLower = data.category.toLowerCase();
      if (catLower.includes('utility') || catLower.includes('electricity') || catLower.includes('water')) {
        expenseCode = '5100';
      } else if (catLower.includes('salary') || catLower.includes('payroll')) {
        expenseCode = '5200';
      } else if (catLower.includes('rent') || catLower.includes('lease')) {
        expenseCode = '5300';
      } else if (catLower.includes('tax') || catLower.includes('compliance')) {
        expenseCode = '5600';
      }

      await this.ledgerService.recordDoubleEntry(tx, workspaceId, {
        journalId: `JNL-EXP-${expense.id}`,
        referenceType: 'Expense',
        referenceId: expense.id,
        description: `Recorded expense: ${data.description} (Vendor: ${data.vendor})`,
        debits: [{ code: expenseCode, amount: data.amount }],
        credits: [{ code: '1000', amount: data.amount }],
      });

      return expense;
    });
  }

  async editExpense(workspaceId: string, id: string, data: {
    category: string;
    description: string;
    vendor: string;
    amount: number;
    date: string;
    paymentMethod: string;
    departmentId?: string;
  }) {
    return this.db.$transaction(async (tx) => {
      let category = await tx.expenseCategory.findFirst({
        where: { name: data.category, workspaceId },
      });
      if (!category) {
        category = await tx.expenseCategory.create({
          data: { name: data.category, workspaceId },
        });
      }

      const expense = await tx.expense.update({
        where: { id, workspaceId },
        data: {
          date: new Date(data.date),
          categoryId: category.id,
          description: data.description,
          vendor: data.vendor,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          departmentId: data.departmentId || null,
        },
      });

      return expense;
    });
  }

  async archiveExpense(workspaceId: string, id: string) {
    return await this.db.expense.update({
      where: { id, workspaceId },
      data: { status: 'Voided' },
    });
  }
}
