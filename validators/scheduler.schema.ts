import { z } from 'zod';
import parser from 'cron-parser';

export const schedulerSchema = z
  .object({
    name: z
      .string()
      .min(3, 'Nama scheduler minimal 3 karakter')
      .max(100, 'Nama scheduler maksimal 100 karakter'),
    description: z.string().optional().nullable(),
    tenantId: z.string().min(1, 'Tenant harus dipilih'),
    routerId: z.string().min(1, 'Router harus dipilih'),
    sliceId: z.string().min(1, 'Network slice harus dipilih'),
    action: z.enum(
      ['DEPLOY_CONFIG', 'UPDATE_CONFIG', 'DELETE_CONFIG', 'ROLLBACK_CONFIG'],
      {
        errorMap: () => ({ message: 'Aksi yang dipilih tidak valid' }),
      }
    ),
    repeatType: z.enum(
      ['ONE_TIME', 'DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM'],
      {
        errorMap: () => ({ message: 'Tipe pengulangan tidak valid' }),
      }
    ),
    executionTime: z
      .string()
      .optional()
      .nullable()
      .refine(
        (val) => {
          if (!val) return true;
          const date = new Date(val);
          return !isNaN(date.getTime()) && date.getTime() > Date.now();
        },
        {
          message: 'Waktu eksekusi harus di masa depan',
        }
      ),
    expression: z
      .string()
      .optional()
      .nullable()
      .refine(
        (val) => {
          if (!val) return true;
          try {
            parser.parseExpression(val);
            return true;
          } catch {
            return false;
          }
        },
        {
          message: 'Ekspresi cron tidak valid',
        }
      ),
    status: z
      .enum(['DRAFT', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'])
      .optional(),
  })
  .refine(
    (data) => {
      if (data.repeatType === 'ONE_TIME') {
        return !!data.executionTime;
      }
      return true;
    },
    {
      message: 'Waktu eksekusi wajib diisi jika bertipe One Time',
      path: ['executionTime'],
    }
  )
  .refine(
    (data) => {
      if (data.repeatType === 'CUSTOM') {
        return !!data.expression;
      }
      return true;
    },
    {
      message: 'Ekspresi cron wajib diisi jika bertipe Custom Cron Expression',
      path: ['expression'],
    }
  );

export type SchedulerFormData = z.infer<typeof schedulerSchema>;
