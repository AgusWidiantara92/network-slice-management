import { schedulerRepository } from '@/repositories/scheduler.repository';
import type { SchedulerFilterParams } from '@/repositories/scheduler.repository';
import { cronService } from './cron.service';
import { auditLogRepository } from '@/repositories/audit-log.repository';
import { schedulerSchema } from '@/validators/scheduler.schema';

export class SchedulerService {
  async getSchedulers(params: SchedulerFilterParams) {
    return schedulerRepository.findManyWithFilters(params);
  }

  async getSchedulerById(id: string) {
    const scheduler = await schedulerRepository.findById(id);
    if (!scheduler) throw new Error('Scheduler tidak ditemukan.');
    return scheduler;
  }

  async createScheduler(data: unknown, operatorEmail: string = 'System') {
    // 1. Validate inputs using Zod
    const validated = schedulerSchema.parse(data);

    // 2. Compute first nextRun time
    const nextRun = cronService.getNextRunTime({
      repeatType: validated.repeatType,
      expression: validated.expression,
      executionTime: validated.executionTime,
    });

    // 3. Create schedule in database
    const scheduler = await schedulerRepository.create({
      name: validated.name,
      description: validated.description || null,
      action: validated.action,
      repeatType: validated.repeatType,
      expression: validated.expression || null,
      executionTime: validated.executionTime ? new Date(validated.executionTime) : null,
      status: validated.status || 'SCHEDULED',
      nextRun,
      tenant: { connect: { id: validated.tenantId } },
      router: { connect: { id: validated.routerId } },
      slice: { connect: { id: validated.sliceId } },
    });

    // 4. Log Audit Log
    await auditLogRepository.create({
      userEmail: operatorEmail,
      action: scheduler.action,
      description: `Membuat scheduler baru "${scheduler.name}" dengan tipe pengulangan ${scheduler.repeatType}.`,
      routerId: scheduler.routerId || undefined,
      status: 'SUCCESS',
    });

    return scheduler;
  }

  async updateScheduler(id: string, data: unknown, operatorEmail: string = 'System') {
    const existing = await schedulerRepository.findById(id);
    if (!existing) throw new Error('Scheduler tidak ditemukan.');

    // 1. Partial validate with Zod
    const validated = schedulerSchema.partial().parse(data);

    // 2. Determine if next run time needs recalculation
    const timeFieldsChanged =
      (validated.repeatType !== undefined && validated.repeatType !== existing.repeatType) ||
      (validated.expression !== undefined && validated.expression !== existing.expression) ||
      (validated.executionTime !== undefined &&
        (validated.executionTime ? new Date(validated.executionTime).getTime() : 0) !==
          (existing.executionTime ? existing.executionTime.getTime() : 0));

    let nextRun = existing.nextRun;
    if (timeFieldsChanged && existing.status === 'SCHEDULED') {
      nextRun = cronService.getNextRunTime({
        repeatType: validated.repeatType || existing.repeatType,
        expression: validated.expression !== undefined ? validated.expression : existing.expression,
        executionTime: validated.executionTime !== undefined ? validated.executionTime : existing.executionTime,
      });
    }

    // 3. Prepare prisma updates
    const updateData: Record<string, unknown> = {
      name: validated.name,
      description: validated.description,
      action: validated.action,
      repeatType: validated.repeatType,
      expression: validated.expression,
      status: validated.status,
      executionTime: validated.executionTime ? new Date(validated.executionTime) : undefined,
      nextRun,
    };

    if (validated.tenantId) updateData.tenant = { connect: { id: validated.tenantId } };
    if (validated.routerId) updateData.router = { connect: { id: validated.routerId } };
    if (validated.sliceId) updateData.slice = { connect: { id: validated.sliceId } };

    const scheduler = await schedulerRepository.update(id, updateData);

    // 4. Log Audit Log
    await auditLogRepository.create({
      userEmail: operatorEmail,
      action: scheduler.action,
      description: `Memperbarui scheduler "${scheduler.name}".`,
      routerId: scheduler.routerId || undefined,
      status: 'SUCCESS',
    });

    return scheduler;
  }

  async deleteScheduler(id: string, operatorEmail: string = 'System') {
    const existing = await schedulerRepository.findById(id);
    if (!existing) throw new Error('Scheduler tidak ditemukan.');

    const scheduler = await schedulerRepository.delete(id);

    // Audit Log
    await auditLogRepository.create({
      userEmail: operatorEmail,
      action: scheduler.action,
      description: `Menghapus scheduler "${scheduler.name}".`,
      routerId: scheduler.routerId || undefined,
      status: 'SUCCESS',
    });

    return scheduler;
  }

  async enableScheduler(id: string, operatorEmail: string = 'System') {
    const existing = await schedulerRepository.findById(id);
    if (!existing) throw new Error('Scheduler tidak ditemukan.');

    // Calculate next run
    const nextRun = cronService.getNextRunTime({
      repeatType: existing.repeatType,
      expression: existing.expression,
      executionTime: existing.executionTime,
    });

    const scheduler = await schedulerRepository.update(id, {
      status: 'SCHEDULED',
      nextRun,
    });

    // Audit Log
    await auditLogRepository.create({
      userEmail: operatorEmail,
      action: scheduler.action,
      description: `Mengaktifkan scheduler "${scheduler.name}".`,
      routerId: scheduler.routerId || undefined,
      status: 'SUCCESS',
    });

    return scheduler;
  }

  async disableScheduler(id: string, operatorEmail: string = 'System') {
    const existing = await schedulerRepository.findById(id);
    if (!existing) throw new Error('Scheduler tidak ditemukan.');

    const scheduler = await schedulerRepository.update(id, {
      status: 'CANCELLED',
      nextRun: null, // clear next run
    });

    // Audit Log
    await auditLogRepository.create({
      userEmail: operatorEmail,
      action: scheduler.action,
      description: `Menonaktifkan scheduler "${scheduler.name}".`,
      routerId: scheduler.routerId || undefined,
      status: 'SUCCESS',
    });

    return scheduler;
  }
}

export const schedulerService = new SchedulerService();
