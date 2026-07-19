import { networkSliceRepository } from '@/repositories/network-slice.repository';
import type { SliceFilterParams } from '@/repositories/network-slice.repository';

interface CreateSliceData {
  name: string; routerId: string; tenantId?: string;
  vlanId?: number; vrfName?: string; subnet?: string; gateway?: string;
  bandwidthTx: string; bandwidthRx: string; firewallProfile?: string;
  isolated?: boolean; status?: string;
}

export class NetworkSliceService {
  async getSlices(params: SliceFilterParams) {
    return networkSliceRepository.findManyWithFilters(params);
  }

  async getSliceById(id: string) {
    const slice = await networkSliceRepository.findById(id);
    if (!slice) throw new Error('Network Slice tidak ditemukan.');
    return slice;
  }

  async createSlice(data: CreateSliceData) {
    // Validate VLAN uniqueness on the same router
    if (data.vlanId !== undefined && data.vlanId !== null) {
      if (data.vlanId < 1 || data.vlanId > 4094) throw new Error('VLAN ID harus antara 1-4094.');
      const existingVlan = await networkSliceRepository.findByVlanOnRouter(data.vlanId, data.routerId);
      if (existingVlan) throw new Error(`VLAN ID ${data.vlanId} sudah digunakan pada router ini.`);
    }

    // Validate VRF uniqueness
    if (data.vrfName) {
      const existingVrf = await networkSliceRepository.findByVrfName(data.vrfName);
      if (existingVrf) throw new Error(`VRF Name "${data.vrfName}" sudah digunakan.`);
    }

    return networkSliceRepository.create({
      name: data.name,
      vlanId: data.vlanId ?? null,
      bandwidthTx: data.bandwidthTx,
      bandwidthRx: data.bandwidthRx,
      vrfName: data.vrfName || null,
      subnet: data.subnet || null,
      gateway: data.gateway || null,
      firewallProfile: data.firewallProfile || null,
      isolated: data.isolated ?? true,
      status: data.status || 'ACTIVE',
      router: { connect: { id: data.routerId } },
      tenant: data.tenantId ? { connect: { id: data.tenantId } } : undefined,
    });
  }

  async updateSlice(id: string, data: Partial<CreateSliceData>) {
    const slice = await networkSliceRepository.findById(id);
    if (!slice) throw new Error('Network Slice tidak ditemukan.');

    const routerId = data.routerId || slice.routerId;

    if (data.vlanId !== undefined && data.vlanId !== null) {
      if (data.vlanId < 1 || data.vlanId > 4094) throw new Error('VLAN ID harus antara 1-4094.');
      const existingVlan = await networkSliceRepository.findByVlanOnRouter(data.vlanId, routerId, id);
      if (existingVlan) throw new Error(`VLAN ID ${data.vlanId} sudah digunakan pada router ini.`);
    }

    if (data.vrfName && data.vrfName !== slice.vrfName) {
      const existingVrf = await networkSliceRepository.findByVrfName(data.vrfName, id);
      if (existingVrf) throw new Error(`VRF Name "${data.vrfName}" sudah digunakan.`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = { ...data };
    if (data.routerId) { updateData.router = { connect: { id: data.routerId } }; delete updateData.routerId; }
    if (data.tenantId) { updateData.tenant = { connect: { id: data.tenantId } }; delete updateData.tenantId; }
    else if (data.tenantId === null) { updateData.tenant = { disconnect: true }; delete updateData.tenantId; }

    return networkSliceRepository.update(id, updateData);
  }

  async deleteSlice(id: string) {
    const slice = await networkSliceRepository.findById(id);
    if (!slice) throw new Error('Network Slice tidak ditemukan.');
    return networkSliceRepository.delete(id);
  }
}

export const networkSliceService = new NetworkSliceService();
