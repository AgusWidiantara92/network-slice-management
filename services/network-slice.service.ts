import { networkSliceRepository } from '@/repositories/network-slice.repository';
import type { SliceFilterParams } from '@/repositories/network-slice.repository';

import { OrchestratorService } from './orchestrator.service';

export interface CreateSliceData {
  name: string;
  routerId: string;
  tenantId?: string | null;
  vlanId?: number | null;
  bandwidthTx: string;
  bandwidthRx: string;
  vrfName?: string | null;
  subnet?: string | null;
  gateway?: string | null;
  firewallProfile?: string | null;
  isolated?: boolean;
  status?: string;
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
    // Run Orchestrator Preprocessing & Conflict Detection
    const orchestration = await OrchestratorService.validateAndOrchestrate(data);
    if (!orchestration.valid) {
      throw new Error(orchestration.errors.join(' | '));
    }

    const sc = orchestration.sanitizedConfig;

    return networkSliceRepository.create({
      name: sc.name,
      vlanId: sc.vlanId ?? null,
      bandwidthTx: sc.bandwidthTx,
      bandwidthRx: sc.bandwidthRx,
      vrfName: sc.vrfName || null,
      subnet: sc.subnet || null,
      gateway: sc.gateway || null,
      firewallProfile: sc.firewallProfile || null,
      isolated: sc.isolated ?? true,
      status: sc.status || 'ACTIVE',
      router: { connect: { id: sc.routerId } },
      tenant: sc.tenantId ? { connect: { id: sc.tenantId } } : undefined,
    });
  }

  async updateSlice(id: string, data: Partial<CreateSliceData>) {
    const slice = await networkSliceRepository.findById(id);
    if (!slice) throw new Error('Network Slice tidak ditemukan.');

    const mergedData = {
      sliceId: id,
      name: data.name ?? slice.name,
      routerId: data.routerId ?? slice.routerId,
      tenantId: data.tenantId !== undefined ? data.tenantId : slice.tenantId,
      vlanId: data.vlanId !== undefined ? data.vlanId : slice.vlanId,
      vrfName: data.vrfName !== undefined ? data.vrfName : slice.vrfName,
      subnet: data.subnet !== undefined ? data.subnet : slice.subnet,
      gateway: data.gateway !== undefined ? data.gateway : slice.gateway,
      bandwidthTx: data.bandwidthTx ?? slice.bandwidthTx,
      bandwidthRx: data.bandwidthRx ?? slice.bandwidthRx,
      firewallProfile: data.firewallProfile !== undefined ? data.firewallProfile : slice.firewallProfile,
      isolated: data.isolated !== undefined ? data.isolated : slice.isolated,
      status: data.status ?? slice.status,
    };

    const orchestration = await OrchestratorService.validateAndOrchestrate(mergedData);
    if (!orchestration.valid) {
      throw new Error(orchestration.errors.join(' | '));
    }

    const sc = orchestration.sanitizedConfig;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {
      name: sc.name,
      vlanId: sc.vlanId,
      bandwidthTx: sc.bandwidthTx,
      bandwidthRx: sc.bandwidthRx,
      vrfName: sc.vrfName,
      subnet: sc.subnet,
      gateway: sc.gateway,
      firewallProfile: sc.firewallProfile,
      isolated: sc.isolated,
      status: sc.status,
    };

    if (data.routerId) { updateData.router = { connect: { id: data.routerId } }; }
    if (data.tenantId) { updateData.tenant = { connect: { id: data.tenantId } }; }
    else if (data.tenantId === null) { updateData.tenant = { disconnect: true }; }

    return networkSliceRepository.update(id, updateData);
  }

  async deleteSlice(id: string) {
    const slice = await networkSliceRepository.findById(id);
    if (!slice) throw new Error('Network Slice tidak ditemukan.');
    return networkSliceRepository.delete(id);
  }
}

export const networkSliceService = new NetworkSliceService();
