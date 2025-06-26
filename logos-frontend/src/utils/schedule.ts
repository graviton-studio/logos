import { ScheduledTriggerConfig } from "@/types/agent";

export interface ParsedSchedule {
  cron_expression: string;
  timezone?: string;
  human_readable: string;
}

/**
 * Converts human-readable schedule strings to cron expressions
 */
export function parseScheduleString(schedule: string): ParsedSchedule | null {
  if (!schedule?.trim()) return null;

  const normalized = schedule.toLowerCase().trim();

  // Daily patterns
  if (normalized.includes("daily") || normalized.includes("every day")) {
    const timeMatch = normalized.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
    if (timeMatch) {
      const [, hour, minute, period] = timeMatch;
      let hourNum = parseInt(hour);

      if (period?.toLowerCase() === "pm" && hourNum !== 12) hourNum += 12;
      if (period?.toLowerCase() === "am" && hourNum === 12) hourNum = 0;

      return {
        cron_expression: `${minute} ${hourNum} * * *`,
        timezone: "UTC",
        human_readable: schedule,
      };
    }
  }

  // Weekly patterns
  const weeklyMatch = normalized.match(
    /every\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
  );
  if (weeklyMatch) {
    const dayMap: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    const day = dayMap[weeklyMatch[1].toLowerCase()];
    const timeMatch = normalized.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);

    if (timeMatch) {
      const [, hour, minute, period] = timeMatch;
      let hourNum = parseInt(hour);

      if (period?.toLowerCase() === "pm" && hourNum !== 12) hourNum += 12;
      if (period?.toLowerCase() === "am" && hourNum === 12) hourNum = 0;

      return {
        cron_expression: `${minute} ${hourNum} * * ${day}`,
        timezone: "UTC",
        human_readable: schedule,
      };
    }
  }

  // Hourly patterns
  if (normalized.includes("hourly") || normalized.includes("every hour")) {
    return {
      cron_expression: "0 * * * *",
      timezone: "UTC",
      human_readable: schedule,
    };
  }

  // Pre-defined common schedules
  const presets: Record<string, string> = {
    "6:00 pm daily": "0 18 * * *",
    "every monday at 9:00 am": "0 9 * * 1",
    "9am weekdays": "0 9 * * 1-5",
    "end of day": "0 17 * * 1-5",
  };

  const preset = presets[normalized];
  if (preset) {
    return {
      cron_expression: preset,
      timezone: "UTC",
      human_readable: schedule,
    };
  }

  // If already a cron expression, validate and return
  const cronRegex = /^(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)$/;
  if (cronRegex.test(normalized)) {
    return {
      cron_expression: normalized,
      timezone: "UTC",
      human_readable: schedule,
    };
  }

  return null;
}

/**
 * Creates a ScheduledTriggerConfig from a schedule string
 */
export function createScheduledTriggerConfig(
  schedule: string,
): ScheduledTriggerConfig | null {
  const parsed = parseScheduleString(schedule);
  if (!parsed) return null;

  return {
    cron_expression: parsed.cron_expression,
    timezone: parsed.timezone,
  };
}

/**
 * Checks if a schedule string is valid
 */
export function isValidSchedule(schedule: string): boolean {
  return parseScheduleString(schedule) !== null;
}
