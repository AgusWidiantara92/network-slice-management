import 'dotenv/config';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';

async function main() {
  console.log('🌱 Seeding database...');

  // ---- Seed Admin Users ----
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.admin.upsert({
    where: { email: 'admin@nsm.local' },
    update: {},
    create: {
      email: 'admin@nsm.local',
      name: 'Super Admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  const operator = await prisma.admin.upsert({
    where: { email: 'operator@nsm.local' },
    update: {},
    create: {
      email: 'operator@nsm.local',
      name: 'Network Operator',
      password: hashedPassword,
      role: 'OPERATOR',
    },
  });

  const viewer = await prisma.admin.upsert({
    where: { email: 'viewer@nsm.local' },
    update: {},
    create: {
      email: 'viewer@nsm.local',
      name: 'Read-Only Viewer',
      password: hashedPassword,
      role: 'VIEWER',
    },
  });

  console.log('✅ Admin users seeded:', { admin: admin.email, operator: operator.email, viewer: viewer.email });

  // ---- Seed Default LLM Provider (Mock) ----
  const mockProvider = await prisma.lLMProvider.upsert({
    where: { name: 'Mock Provider' },
    update: {},
    create: {
      name: 'Mock Provider',
      provider: 'MOCK',
      modelName: 'regex-parser-v1',
      isActive: true,
    },
  });

  console.log('✅ LLM Provider seeded:', mockProvider.name);

  // ---- Seed Default Configuration Template ----
  const defaultTemplate = await prisma.configurationTemplate.upsert({
    where: { name: 'Basic Slice Template' },
    update: {},
    create: {
      name: 'Basic Slice Template',
      description: 'Template dasar untuk membuat network slice dengan VLAN, IP Pool, DHCP, dan Queue.',
      content: [
        '/interface vlan add name=vlan{{VLAN_ID}} vlan-id={{VLAN_ID}} interface={{PARENT_INTERFACE}}',
        '/ip address add address={{GATEWAY}}/{{CIDR}} interface=vlan{{VLAN_ID}}',
        '/ip pool add name=pool-slice-{{SLICE_NAME}} ranges={{POOL_RANGE}}',
        '/ip dhcp-server add name=dhcp-{{SLICE_NAME}} interface=vlan{{VLAN_ID}} address-pool=pool-slice-{{SLICE_NAME}}',
        '/ip dhcp-server network add address={{NETWORK}}/{{CIDR}} gateway={{GATEWAY}} dns-server=8.8.8.8,8.8.4.4',
        '/queue simple add name=queue-{{SLICE_NAME}} target={{NETWORK}}/{{CIDR}} max-limit={{BANDWIDTH_TX}}/{{BANDWIDTH_RX}}',
      ].join('\n'),
      variables: JSON.stringify([
        'VLAN_ID',
        'PARENT_INTERFACE',
        'GATEWAY',
        'CIDR',
        'POOL_RANGE',
        'SLICE_NAME',
        'NETWORK',
        'BANDWIDTH_TX',
        'BANDWIDTH_RX',
      ]),
    },
  });

  console.log('✅ Configuration Template seeded:', defaultTemplate.name);

  // ---- Seed MikroTik Router ----
  const router = await prisma.router.upsert({
    where: { id: 'mikrotik-main-router' },
    update: {
      host: '192.168.156.2',
      port: 8728,
      username: 'web-api',
      password: 'PasswordKuat123!',
    },
    create: {
      id: 'mikrotik-main-router',
      name: 'MikroTik Main Router',
      host: '192.168.156.2',
      port: 8728,
      username: 'web-api',
      password: 'PasswordKuat123!',
      description: 'Main Router MikroTik (API 8728)',
      status: 'DISCONNECTED',
      isSimulation: false,
    },
  });

  console.log('✅ Router MikroTik seeded:', router.name, `(${router.host}:${router.port})`);

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
