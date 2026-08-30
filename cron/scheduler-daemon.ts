import cron from 'node-cron';
import { schedulerRepository } from '@/repositories/scheduler.repository';
import { executionService } from '@/services/execution.service';

export function startSchedulerDaemon() {
  console.log('⏰ [Scheduler Daemon] Mulai menginisialisasi runner...');

  // Run every minute: * * * * *
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    try {
      const dueSchedules = await schedulerRepository.findDueSchedules(now);

      if (dueSchedules.length > 0) {
        console.log(`⏰ [Scheduler Daemon] Menemukan ${dueSchedules.length} jadwal yang jatuh tempo.`);
        
        // Execute all of them in parallel
        await Promise.all(
          dueSchedules.map((schedule) =>
            executionService.execute(schedule.id, 'System Daemon').catch((err) => {
              console.error(`⏰ [Scheduler Daemon] Gagal menjalankan scheduler ${schedule.name}:`, err);
            })
          )
        );
      }
    } catch (error) {
      console.error('⏰ [Scheduler Daemon] Kesalahan pada tick runner:', error);
    }
  });
}

// Support hot-reloading prevention in development
declare global {
  var schedulerDaemonStarted: boolean | undefined;
}

export function initScheduler() {
  if (!global.schedulerDaemonStarted) {
    startSchedulerDaemon();
    global.schedulerDaemonStarted = true;
  }
}
