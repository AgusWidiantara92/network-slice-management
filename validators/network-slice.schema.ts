import { z } from 'zod';

// Helper to check if IP is valid IPv4
const ipv4Regex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
// Helper to check if Subnet is valid CIDR (IPv4)
const cidrRegex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/([0-9]|[1-2][0-9]|3[0-2])$/;

// Helper to convert IP to a 32-bit integer for range check
function ipToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

// Check if gateway IP is in the subnet
function isIpInSubnet(ip: string, subnetCidr: string): boolean {
  try {
    const [subnetIp, maskStr] = subnetCidr.split('/');
    const mask = parseInt(maskStr, 10);
    
    if (mask === 0) return true;
    
    const ipVal = ipToInt(ip);
    const subnetVal = ipToInt(subnetIp);
    
    // Create subnet mask bitwise representation
    const maskVal = (0xffffffff << (32 - mask)) >>> 0;
    
    return (ipVal & maskVal) === (subnetVal & maskVal);
  } catch {
    return false;
  }
}

export const networkSliceSchema = z.object({
  name: z.string().min(3, 'Nama slice minimal 3 karakter').max(100, 'Nama slice maksimal 100 karakter'),
  tenantId: z.string().min(1, 'Tenant wajib dipilih'),
  routerId: z.string().min(1, 'Router wajib dipilih'),
  vlanId: z.number().int().min(1, 'VLAN ID minimal 1').max(4094, 'VLAN ID maksimal 4094'),
  vrfName: z.string().min(2, 'Nama VRF minimal 2 karakter').max(50),
  subnet: z.string().regex(cidrRegex, 'Subnet harus berupa format CIDR valid (contoh: 192.168.10.0/24)'),
  gateway: z.string().regex(ipv4Regex, 'Gateway harus berupa IP Address valid (contoh: 192.168.10.1)'),
  bandwidthTx: z.string().regex(/^\d+[M|G|K]?$/, 'Format Bandwidth Upload salah (contoh: 10M, 1G)'),
  bandwidthRx: z.string().regex(/^\d+[M|G|K]?$/, 'Format Bandwidth Download salah (contoh: 10M, 1G)'),
  firewallProfile: z.string().min(1, 'Firewall Profile wajib dipilih'),
  isolated: z.boolean(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ERROR']),
}).refine((data) => {
  // Verify gateway is inside the subnet
  return isIpInSubnet(data.gateway, data.subnet);
}, {
  message: 'IP Gateway harus berada di dalam rentang Subnet yang ditentukan.',
  path: ['gateway'],
});

export type NetworkSliceFormData = z.infer<typeof networkSliceSchema>;
