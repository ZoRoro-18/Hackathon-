// KhaataAI - Shared Utilities

/**
 * Convert Postgres NUMERIC string to a JS number.
 * Postgres returns NUMERIC as strings; this converts them safely.
 */
export function toNum(val) {
  if (val === null || val === undefined) return 0;
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Convert a rupee amount to integer paise to avoid floating-point errors.
 */
export function toPaise(rupees) {
  return Math.round(toNum(rupees) * 100);
}

/**
 * Convert paise back to rupees.
 */
export function toRupees(paise) {
  return paise / 100;
}

/**
 * Wrap an async route handler to catch errors and forward to Express error handler.
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create an AppError with a status code and error code.
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/**
 * Parse pagination params from query string.
 */
export function parsePagination(query) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);
  if (!page || page < 1) page = 1;
  if (!limit || limit < 1) limit = 20;
  if (limit > 100) limit = 100;
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/**
 * Format a successful response.
 */
export function success(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

/**
 * Format a paginated response.
 */
export function paginated(res, data, total, page, limit) {
  return res.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

/**
 * Get today's date in IST (Asia/Kolkata) as a YYYY-MM-DD string.
 */
export function todayIST() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

/**
 * Get the current financial year (April to March) date range.
 * Returns { from: 'YYYY-04-01', to: 'YYYY-03-31' }
 */
export function currentFinancialYear() {
  const now = new Date();
  const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const year = istDate.getFullYear();
  const month = istDate.getMonth(); // 0-indexed
  // Financial year: April (month 3) to March (month 2)
  const fyStart = month >= 3 ? year : year - 1;
  return {
    from: `${fyStart}-04-01`,
    to: `${fyStart + 1}-03-31`,
  };
}

/**
 * Normalize a date string to YYYY-MM-DD, returns null if unparseable.
 */
export function normalizeDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // Try ISO format first
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    if (!isNaN(date.getTime())) {
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }

  // Try DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    if (!isNaN(date.getTime())) {
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }

  // Fallback: let Date.parse try
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return null;
}

/**
 * Escape special characters for SQL ILIKE patterns.
 */
export function escapeILike(str) {
  if (!str) return '';
  return str.replace(/[%_\\]/g, (ch) => `\\${ch}`);
}
