import { prisma } from '@/lib/prisma';
import { AuditLog } from '@prisma/client';

export class AuditLogRepository {
  async findRecent(limit: number = 10): Promise<(AuditLog & {
    admin: { name: string; email: string } | null;
    router: { name: string } | null;
  })[]> {
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
}

export const auditLogRepository = new AuditLogRepository();
