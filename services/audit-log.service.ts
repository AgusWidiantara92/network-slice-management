import { auditLogRepository } from '@/repositories/audit-log.repository';
import type { AuditLogFilterParams } from '@/repositories/audit-log.repository';

export class AuditLogService {
  async getAuditLogs(params: AuditLogFilterParams) {
    return auditLogRepository.findManyWithFilters(params);
  }

  async getRecentLogs(limit: number = 10) {
    return auditLogRepository.findRecent(limit);
  }

  async getDistinctActions() {
    return auditLogRepository.getDistinctActions();
  }

  async getStats() {
    const total = await auditLogRepository.count();
    return { total };
  }

  async clearOldLogs(olderThanDays: number = 90) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);
    const deleted = await auditLogRepository.deleteOlderThan(cutoff);
    return { deleted, cutoffDate: cutoff.toISOString() };
  }
}

export const auditLogService = new AuditLogService();
