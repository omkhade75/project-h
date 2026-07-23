import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class CustomersService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(workspaceId: string) {
    return this.db.client.customer.findMany({ where: { workspaceId } });
  }

  async findOne(id: string, workspaceId: string) {
    return this.db.client.customer.findFirst({ where: { id, workspaceId } });
  }

  async create(data: any, workspaceId: string) {
    return this.db.client.customer.create({
      data: { ...data, workspaceId }
    });
  }

  async update(id: string, data: any, workspaceId: string) {
    return this.db.client.customer.update({
      where: { id },
      data
    }).catch(() => this.db.client.customer.updateMany({ where: { id, workspaceId }, data }));
  }

  async remove(id: string, workspaceId: string) {
    return this.db.client.customer.deleteMany({ where: { id, workspaceId } });
  }
}
