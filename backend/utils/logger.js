/**
 * Logger minimal dengan redaksi credential.
 * Semua string yang menyerupai API key / token disamarkan sebelum dicetak.
 */
const SECRET_PATTERNS = [
  /sk-(proj-|svcacct-|admin-)?[A-Za-z0-9_-]{8,}/g, // OpenAI API keys
  /ek_[A-Za-z0-9_-]{8,}/g, // OpenAI ephemeral client secrets
  /sb_(secret|publishable)_[A-Za-z0-9_-]{8,}/g, // Supabase secret/publishable keys
  /AIza[0-9A-Za-z_-]{20,}/g, // Google API keys
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}/g, // JWT (Supabase session)
  /(Bearer\s+)[A-Za-z0-9._~+/=-]{8,}/gi,
  /([?&]key=)[^&\s]+/gi,
];

export const redact = (value) => {
  if (value === null || value === undefined) return value;
  let text = typeof value === 'string' ? value : safeStringify(value);
  for (const pattern of SECRET_PATTERNS) {
    text = text.replace(pattern, (match, prefix) =>
      typeof prefix === 'string' && /bearer|key=/i.test(prefix) ? `${prefix}[REDACTED]` : '[REDACTED]',
    );
  }
  return text;
};

function safeStringify(value) {
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

const write = (level, scope, message, meta) => {
  if (process.env.VITEST && level !== 'error') return; // jaga output test tetap bersih
  const line = `[${new Date().toISOString()}] ${level.toUpperCase()} [${scope}] ${redact(message)}`;
  const suffix = meta === undefined ? '' : ` ${redact(meta)}`;
  // eslint-disable-next-line no-console
  (level === 'error' ? console.error : level === 'warn' ? console.warn : console.log)(line + suffix);
};

export const createLogger = (scope) => ({
  info: (message, meta) => write('info', scope, message, meta),
  warn: (message, meta) => write('warn', scope, message, meta),
  error: (message, meta) => write('error', scope, message, meta),
});

export default createLogger;
