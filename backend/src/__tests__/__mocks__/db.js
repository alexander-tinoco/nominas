// Mock del pool de PostgreSQL para tests.
// Este módulo reemplaza backend/src/config/db.js en todos los tests
// via vi.mock('../config/db.js').
import { vi } from 'vitest';

const pool = {
  query: vi.fn(() => Promise.resolve({ rows: [{ test_val: 1 }] })),
};

export default pool;
