import { tenantRepository } from '@/repositories/tenant.repository';
import type { TenantFilterParams } from '@/repositories/tenant.repository';

export class TenantService {
  async getTenants(params: TenantFilterParams) {
    return tenantRepository.findManyWithFilters(params);
  }

  async getTenantById(id: string) {
    const tenant = await tenantRepository.findById(id);
    if (!tenant) throw new Error('Tenant tidak ditemukan.');
    return tenant;
  }

  async createTenant(data: { name: string; description?: string; status?: string }) {
    const existing = await tenantRepository.findByName(data.name);
    if (existing) throw new Error('Nama tenant sudah digunakan.');

    return tenantRepository.create({
      name: data.name,
      description: data.description || null,
      status: data.status || 'ACTIVE',
    });
  }

  async updateTenant(id: string, data: { name?: string; description?: string; status?: string }) {
    const tenant = await tenantRepository.findById(id);
    if (!tenant) throw new Error('Tenant tidak ditemukan.');

    if (data.name && data.name !== tenant.name) {
      const existing = await tenantRepository.findByName(data.name);
      if (existing) throw new Error('Nama tenant sudah digunakan.');
    }

    return tenantRepository.update(id, data);
  }

  async deleteTenant(id: string) {
    const tenant = await tenantRepository.findById(id);
    if (!tenant) throw new Error('Tenant tidak ditemukan.');

    if (tenant._count.slices > 0) {
      throw new Error(
        `Tenant "${tenant.name}" masih memiliki ${tenant._count.slices} network slice. Hapus semua slice terlebih dahulu.`
      );
    }

    return tenantRepository.delete(id);
  }
}

export const tenantService = new TenantService();
