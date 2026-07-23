import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class StaffService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(workspaceId: string) {
    return this.db.client.staff.findMany({ where: { workspaceId } });
  }

  async create(data: any, workspaceId: string) {
    return this.db.client.staff.create({ data: { ...data, workspaceId } });
  }

  async update(id: string, data: any, workspaceId: string) {
    return this.db.client.staff.updateMany({ where: { id, workspaceId }, data });
  }

  async remove(id: string, workspaceId: string) {
    return this.db.client.staff.deleteMany({ where: { id, workspaceId } });
  }
}
