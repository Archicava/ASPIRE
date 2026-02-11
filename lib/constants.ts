/**
 * Application-wide constants
 */

/**
 * ENFORCE_MOCK_MODE
 *
 * Controls the default behavior when MOCK_MODE environment variable is not set.
 *
 * ## What it does:
 * - If true: Mock mode is enabled by default (unless MOCK_MODE env explicitly sets it to false)
 * - If false: Production mode by default (unless MOCK_MODE env explicitly sets it to true)
 *
 * ## Priority order:
 * 1. MOCK_MODE environment variable (if present) - takes precedence ALWAYS
 * 2. ENFORCE_MOCK_MODE constant (if MOCK_MODE env not set) - fallback
 *
 * ## Decision Logic:
 * ```typescript
 * const mockMode = process.env.MOCK_MODE !== undefined
 *   ? process.env.MOCK_MODE === 'true'  // Use env if set
 *   : ENFORCE_MOCK_MODE;                 // Otherwise use this constant
 * ```
 *
 * ## Use Cases:
 *
 * ### Development Builds (Set to `true`)
 * New developers automatically get mock mode without configuring .env
 * ```typescript
 * export const ENFORCE_MOCK_MODE = true;
 * ```
 * - Developer runs `npm run dev` → Mock mode active
 * - Consistent onboarding experience
 * - No accidental production data modification
 *
 * ### Production Builds (Set to `false`)
 * Force real data unless explicitly overridden
 * ```typescript
 * export const ENFORCE_MOCK_MODE = false;
 * ```
 * - Deployment runs `npm start` → Real mode active
 * - Production environments set `MOCK_MODE=false` in .env to be explicit
 *
 * ### Hybrid Approach (Recommended)
 * ```typescript
 * // lib/constants.ts - Development default
 * export const ENFORCE_MOCK_MODE = true;
 * ```
 * ```bash
 * # .env.production
 * MOCK_MODE=false  # Override for production
 *
 * # .env.development
 * # MOCK_MODE not set, uses constant (true)
 *
 * # .env.demo
 * MOCK_MODE=true  # Explicit mock for demos
 * ```
 *
 * ## Examples:
 *
 * | ENFORCE_MOCK_MODE | MOCK_MODE env | Result     | Reason                        |
 * |-------------------|---------------|------------|-------------------------------|
 * | true              | not set       | Mock mode  | Constant enforces mock        |
 * | true              | "false"       | Real mode  | Env overrides constant        |
 * | true              | "true"        | Mock mode  | Env confirms mock             |
 * | false             | not set       | Real mode  | Constant defaults to real     |
 * | false             | "false"       | Real mode  | Env confirms real             |
 * | false             | "true"        | Mock mode  | Env overrides constant        |
 *
 * ## Logging:
 * On startup, the app logs which source determined the mode:
 * ```
 * [config] Mock mode enabled: via MOCK_MODE env variable (true)
 * [config] Mock mode enabled: via ENFORCE_MOCK_MODE constant (true)
 * ```
 *
 * ## Changing the Default:
 * To change the default for all developers:
 * 1. Change this constant value
 * 2. Commit to version control
 * 3. All developers without MOCK_MODE in .env will use the new default
 *
 * @see MOCK_MODE.md for detailed documentation
 */
export const ENFORCE_MOCK_MODE = true;

/**
 * Application version
 */
export const APP_VERSION = '1.0.0';

/**
 * Application name
 */
export const APP_NAME = 'ASPIRE Lab';

/**
 * Default pagination settings
 */
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

/**
 * Session defaults (can be overridden by environment)
 */
export const DEFAULT_SESSION_TTL_SECONDS = 86400; // 24 hours
export const MAX_SESSION_TTL_SECONDS = 604800; // 7 days

/**
 * Job status refresh interval (milliseconds)
 */
export const JOB_POLLING_INTERVAL_MS = 5000; // 5 seconds

/**
 * Health check interval (milliseconds)
 */
export const HEALTH_CHECK_INTERVAL_MS = 30000; // 30 seconds

/**
 * DEFAULT_USE_LOCAL_STORAGE
 *
 * Controls the default storage backend when USE_LOCAL_STORAGE environment variable is not set.
 *
 * When true (default): Uses JSON files for local storage of cases and jobs
 * When false: Uses CSTORE (distributed storage) for cases and jobs
 *
 * Note: Authentication always uses CSTORE regardless of this setting.
 */
export const DEFAULT_USE_LOCAL_STORAGE = true;

/**
 * Default data directory for local JSON storage
 */
export const DEFAULT_DATA_DIR = './data';
