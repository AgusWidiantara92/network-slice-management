import { routerRepository } from '@/repositories/router.repository';
import { routerOSService } from '@/services/routeros.service';
import type { RouterFilterParams } from '@/repositories/router.repository';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export class RouterService {
  async getRouters(params: RouterFilterParams) {
    return routerRepository.findManyWithFilters(params);
  }

  async getRouterById(id: string) {
    const router = await routerRepository.findById(id);
    if (!router) throw new Error('Router tidak ditemukan.');
    return router;
  }

  async createRouter(data: { name: string; host: string; port?: number; username: string; password: string; description?: string; isSimulation?: boolean }) {
    const existing = await routerRepository.findByName(data.name);
    if (existing) throw new Error('Nama router sudah digunakan.');
    return routerRepository.create({
      name: data.name, host: data.host, port: data.port || 8728,
      username: data.username, password: data.password,
      description: data.description || null, isSimulation: data.isSimulation || false,
    });
  }

  async updateRouter(id: string, data: { name?: string; host?: string; port?: number; username?: string; password?: string; description?: string; isSimulation?: boolean }) {
    const router = await routerRepository.findById(id);
    if (!router) throw new Error('Router tidak ditemukan.');
    if (data.name && data.name !== router.name) {
      const existing = await routerRepository.findByName(data.name);
      if (existing) throw new Error('Nama router sudah digunakan.');
    }
    return routerRepository.update(id, data);
  }

  async deleteRouter(id: string) {
    const router = await routerRepository.findById(id);
    if (!router) throw new Error('Router tidak ditemukan.');
    if (router._count.slices > 0) throw new Error(`Router "${router.name}" masih memiliki ${router._count.slices} network slice. Hapus semua slice terlebih dahulu.`);
    return routerRepository.delete(id);
  }

  async testConnection(id: string) {
    const router = await routerRepository.findById(id);
    if (!router) throw new Error('Router tidak ditemukan.');
    const success = await routerOSService.testConnection({ host: router.host, port: router.port, username: router.username, password: router.password, isSimulation: router.isSimulation });
    await routerRepository.update(id, { status: success ? 'CONNECTED' : 'DISCONNECTED', lastSync: success ? new Date() : undefined });
    return { success, status: success ? 'CONNECTED' : 'DISCONNECTED' };
  }

  async syncInfo(id: string) {
    const router = await routerRepository.findById(id);
    if (!router) throw new Error('Router tidak ditemukan.');
    const [resource, identity] = await Promise.all([
      routerOSService.getSystemResource({ host: router.host, port: router.port, username: router.username, password: router.password, isSimulation: router.isSimulation }),
      routerOSService.getIdentity({ host: router.host, port: router.port, username: router.username, password: router.password, isSimulation: router.isSimulation }),
    ]);
    const memUsage = resource.totalMemory > 0 ? Math.round(((resource.totalMemory - resource.freeMemory) / resource.totalMemory) * 100) : 0;
    await routerRepository.update(id, {
      status: 'CONNECTED', cpuUsage: resource.cpuLoad, memoryUsage: memUsage,
      routerosVersion: resource.version, uptime: resource.uptime, architecture: resource.architecture,
      boardName: resource.boardName, totalMemory: formatBytes(resource.totalMemory), freeMemory: formatBytes(resource.freeMemory),
      lastSync: new Date(), name: identity.name !== 'unknown' ? identity.name : router.name,
    });
    return { identity: identity.name, resource, memoryUsagePercent: memUsage };
  }
}

export const routerService = new RouterService();
