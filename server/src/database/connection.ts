import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite connection
const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new DatabaseSync(config.dbPath);

// Enable foreign keys and WAL mode for reliability & performance
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

// Initialize tables from schema.sql
export function initializeDatabase(): void {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);

  // Auto-migrate columns if existing database
  const migrations = [
    'ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 1;',
    "ALTER TABLE users ADD COLUMN account_status TEXT NOT NULL DEFAULT 'active';",
    'ALTER TABLE users ADD COLUMN session_version INTEGER NOT NULL DEFAULT 1;',
    'ALTER TABLE users ADD COLUMN last_login_at TEXT;',
    "ALTER TABLE staff_profiles ADD COLUMN account_status TEXT NOT NULL DEFAULT 'active';",
    'ALTER TABLE staff_profiles ADD COLUMN suspended_at TEXT;',
    'ALTER TABLE staff_profiles ADD COLUMN suspended_by TEXT;',
    'ALTER TABLE staff_profiles ADD COLUMN suspension_reason TEXT;',
    'ALTER TABLE staff_profiles ADD COLUMN banned_at TEXT;',
    'ALTER TABLE staff_profiles ADD COLUMN banned_by TEXT;',
    'ALTER TABLE staff_profiles ADD COLUMN ban_reason TEXT;',
    'ALTER TABLE staff_profiles ADD COLUMN deleted_at TEXT;',
    'ALTER TABLE staff_profiles ADD COLUMN deleted_by TEXT;',
    'ALTER TABLE staff_profiles ADD COLUMN deletion_reason TEXT;',
    'ALTER TABLE staff_profiles ADD COLUMN department_id TEXT REFERENCES departments(id);',
    'CREATE INDEX IF NOT EXISTS idx_staff_dept_id ON staff_profiles(department_id);',
    'CREATE INDEX IF NOT EXISTS idx_staff_dept ON staff_profiles(department);',
    'CREATE INDEX IF NOT EXISTS idx_transfer_staff ON staff_department_transfers(staff_profile_id);',
    'CREATE INDEX IF NOT EXISTS idx_transfer_user ON staff_department_transfers(user_id);'
  ];
  for (const m of migrations) {
    try {
      db.exec(m);
    } catch {
      // Column or index already exists
    }
  }

  // Seed default university departments if empty
  try {
    const deptCount = db.prepare('SELECT COUNT(*) as count FROM departments').get() as { count: number } | undefined;
    if (!deptCount || deptCount.count === 0) {
      const defaultDepartments = [
        { code: 'CSE', name: 'Computer Science and Engineering', description: 'Computing, software systems, and algorithmic theory' },
        { code: 'IT', name: 'Information Technology', description: 'Network engineering, cloud infrastructure, and enterprise IT' },
        { code: 'ECE', name: 'Electronics and Communication Engineering', description: 'Embedded systems, telecommunications, and VLSI design' },
        { code: 'EEE', name: 'Electrical and Electronics Engineering', description: 'Power systems, smart grid, and renewable energy circuits' },
        { code: 'MECH', name: 'Mechanical Engineering', description: 'Thermodynamics, robotics, and advanced manufacturing' },
        { code: 'CIVIL', name: 'Civil Engineering', description: 'Structural design, environmental engineering, and geomatics' },
        { code: 'AIDS', name: 'Artificial Intelligence and Data Science', description: 'Machine learning, predictive models, and big data' },
        { code: 'BIOTECH', name: 'Biotechnology & Life Sciences', description: 'Biomedical engineering, bioinformatics, and genetic science' },
        { code: 'ARCH', name: 'Architecture & Urban Design', description: 'Sustainable architecture, landscape planning, and urban systems' },
        { code: 'MGMT', name: 'Business Administration', description: 'Management sciences, entrepreneurship, and financial operations' }
      ];

      const insertStmt = db.prepare(`
        INSERT INTO departments (id, code, name, description, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, 1, datetime('now'), datetime('now'))
      `);

      for (const d of defaultDepartments) {
        insertStmt.run(crypto.randomUUID(), d.code, d.name, d.description);
      }
      console.log('[Database] Seeded initial academic departments.');
    }

    // Auto-link any existing staff_profiles that have department names but no department_id
    const existingStaff = db.prepare('SELECT id, department FROM staff_profiles WHERE department_id IS NULL').all() as Array<{ id: string; department: string }>;
    if (existingStaff && existingStaff.length > 0) {
      const allDepts = db.prepare('SELECT id, code, name FROM departments').all() as Array<{ id: string; code: string; name: string }>;
      const updateStmt = db.prepare('UPDATE staff_profiles SET department_id = ?, department = ? WHERE id = ?');
      const insertDeptStmt = db.prepare("INSERT INTO departments (id, code, name, description, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, 1, datetime('now'), datetime('now'))");

      for (const st of existingStaff) {
        const cleanName = st.department.trim();
        // Match by exact name or case-insensitive or common variations
        let matched = allDepts.find(d => 
          d.name.toLowerCase() === cleanName.toLowerCase() ||
          cleanName.toLowerCase().replace(/&/g, 'and') === d.name.toLowerCase().replace(/&/g, 'and')
        );

        if (!matched) {
          // Create custom department for unmapped department
          const newCode = cleanName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6) || `D${Math.floor(Math.random() * 900 + 100)}`;
          // Verify code uniqueness
          let safeCode = newCode;
          let counter = 1;
          while (allDepts.some(d => d.code === safeCode)) {
            safeCode = `${newCode}${counter++}`;
          }
          const newDeptId = crypto.randomUUID();
          insertDeptStmt.run(newDeptId, safeCode, cleanName, `Academic department for ${cleanName}`);
          matched = { id: newDeptId, code: safeCode, name: cleanName };
          allDepts.push(matched);
        }

        updateStmt.run(matched.id, matched.name, st.id);
      }
      console.log(`[Database] Linked ${existingStaff.length} staff profile(s) to academic departments.`);
    }
  } catch (err) {
    console.error('[Database Migration Warning]', err);
  }

  console.log('[Database] SQLite schema verified and ready.');
}

// Helpers for repository layer
export interface RunResult {
  changes: number;
  lastInsertRowid: number | bigint;
}

export const dbHelper = {
  get<T = any>(sql: string, params: any[] = []): T | undefined {
    const stmt = db.prepare(sql);
    return stmt.get(...params) as T | undefined;
  },

  all<T = any>(sql: string, params: any[] = []): T[] {
    const stmt = db.prepare(sql);
    return stmt.all(...params) as T[];
  },

  run(sql: string, params: any[] = []): RunResult {
    const stmt = db.prepare(sql);
    return stmt.run(...params) as unknown as RunResult;
  },

  exec(sql: string): void {
    db.exec(sql);
  }
};
