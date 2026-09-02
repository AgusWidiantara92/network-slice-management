import { prisma } from '@/lib/prisma';

export interface SliceOrchestrationInput {
  sliceId?: string;
  name: string;
  routerId: string;
  tenantId?: string | null;
  vlanId?: number | null;
  vrfName?: string | null;
  subnet?: string | null;
  gateway?: string | null;
  bandwidthTx: string;
  bandwidthRx: string;
  firewallProfile?: string | null;
  isolated?: boolean;
  status?: string;
}

export interface OrchestrationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedConfig: SliceOrchestrationInput;
}

export class OrchestratorService {
  /**
   * Main entry point for Layer 1 (Request Preprocessing) & Layer 3 (Decision & Validation Engine)
   */
  static async validateAndOrchestrate(input: SliceOrchestrationInput): Promise<OrchestrationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Layer 1: Request Preprocessing & Normalization
    const sanitizedConfig: SliceOrchestrationInput = {
      sliceId: input.sliceId,
      name: input.name?.trim() || 'Slice-Default',
      routerId: input.routerId,
      tenantId: input.tenantId || null,
      vlanId: input.vlanId !== undefined && input.vlanId !== null ? Number(input.vlanId) : null,
      vrfName: input.vrfName?.trim() ? input.vrfName.trim().toLowerCase().replace(/\s+/g, '_') : null,
      subnet: input.subnet?.trim() || null,
      gateway: input.gateway?.trim() || null,
      bandwidthTx: this.normalizeBandwidth(input.bandwidthTx),
      bandwidthRx: this.normalizeBandwidth(input.bandwidthRx),
      firewallProfile: input.firewallProfile || 'standard',
      isolated: input.isolated ?? true,
      status: input.status || 'ACTIVE',
    };

    // 2. Layer 3: Rule-Based Validation
    if (!sanitizedConfig.routerId) {
      errors.push('Router ID wajib ditentukan.');
    }

    if (sanitizedConfig.vlanId !== null) {
      if (sanitizedConfig.vlanId < 1 || sanitizedConfig.vlanId > 4094) {
        errors.push('VLAN ID harus berada di rentang 1 - 4094.');
      }
    }

    if (sanitizedConfig.subnet && !this.isValidCidr(sanitizedConfig.subnet)) {
      errors.push(`Format Subnet CIDR "${sanitizedConfig.subnet}" tidak valid (contoh: 192.168.10.0/24).`);
    }

    if (sanitizedConfig.gateway && !this.isValidIp(sanitizedConfig.gateway)) {
      errors.push(`Format Gateway IP "${sanitizedConfig.gateway}" tidak valid (contoh: 192.168.10.1).`);
    }

    if (errors.length > 0) {
      return { valid: false, errors, warnings, sanitizedConfig };
    }

    // 3. Layer 3: Real-Time Conflict Detection Engine (Database Conflict Verification)
    const existingSlices = await prisma.networkSlice.findMany({
      where: {
        routerId: sanitizedConfig.routerId,
        ...(sanitizedConfig.sliceId ? { NOT: { id: sanitizedConfig.sliceId } } : {}),
      },
      include: {
        tenant: true,
      },
    });

    for (const slice of existingSlices) {
      const tenantLabel = slice.tenant?.name ? `Tenant "${slice.tenant.name}"` : `Slice "${slice.name}"`;

      // VLAN ID Conflict Check
      if (sanitizedConfig.vlanId !== null && slice.vlanId === sanitizedConfig.vlanId) {
        errors.push(`Konflik VLAN ID: VLAN ${sanitizedConfig.vlanId} sudah digunakan oleh ${tenantLabel} pada router ini.`);
      }

      // VRF Name Conflict Check
      if (
        sanitizedConfig.vrfName &&
        slice.vrfName &&
        slice.vrfName.toLowerCase() === sanitizedConfig.vrfName.toLowerCase()
      ) {
        errors.push(`Konflik VRF Name: Nama VRF "${sanitizedConfig.vrfName}" sudah digunakan oleh ${tenantLabel}.`);
      }

      // Gateway IP Collision Check
      if (sanitizedConfig.gateway && slice.gateway === sanitizedConfig.gateway) {
        errors.push(`Konflik Gateway IP: Alamat IP Gateway ${sanitizedConfig.gateway} sudah terpakai oleh ${tenantLabel}.`);
      }

      // Subnet CIDR Overlap Check
      if (sanitizedConfig.subnet && slice.subnet) {
        if (this.checkSubnetOverlap(sanitizedConfig.subnet, slice.subnet)) {
          errors.push(
            `Konflik IP Subnet: Subnet ${sanitizedConfig.subnet} tumpang tindih (overlap) dengan subnet ${slice.subnet} milik ${tenantLabel}.`
          );
        }
      }
    }

    // 4. Warning Check (Best practice guidance)
    if (sanitizedConfig.vlanId === 1) {
      warnings.push('VLAN ID 1 adalah default management VLAN MikroTik. Disarankan menggunakan VLAN ID > 10.');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      sanitizedConfig,
    };
  }

  /**
   * Format bandwidth string to standard MikroTik format (e.g. 10M, 512K, 1G)
   */
  private static normalizeBandwidth(bw?: string): string {
    if (!bw) return '10M';
    const clean = bw.trim().toUpperCase();
    if (/^\d+$/.test(clean)) return `${clean}M`; // default to M if plain number
    return clean;
  }

  /**
   * Validate CIDR notation (e.g. 192.168.1.0/24)
   */
  private static isValidCidr(cidr: string): boolean {
    const cidrRegex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/([0-9]|[1-2][0-9]|3[0-2])$/;
    return cidrRegex.test(cidr);
  }

  /**
   * Validate IPv4 format
   */
  private static isValidIp(ip: string): boolean {
    const ipRegex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  }

  /**
   * Calculate IP address to 32-bit unsigned integer
   */
  private static ipToLong(ip: string): number {
    return ip
      .split('.')
      .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  }

  /**
   * Convert CIDR string to start & end 32-bit integer range
   */
  private static cidrToRange(cidr: string): { start: number; end: number } | null {
    try {
      const [ip, prefixStr] = cidr.split('/');
      const prefix = parseInt(prefixStr, 10);
      const ipLong = this.ipToLong(ip);
      const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
      const start = (ipLong & mask) >>> 0;
      const end = (start | ~mask) >>> 0;
      return { start, end };
    } catch {
      return null;
    }
  }

  /**
   * Check if two CIDR subnets overlap
   */
  private static checkSubnetOverlap(cidrA: string, cidrB: string): boolean {
    const rangeA = this.cidrToRange(cidrA);
    const rangeB = this.cidrToRange(cidrB);

    if (!rangeA || !rangeB) return false;

    // Overlap condition: startA <= endB && startB <= endA
    return rangeA.start <= rangeB.end && rangeB.start <= rangeA.end;
  }
}
