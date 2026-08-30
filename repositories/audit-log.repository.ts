import { prisma } from '@/lib/prisma';
import { Prisma, AuditLog } from '@prisma/client';

export interface AuditLogFilterParams {
  search?: string;
  action?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface AuditLogWithRelations extends AuditLog {
  admin: { name: string; email: string } | null;
  router: { name: string } | null;
}

export class AuditLogRepository {
  async findManyWithFilters(params: AuditLogFilterParams): Promise<{
    data: AuditLogWithRelations[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      search,
      action,
      status,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = params;

    const where: Prisma.AuditLogWhereInput = {};

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { userEmail: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (action) {
      where.action = action;
    }
    if (status) {
      where.status = status;
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Prisma.DateTimeFilter).gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        (where.createdAt as Prisma.DateTimeFilter).lte = end;
      }
    }

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          admin: {
            select: { name: true, email: true },
          },
          router: {
            select: { name: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findRecent(limit: number = 10): Promise<AuditLogWithRelations[]> {
    return prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        admin: {
          select: { name: true, email: true },
        },
        router: {
          select: { name: true },
        },
      },
    });
  }

  async create(data: {
    userId?: string;
    userEmail?: string;
    action: string;
    description: string;
    status?: string;
    routerId?: string;
  }): Promise<AuditLog> {
    return prisma.auditLog.create({
      data: {
        userId: data.userId,
        userEmail: data.userEmail,
        action: data.action,
        description: data.description,
        status: data.status || 'SUCCESS',
        routerId: data.routerId,
      },
    });
  }

  async count(): Promise<number> {
    return prisma.auditLog.count();
  }

  async getDistinctActions(): Promise<string[]> {
    const result = await prisma.auditLog.findMany({
      distinct: ['action'],
      select: { action: true },
      orderBy: { action: 'asc' },
    });
    return result.map((r) => r.action);
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const result = await prisma.auditLog.deleteMany({
      where: { createdAt: { lt: date } },
    });
    return result.count;
  }
}

export const auditLogRepository = new AuditLogRepository();
