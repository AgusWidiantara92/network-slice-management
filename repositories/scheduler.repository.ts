import { prisma } from '@/lib/prisma';
import { Prisma, Scheduler } from '@prisma/client';

export interface SchedulerFilterParams {
  search?: string;
  tenantId?: string;
  routerId?: string;
  sliceId?: string;
  status?: string;
  repeatType?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SchedulerWithRelations extends Scheduler {
  tenant: { name: string } | null;
  router: { name: string } | null;
  slice: { name: string } | null;
}

export class SchedulerRepository {
  async findManyWithFilters(params: SchedulerFilterParams): Promise<{
    data: SchedulerWithRelations[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      search,
      tenantId,
      routerId,
      sliceId,
      status,
      repeatType,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = params;

    const where: Prisma.SchedulerWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (tenantId) {
      where.tenantId = tenantId;
    }
    if (routerId) {
      where.routerId = routerId;
    }
    if (sliceId) {
      where.sliceId = sliceId;
    }
    if (status) {
      where.status = status;
    }
    if (repeatType) {
      where.repeatType = repeatType;
    }

    const [data, total] = await Promise.all([
      prisma.scheduler.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          tenant: {
            select: { name: true },
          },
          router: {
            select: { name: true },
          },
          slice: {
            select: { name: true },
          },
        },
      }) as Promise<SchedulerWithRelations[]>,
      prisma.scheduler.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findAll(): Promise<Scheduler[]> {
    return prisma.scheduler.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<SchedulerWithRelations | null> {
    return prisma.scheduler.findUnique({
      where: { id },
      include: {
        tenant: {
          select: { name: true },
        },
        router: {
          select: { name: true },
        },
        slice: {
          select: { name: true },
        },
      },
    }) as Promise<SchedulerWithRelations | null>;
  }

  async create(data: Prisma.SchedulerCreateInput): Promise<Scheduler> {
    return prisma.scheduler.create({ data });
  }

  async update(id: string, data: Prisma.SchedulerUpdateInput): Promise<Scheduler> {
    return prisma.scheduler.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Scheduler> {
    return prisma.scheduler.delete({
      where: { id },
    });
  }

  async count(): Promise<number> {
    return prisma.scheduler.count();
  }

  async countActive(): Promise<number> {
    return prisma.scheduler.count({
      where: { status: 'SCHEDULED' },
    });
  }

  async findDueSchedules(now: Date): Promise<Scheduler[]> {
    return prisma.scheduler.findMany({
      where: {
        status: 'SCHEDULED',
        nextRun: {
          lte: now,
        },
      },
    });
  }
}

export const schedulerRepository = new SchedulerRepository();
