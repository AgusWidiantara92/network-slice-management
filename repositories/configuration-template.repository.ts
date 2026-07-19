import { prisma } from '@/lib/prisma';
import { Prisma, ConfigurationTemplate } from '@prisma/client';

export interface TemplateFilterParams {
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export class ConfigurationTemplateRepository {
  async findManyWithFilters(params: TemplateFilterParams): Promise<{
    data: ConfigurationTemplate[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { search, status, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 10 } = params;
    const where: Prisma.ConfigurationTemplateWhereInput = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      prisma.configurationTemplate.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.configurationTemplate.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findAll(): Promise<ConfigurationTemplate[]> {
    return prisma.configurationTemplate.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<ConfigurationTemplate | null> {
    return prisma.configurationTemplate.findUnique({
      where: { id },
    });
  }

  async findByName(name: string): Promise<ConfigurationTemplate | null> {
    return prisma.configurationTemplate.findUnique({
      where: { name },
    });
  }

  async create(data: Prisma.ConfigurationTemplateCreateInput): Promise<ConfigurationTemplate> {
    return prisma.configurationTemplate.create({ data });
  }

  async update(id: string, data: Prisma.ConfigurationTemplateUpdateInput): Promise<ConfigurationTemplate> {
    return prisma.configurationTemplate.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<ConfigurationTemplate> {
    return prisma.configurationTemplate.delete({
      where: { id },
    });
  }

  async count(): Promise<number> {
    return prisma.configurationTemplate.count();
  }
}

export const configurationTemplateRepository = new ConfigurationTemplateRepository();
