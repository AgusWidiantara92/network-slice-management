import { prisma } from '@/lib/prisma';
import { Prisma, Router } from '@prisma/client';

export interface RouterFilterParams {
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface RouterWithSliceCount extends Router {
  _count: { slices: number };
}

export class RouterRepository {
  async findManyWithFilters(params: RouterFilterParams): Promise<{
    data: RouterWithSliceCount[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { search, status, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 10 } = params;
    const where: Prisma.RouterWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { host: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      prisma.router.findMany({
        where, orderBy: { [sortBy]: sortOrder }, skip: (page - 1) * limit, take: limit,
        include: { _count: { select: { slices: true } } },
      }),
      prisma.router.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findAll(): Promise<Router[]> {
    return prisma.router.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findById(id: string): Promise<RouterWithSliceCount | null> {
    return prisma.router.findUnique({ where: { id }, include: { _count: { select: { slices: true } } } });
  }

  async findByName(name: string): Promise<Router | null> {
    return prisma.router.findFirst({ where: { name } });
  }

  async create(data: Prisma.RouterCreateInput): Promise<Router> {
    return prisma.router.create({ data });
  }

  async update(id: string, data: Prisma.RouterUpdateInput): Promise<Router> {
    return prisma.router.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Router> {
    return prisma.router.delete({ where: { id } });
  }

  async count(): Promise<number> { return prisma.router.count(); }

  async countByStatus(status: string): Promise<number> {
    return prisma.router.count({ where: { status } });
  }

  async groupByStatus(): Promise<{ status: string; _count: number }[]> {
    const result = await prisma.router.groupBy({ by: ['status'], _count: true });
    return result.map((r) => ({ status: r.status, _count: r._count }));
  }
}

export const routerRepository = new RouterRepository();
