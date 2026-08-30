/**
 * RouterOS REST API Client
 * Supports two modes:
 * - Simulation: Returns realistic mock hardware data
 * - Real: Calls MikroTik RouterOS v7+ REST API (/rest/...)
 */

export interface RouterSystemResource {
  cpuLoad: number;
  totalMemory: number;
  freeMemory: number;
  uptime: string;
  version: string;
  architecture: string;
  boardName: string;
}

export interface RouterIdentity {
  name: string;
}

export class RouterOSClient {
  private host: string;
  private port: number;
  private username: string;
  private password: string;
  private isSimulation: boolean;

  constructor(config: {
    host: string;
    port: number;
    username: string;
    password: string;
    isSimulation: boolean;
  }) {
    this.host = config.host;
    this.port = config.port;
    this.username = config.username;
    this.password = config.password;
    this.isSimulation = config.isSimulation;
  }

  /**
   * Test if connection to the router is possible.
   */
  async testConnection(): Promise<boolean> {
    if (this.isSimulation) {
      // Simulate 95% success rate
      await new Promise((r) => setTimeout(r, 300 + Math.random() * 500));
      return Math.random() > 0.05;
    }

    try {
      const res = await this.fetchRest('/system/identity');
      return !!res;
    } catch {
      return false;
    }
  }

  /**
   * Fetch system resource info from the router.
   */
  async getSystemResource(): Promise<RouterSystemResource> {
    if (this.isSimulation) {
      await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));
      const totalMem = 256 * 1024 * 1024; // 256 MB
      const freeMem = Math.floor(totalMem * (0.4 + Math.random() * 0.35));
      return {
        cpuLoad: Math.floor(Math.random() * 30) + 3,
        totalMemory: totalMem,
        freeMemory: freeMem,
        uptime: `${Math.floor(Math.random() * 30) + 1}d${Math.floor(Math.random() * 24)}h${Math.floor(Math.random() * 60)}m`,
        version: '7.16.2',
        architecture: 'x86_64',
        boardName: 'CHR',
      };
    }

    const data = await this.fetchRest('/system/resource');
    return {
      cpuLoad: parseInt(data['cpu-load'] || '0', 10),
      totalMemory: parseInt(data['total-memory'] || '0', 10),
      freeMemory: parseInt(data['free-memory'] || '0', 10),
      uptime: data.uptime || '0s',
      version: data.version || 'unknown',
      architecture: data['architecture-name'] || 'unknown',
      boardName: data['board-name'] || 'unknown',
    };
  }

  /**
   * Fetch router identity.
   */
  async getIdentity(): Promise<RouterIdentity> {
    if (this.isSimulation) {
      await new Promise((r) => setTimeout(r, 100));
      return { name: `MikroTik-SIM-${this.host.split('.').pop()}` };
    }

    const data = await this.fetchRest('/system/identity');
    return { name: data.name || 'unknown' };
  }

  /**
   * Internal: Make a GET request to RouterOS REST API.
   */
  private async fetchRest(path: string): Promise<Record<string, string>> {
    const auth = Buffer.from(`${this.username}:${this.password}`).toString('base64');
    // If port is set to legacy API port (8728), default REST API port is 80 (www service)
    const restPort = this.port === 8728 ? 80 : this.port;
    const url = `http://${this.host}:${restPort}/rest${path}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`RouterOS REST API HTTP ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`Koneksi ke MikroTik (${this.host}:${restPort}) waktu habis (Timeout). Pastikan service 'www' (port 80) atau IP MikroTik dapat diakses.`);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }
}
