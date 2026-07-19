import { prisma } from '@/lib/prisma';
import { Prisma, Scheduler } from '@prisma/client';

export class SchedulerRepository {
  async findAll(): Promise<Scheduler[]> {
    return prisma.scheduler.findMany({
      orderBy: { createdAt: 'desc' },
      include: { tenant: true },
    });
  }

  async findById(id: string): Promise<Scheduler | null> {
    return prisma.scheduler.findUnique({
      where: { id },
      include: { tenant: true },
    });
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
      where: { status: 'ACTIVE' },
    });
  }
}

export const schedulerRepository = new SchedulerRepository();
