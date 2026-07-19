import { prisma } from '@/lib/prisma';
import { Prisma, NetworkSlice } from '@prisma/client';

export class SliceRepository {
  async findAll(): Promise<NetworkSlice[]> {
    return prisma.networkSlice.findMany({
      orderBy: { createdAt: 'desc' },
      include: { tenant: true, router: true },
    });
  }

  async findById(id: string): Promise<NetworkSlice | null> {
    return prisma.networkSlice.findUnique({
      where: { id },
      include: { tenant: true, router: true },
    });
  }

  async create(data: Prisma.NetworkSliceCreateInput): Promise<NetworkSlice> {
    return prisma.networkSlice.create({ data });
  }

  async update(id: string, data: Prisma.NetworkSliceUpdateInput): Promise<NetworkSlice> {
    return prisma.networkSlice.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<NetworkSlice> {
    return prisma.networkSlice.delete({
      where: { id },
    });
  }

  async count(): Promise<number> {
    return prisma.networkSlice.count();
  }

  /**
   * Count slices grouped by tenant name for the slice chart.
   */
  async countByTenant(): Promise<{ tenantName: string; count: number; totalTx: number; totalRx: number }[]> {
    const slices = await prisma.networkSlice.findMany({
      include: { tenant: true },
    });

    const grouped = new Map<string, { count: number; totalTx: number; totalRx: number }>();

    for (const slice of slices) {
      const name = slice.tenant?.name || 'Tanpa Tenant';
      const existing = grouped.get(name) || { count: 0, totalTx: 0, totalRx: 0 };

      // Parse bandwidth strings like "10M" to numeric Mbps
      const parseBw = (bw: string): number => {
        const match = bw.match(/^(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      };

      existing.count += 1;
      existing.totalTx += parseBw(slice.bandwidthTx);
      existing.totalRx += parseBw(slice.bandwidthRx);
      grouped.set(name, existing);
    }

    return Array.from(grouped.entries()).map(([tenantName, data]) => ({
      tenantName,
      ...data,
    }));
  }
}

export const sliceRepository = new SliceRepository();
