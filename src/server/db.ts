import { promises as fs } from "fs";
import path from "path";
import type { Reminder } from "@/lib/reminders";

/**
 * Server data store.
 *
 * DEV: a JSON file at .data/db.json (git-ignored). This is the ONLY file that
 * touches storage: to use a real database (Postgres, Supabase, Firebase…), keep
 * these function signatures and change their bodies.
 */
export type StudentRecord = {
  /** Email the student registered; empty means the PSU default. */
  email?: string;
  saved: string[];
  reminders: Record<string, Reminder>;
};

export type OutboxEmail = { id: string; to: string; subject: string; text: string; html: string; at: string; via: string };

type DB = { students: Record<string, StudentRecord>; outbox: OutboxEmail[] };

const FILE = path.join(process.cwd(), ".data", "db.json");
let queue: Promise<unknown> = Promise.resolve();

async function load(): Promise<DB> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch {
    return { students: {}, outbox: [] };
  }
}

async function save(db: DB) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2));
  await fs.rename(tmp, FILE);
}

/** Run one change at a time, so two requests can't overwrite each other. */
function transaction<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const db = await load();
    const result = await fn(db);
    await save(db);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

const blank = (): StudentRecord => ({ saved: [], reminders: {} });

export async function getStudent(id: string): Promise<StudentRecord> {
  const db = await load();
  return db.students[id] ?? blank();
}

export function updateStudent(id: string, change: (s: StudentRecord) => void): Promise<StudentRecord> {
  return transaction((db) => {
    const s = (db.students[id] ??= blank());
    change(s);
    return s;
  });
}

/** Every student with at least one reminder switched on. */
export async function studentsWithReminders(): Promise<[string, StudentRecord][]> {
  const db = await load();
  return Object.entries(db.students).filter(([, s]) => Object.values(s.reminders).some((r) => r.enabled));
}

export function addToOutbox(email: OutboxEmail) {
  return transaction((db) => {
    db.outbox = [email, ...db.outbox].slice(0, 200);
  });
}

export async function readOutbox(): Promise<OutboxEmail[]> {
  return (await load()).outbox;
}
