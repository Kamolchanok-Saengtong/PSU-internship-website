/** Shared by the browser and the server. */

export const REMINDER_DAYS = [7, 3, 1] as const;

export type Reminder = {
  enabled: boolean;
  /** Send an email this many days before the deadline (each one once). */
  daysBefore: number[];
  /** true: send to the student's account email. false: send to `email`. */
  useAccountEmail: boolean;
  email?: string;
  /** daysBefore value → when that reminder was sent (ISO). */
  sent: Record<string, string>;
};

export type MeResponse = {
  studentId: string;
  /** The email the student registered (or the PSU default). */
  accountEmail: string;
  saved: string[];
  reminders: Record<string, Reminder>;
};

export const defaultAccountEmail = (studentId: string) => `${studentId}@email.psu.ac.th`;

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

export const newReminder = (): Reminder => ({ enabled: true, daysBefore: [7, 1], useAccountEmail: true, sent: {} });
