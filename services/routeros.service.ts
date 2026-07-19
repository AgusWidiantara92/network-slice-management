import { RouterOSClient } from '@/lib/routeros/routeros-client';
import type { RouterSystemResource, RouterIdentity } from '@/lib/routeros/routeros-client';

export class RouterOSService {
  async testConnection(config: { host: string; port: number; username: string; password: string; isSimulation: boolean }): Promise<boolean> {
    const client = new RouterOSClient(config);
    return client.testConnection();
  }

  async getSystemResource(config: { host: string; port: number; username: string; password: string; isSimulation: boolean }): Promise<RouterSystemResource> {
    const client = new RouterOSClient(config);
    return client.getSystemResource();
  }

  async getIdentity(config: { host: string; port: number; username: string; password: string; isSimulation: boolean }): Promise<RouterIdentity> {
    const client = new RouterOSClient(config);
    return client.getIdentity();
  }
}

export const routerOSService = new RouterOSService();
