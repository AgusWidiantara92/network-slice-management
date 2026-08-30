import { schedulerRepository } from '@/repositories/scheduler.repository';
import { auditLogRepository } from '@/repositories/audit-log.repository';
import { cronService } from './cron.service';
import { sleep } from '@/utils/helpers';

export class ExecutionService {
  /**
   * Run a scheduler task immediately (manually or automatically).
   */
  async execute(schedulerId: string, triggerBy: string = 'System'): Promise<void> {
    const scheduler = await schedulerRepository.findById(schedulerId);
    if (!scheduler) {
      throw new Error(`Scheduler dengan ID ${schedulerId} tidak ditemukan.`);
    }

    if (scheduler.status === 'RUNNING') {
      console.log(`[Scheduler] ${scheduler.name} sedang berjalan. Melewati eksekusi.`);
      return;
    }

    console.log(`[Scheduler] Memulai eksekusi ${scheduler.name} (${scheduler.action})...`);

    // 1. Update status to RUNNING
    await schedulerRepository.update(schedulerId, {
      status: 'RUNNING',
    });

    // 2. Log initial execution to Audit Log
    await auditLogRepository.create({
      userEmail: triggerBy,
      action: scheduler.action,
      description: `[Scheduler RUNNING] Menjalankan jadwal "${scheduler.name}" secara otomatis/manual.`,
      routerId: scheduler.routerId || undefined,
      status: 'SUCCESS',
    });

    try {
      // 3. Simulate processing time
      await sleep(1500);

      // Simulation success
      const now = new Date();
      
      // Calculate next run time
      let nextRun: Date | null = null;
      let nextStatus = 'COMPLETED';

      if (scheduler.repeatType !== 'ONE_TIME') {
        nextRun = cronService.getNextRunTime({
          repeatType: scheduler.repeatType,
          expression: scheduler.expression,
          executionTime: scheduler.executionTime,
        });
        // If there's a next run, we set status back to SCHEDULED
        nextStatus = nextRun ? 'SCHEDULED' : 'COMPLETED';
      }

      // 4. Update Scheduler record
      await schedulerRepository.update(schedulerId, {
        status: nextStatus,
        lastRun: now,
        nextRun: nextRun,
      });

      // 5. Log completion to Audit Log
      await auditLogRepository.create({
        userEmail: triggerBy,
        action: scheduler.action,
        description: `[Scheduler COMPLETED] Jadwal "${scheduler.name}" berhasil dijalankan. Target Router: ${scheduler.router?.name || '-'}, Slice: ${scheduler.slice?.name || '-'}.`,
        routerId: scheduler.routerId || undefined,
        status: 'SUCCESS',
      });

      console.log(`[Scheduler] Eksekusi ${scheduler.name} selesai dengan sukses.`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Kesalahan tidak dikenal';
      console.error(`[Scheduler] Eksekusi ${scheduler.name} gagal:`, errorMsg);

      const now = new Date();
      // On failure, recurring schedules should still reschedule if possible
      let nextRun: Date | null = null;
      let nextStatus = 'FAILED';

      if (scheduler.repeatType !== 'ONE_TIME') {
        nextRun = cronService.getNextRunTime({
          repeatType: scheduler.repeatType,
          expression: scheduler.expression,
          executionTime: scheduler.executionTime,
        });
        nextStatus = nextRun ? 'SCHEDULED' : 'FAILED';
      }

      // Update Scheduler record with failed status and recalculate
      await schedulerRepository.update(schedulerId, {
        status: nextStatus,
        lastRun: now,
        nextRun: nextRun,
      });

      // Log failure to Audit Log
      await auditLogRepository.create({
        userEmail: triggerBy,
        action: scheduler.action,
        description: `[Scheduler FAILED] Jadwal "${scheduler.name}" gagal dieksekusi: ${errorMsg}.`,
        routerId: scheduler.routerId || undefined,
        status: 'FAILED',
      });
    }
  }
}

export const executionService = new ExecutionService();
