import { prisma } from '@/lib/prisma';
import { Prisma, ConfigurationTemplate } from '@prisma/client';

export class TemplateRepository {
  async findAll(): Promise<ConfigurationTemplate[]> {
    return prisma.configurationTemplate.findMany({
      orderBy: { createdAt: 'desc' },
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

export const templateRepository = new TemplateRepository();
