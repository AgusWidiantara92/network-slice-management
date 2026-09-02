import { CronExpressionParser } from 'cron-parser';

export class CronService {
  /**
   * Validates if a string is a valid 5-field cron expression.
   */
  isValidCron(expression: string): boolean {
    try {
      CronExpressionParser.parse(expression);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generates a cron expression for standard repeat types based on a base execution date/time.
   */
  generateCronFromBase(repeatType: string, baseTime: Date): string {
    const min = baseTime.getMinutes();
    const hour = baseTime.getHours();
    const date = baseTime.getDate();
    const day = baseTime.getDay(); // 0 is Sunday, 6 is Saturday

    switch (repeatType) {
      case 'DAILY':
        return `${min} ${hour} * * *`;
      case 'WEEKLY':
        return `${min} ${hour} * * ${day}`;
      case 'MONTHLY':
        return `${min} ${hour} ${date} * *`;
      default:
        throw new Error(`Tipe pengulangan ${repeatType} tidak mendukung generator cron otomatis.`);
    }
  }

  /**
   * Computes the next run time for a scheduler.
   * If the calculated next run is in the past, it finds the next future occurrence.
   */
  getNextRunTime(params: {
    repeatType: string;
    expression?: string | null;
    executionTime?: Date | string | null;
  }): Date | null {
    const { repeatType, expression, executionTime } = params;

    if (repeatType === 'ONE_TIME') {
      if (!executionTime) return null;
      const date = new Date(executionTime);
      return date.getTime() > Date.now() ? date : null;
    }

    let cronExpr = expression;

    // Generate cron expression dynamically for basic repeat types
    if (['DAILY', 'WEEKLY', 'MONTHLY'].includes(repeatType)) {
      if (!executionTime) return null;
      const baseDate = new Date(executionTime);
      cronExpr = this.generateCronFromBase(repeatType, baseDate);
    }

    if (!cronExpr) return null;

    try {
      const interval = CronExpressionParser.parse(cronExpr, {
        currentDate: new Date(),
      });
      return interval.next().toDate();
    } catch (error) {
      console.error('Error parsing cron expression:', error);
      return null;
    }
  }
}

export const cronService = new CronService();
