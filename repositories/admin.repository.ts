import { prisma } from '@/lib/prisma';
import { Prisma, Admin } from '@prisma/client';

export class AdminRepository {
  async findByEmail(email: string): Promise<Admin | null> {
    return prisma.admin.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<Admin | null> {
    return prisma.admin.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.AdminCreateInput): Promise<Admin> {
    return prisma.admin.create({
      data,
    });
  }

  async update(id: string, data: Prisma.AdminUpdateInput): Promise<Admin> {
    return prisma.admin.update({
      where: { id },
      data,
    });
  }
}

export const adminRepository = new AdminRepository();
