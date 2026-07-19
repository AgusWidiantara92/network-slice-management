import { configurationTemplateRepository } from '@/repositories/configuration-template.repository';
import { networkSliceRepository } from '@/repositories/network-slice.repository';

export interface CreateTemplateInput {
  name: string;
  description?: string;
  content: string;
  variables?: string;
  defaultVlanId?: number;
  defaultVrfName?: string;
  defaultSubnet?: string;
  defaultGateway?: string;
  defaultBandwidth?: string;
  firewallProfile?: string;
  qosProfile?: string;
  status?: string;
}

export class ConfigurationTemplateService {
  async getTemplates(params: { search?: string; status?: string; sortBy?: string; sortOrder?: 'asc' | 'desc'; page?: number; limit?: number }) {
    return configurationTemplateRepository.findManyWithFilters(params);
  }

  async getTemplateById(id: string) {
    const template = await configurationTemplateRepository.findById(id);
    if (!template) throw new Error('Template tidak ditemukan.');
    return template;
  }

  async createTemplate(data: CreateTemplateInput) {
    const existing = await configurationTemplateRepository.findByName(data.name);
    if (existing) throw new Error('Nama template sudah digunakan.');

    return configurationTemplateRepository.create({
      name: data.name,
      description: data.description || null,
      content: data.content || '',
      variables: data.variables || null,
      defaultVlanId: data.defaultVlanId ?? null,
      defaultVrfName: data.defaultVrfName || null,
      defaultSubnet: data.defaultSubnet || null,
      defaultGateway: data.defaultGateway || null,
      defaultBandwidth: data.defaultBandwidth || null,
      firewallProfile: data.firewallProfile || null,
      qosProfile: data.qosProfile || null,
      status: data.status || 'ACTIVE',
    });
  }

  async updateTemplate(id: string, data: Partial<CreateTemplateInput>) {
    const template = await configurationTemplateRepository.findById(id);
    if (!template) throw new Error('Template tidak ditemukan.');

    if (data.name && data.name !== template.name) {
      const existing = await configurationTemplateRepository.findByName(data.name);
      if (existing) throw new Error('Nama template sudah digunakan.');
    }

    return configurationTemplateRepository.update(id, data);
  }

  async deleteTemplate(id: string) {
    const template = await configurationTemplateRepository.findById(id);
    if (!template) throw new Error('Template tidak ditemukan.');
    return configurationTemplateRepository.delete(id);
  }

  /**
   * Clone an existing template.
   */
  async cloneTemplate(id: string) {
    const template = await configurationTemplateRepository.findById(id);
    if (!template) throw new Error('Template asal tidak ditemukan.');

    let newName = `${template.name} (Copy)`;
    let counter = 1;
    let existing = await configurationTemplateRepository.findByName(newName);
    
    while (existing) {
      newName = `${template.name} (Copy ${counter})`;
      existing = await configurationTemplateRepository.findByName(newName);
      counter++;
    }

    return configurationTemplateRepository.create({
      name: newName,
      description: template.description,
      content: template.content,
      variables: template.variables,
      defaultVlanId: template.defaultVlanId,
      defaultVrfName: template.defaultVrfName,
      defaultSubnet: template.defaultSubnet,
      defaultGateway: template.defaultGateway,
      defaultBandwidth: template.defaultBandwidth,
      firewallProfile: template.firewallProfile,
      qosProfile: template.qosProfile,
      status: template.status,
    });
  }

  /**
   * Apply template parameters to a new Network Slice.
   */
  async applyTemplate(id: string, tenantId: string, routerId: string, sliceName: string) {
    const template = await configurationTemplateRepository.findById(id);
    if (!template) throw new Error('Template tidak ditemukan.');

    // Default configuration parsing
    const vlanId = template.defaultVlanId ?? 100;
    const vrfName = template.defaultVrfName || `vrf_${sliceName.toLowerCase()}`;
    const subnet = template.defaultSubnet || '192.168.100.0/24';
    const gateway = template.defaultGateway || '192.168.100.1';
    const bandwidth = template.defaultBandwidth || '10M';
    
    // Check VLAN conflict on router
    const existingVlan = await networkSliceRepository.findByVlanOnRouter(vlanId, routerId);
    if (existingVlan) {
      throw new Error(`VLAN ID ${vlanId} dari template berkonflik di router target.`);
    }

    // Check VRF conflict
    const existingVrf = await networkSliceRepository.findByVrfName(vrfName);
    if (existingVrf) {
      throw new Error(`VRF Name "${vrfName}" dari template berkonflik di database.`);
    }

    // Save configuration slice to database
    return networkSliceRepository.create({
      name: sliceName,
      vlanId,
      vrfName,
      subnet,
      gateway,
      bandwidthTx: bandwidth,
      bandwidthRx: bandwidth,
      firewallProfile: template.firewallProfile || 'standard',
      isolated: true,
      status: 'ACTIVE',
      router: { connect: { id: routerId } },
      tenant: { connect: { id: tenantId } },
    });
  }

  /**
   * Export template to JSON format.
   */
  async exportTemplate(id: string): Promise<string> {
    const template = await configurationTemplateRepository.findById(id);
    if (!template) throw new Error('Template tidak ditemukan.');

    const exportData = {
      name: template.name,
      description: template.description,
      content: template.content,
      defaultVlanId: template.defaultVlanId,
      defaultVrfName: template.defaultVrfName,
      defaultSubnet: template.defaultSubnet,
      defaultGateway: template.defaultGateway,
      defaultBandwidth: template.defaultBandwidth,
      firewallProfile: template.firewallProfile,
      qosProfile: template.qosProfile,
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import template from JSON format.
   */
  async importTemplate(jsonString: string) {
    try {
      const data = JSON.parse(jsonString);
      
      if (!data.name || !data.content) {
        throw new Error('Format file tidak valid. Field name dan content wajib ada.');
      }

      return this.createTemplate({
        name: data.name,
        description: data.description,
        content: data.content,
        defaultVlanId: data.defaultVlanId,
        defaultVrfName: data.defaultVrfName,
        defaultSubnet: data.defaultSubnet,
        defaultGateway: data.defaultGateway,
        defaultBandwidth: data.defaultBandwidth,
        firewallProfile: data.firewallProfile,
        qosProfile: data.qosProfile,
        status: 'ACTIVE',
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Format JSON tidak valid.';
      throw new Error(`Gagal impor template: ${msg}`);
    }
  }
}

export const configurationTemplateService = new ConfigurationTemplateService();
