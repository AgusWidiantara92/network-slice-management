import { prisma } from '@/lib/prisma';
import { Prisma, Tenant } from '@prisma/client';

export interface TenantFilterParams {
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface TenantWithSliceCount extends Tenant {
  _count: { slices: number };
}

export class TenantRepository {
  async findManyWithFilters(params: TenantFilterParams): Promise<{
    data: TenantWithSliceCount[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = params;

    const where: Prisma.TenantWhereInput = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { slices: true } } },
      }),
      prisma.tenant.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findAll(): Promise<Tenant[]> {
    return prisma.tenant.findMany({ orderBy: { name: 'asc' } });
  }

  async findById(id: string): Promise<TenantWithSliceCount | null> {
    return prisma.tenant.findUnique({
      where: { id },
      include: { _count: { select: { slices: true } } },
    });
  }

  async findByName(name: string): Promise<Tenant | null> {
    return prisma.tenant.findUnique({ where: { name } });
  }

  async create(data: Prisma.TenantCreateInput): Promise<Tenant> {
    return prisma.tenant.create({ data });
  }

  async update(id: string, data: Prisma.TenantUpdateInput): Promise<Tenant> {
    return prisma.tenant.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Tenant> {
    return prisma.tenant.delete({ where: { id } });
  }

  async count(): Promise<number> {
    return prisma.tenant.count();
  }

  async countByMonth(): Promise<{ month: string; count: number }[]> {
    const result = await prisma.$queryRaw<{ month: string; count: bigint }[]>`
      SELECT TO_CHAR("createdAt", 'YYYY-MM') AS month, COUNT(*)::bigint AS count
      FROM "Tenant"
      GROUP BY month
      ORDER BY month ASC
    `;
    return result.map((r) => ({ month: r.month, count: Number(r.count) }));
  }
}

export const tenantRepository = new TenantRepository();
