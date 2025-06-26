/**
 * Simple cron expression parser and evaluator
 * Supports basic cron syntax: minute hour day month dayOfWeek
 */

export interface CronExpression {
  minute: number[];
  hour: number[];
  day: number[];
  month: number[];
  dayOfWeek: number[];
}

/**
 * Parses a cron expression string into CronExpression object
 */
export function parseCronExpression(cronString: string): CronExpression {
  const parts = cronString.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error(`Invalid cron expression: ${cronString}`);
  }

  const [minute, hour, day, month, dayOfWeek] = parts;

  return {
    minute: parseField(minute, 0, 59),
    hour: parseField(hour, 0, 23),
    day: parseField(day, 1, 31),
    month: parseField(month, 1, 12),
    dayOfWeek: parseField(dayOfWeek, 0, 6),
  };
}

/**
 * Parses a single cron field (supports *, numbers, ranges, and lists)
 */
function parseField(field: string, min: number, max: number): number[] {
  if (field === "*") {
    return Array.from({ length: max - min + 1 }, (_, i) => min + i);
  }

  const values: number[] = [];
  const parts = field.split(",");

  for (const part of parts) {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map(Number);
      for (let i = start; i <= end; i++) {
        values.push(i);
      }
    } else {
      values.push(Number(part));
    }
  }

  return values.filter((v) => v >= min && v <= max);
}

/**
 * Checks if a cron expression should trigger at the given time
 */
export function shouldTrigger(
  cronExpression: CronExpression,
  date: Date,
): boolean {
  const minute = date.getUTCMinutes();
  const hour = date.getUTCHours();
  const day = date.getUTCDate();
  const month = date.getUTCMonth() + 1; // getUTCMonth() returns 0-11
  const dayOfWeek = date.getUTCDay(); // 0 = Sunday

  return (
    cronExpression.minute.includes(minute) &&
    cronExpression.hour.includes(hour) &&
    cronExpression.day.includes(day) &&
    cronExpression.month.includes(month) &&
    cronExpression.dayOfWeek.includes(dayOfWeek)
  );
}

/**
 * Checks if a cron string should trigger at the given time
 */
export function isCronDue(
  cronString: string,
  date: Date = new Date(),
): boolean {
  try {
    const expression = parseCronExpression(cronString);
    return shouldTrigger(expression, date);
  } catch (error) {
    console.error(`Error parsing cron expression "${cronString}":`, error);
    return false;
  }
}

/**
 * Gets the next trigger time for a cron expression (approximate)
 */
export function getNextTriggerTime(
  cronString: string,
  fromDate: Date = new Date(),
): Date | null {
  try {
    const expression = parseCronExpression(cronString);

    // Check next 7 days, every minute (simple approach)
    const current = new Date(fromDate);
    current.setSeconds(0, 0); // Reset seconds and milliseconds

    for (let i = 0; i < 7 * 24 * 60; i++) {
      current.setMinutes(current.getMinutes() + 1);
      if (shouldTrigger(expression, current)) {
        return new Date(current);
      }
    }

    return null;
  } catch (error) {
    console.error(
      `Error calculating next trigger time for "${cronString}":`,
      error,
    );
    return null;
  }
}
