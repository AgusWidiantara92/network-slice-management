import { prisma } from '@/lib/prisma';
import { Prisma, NetworkSlice } from '@prisma/client';

export interface SliceFilterParams {
  search?: string;
  status?: string;
  tenantId?: string;
  routerId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SliceWithRelations extends NetworkSlice {
  tenant: { id: string; name: string } | null;
  router: { id: string; name: string; host: string };
}

export class NetworkSliceRepository {
  async findManyWithFilters(params: SliceFilterParams): Promise<{
    data: SliceWithRelations[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { search, status, tenantId, routerId, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 10 } = params;
    const where: Prisma.NetworkSliceWhereInput = {};
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (status) where.status = status;
    if (tenantId) where.tenantId = tenantId;
    if (routerId) where.routerId = routerId;

    const [data, total] = await Promise.all([
      prisma.networkSlice.findMany({
        where, orderBy: { [sortBy]: sortOrder }, skip: (page - 1) * limit, take: limit,
        include: { tenant: { select: { id: true, name: true } }, router: { select: { id: true, name: true, host: true } } },
      }),
      prisma.networkSlice.count({ where }),
    ]);
    return { data: data as SliceWithRelations[], total, page, limit };
  }

  async findById(id: string): Promise<SliceWithRelations | null> {
    return prisma.networkSlice.findUnique({
      where: { id },
      include: { tenant: { select: { id: true, name: true } }, router: { select: { id: true, name: true, host: true } } },
    }) as Promise<SliceWithRelations | null>;
  }

  async findByVlanOnRouter(vlanId: number, routerId: string, excludeId?: string): Promise<NetworkSlice | null> {
    const where: Prisma.NetworkSliceWhereInput = { vlanId, routerId };
    if (excludeId) where.NOT = { id: excludeId };
    return prisma.networkSlice.findFirst({ where });
  }

  async findByVrfName(vrfName: string, excludeId?: string): Promise<NetworkSlice | null> {
    const where: Prisma.NetworkSliceWhereInput = { vrfName };
    if (excludeId) where.NOT = { id: excludeId };
    return prisma.networkSlice.findFirst({ where });
  }

  async create(data: Prisma.NetworkSliceCreateInput): Promise<NetworkSlice> {
    return prisma.networkSlice.create({ data });
  }

  async update(id: string, data: Prisma.NetworkSliceUpdateInput): Promise<NetworkSlice> {
    return prisma.networkSlice.update({ where: { id }, data });
  }

  async delete(id: string): Promise<NetworkSlice> {
    return prisma.networkSlice.delete({ where: { id } });
  }

  async count(): Promise<number> { return prisma.networkSlice.count(); }

  async countByTenant(): Promise<{ tenantName: string; count: number; totalTx: number; totalRx: number }[]> {
    const slices = await prisma.networkSlice.findMany({ include: { tenant: true } });
    const grouped = new Map<string, { count: number; totalTx: number; totalRx: number }>();
    for (const s of slices) {
      const name = s.tenant?.name || 'Tanpa Tenant';
      const existing = grouped.get(name) || { count: 0, totalTx: 0, totalRx: 0 };
      const parseBw = (bw: string) => { const m = bw.match(/^(\d+)/); return m ? parseInt(m[1], 10) : 0; };
      existing.count += 1;
      existing.totalTx += parseBw(s.bandwidthTx);
      existing.totalRx += parseBw(s.bandwidthRx);
      grouped.set(name, existing);
    }
    return Array.from(grouped.entries()).map(([tenantName, data]) => ({ tenantName, ...data }));
  }
}

export const networkSliceRepository = new NetworkSliceRepository();
