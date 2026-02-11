/**
 * Application-wide constants
 */

/**
 * ENFORCE_MOCK_MODE
 *
 * Controls whether API calls are mocked (default: false).
 * When true, predictions use generateMockPredictionResponse instead of calling the real API.
 *
 * For displaying seed/demo data in the case library, use MOCK_DATA instead.
 */
export const ENFORCE_MOCK_MODE = false;

/**
 * DEFAULT_MOCK_DATA
 *
 * Controls whether seed/demo cases are shown in the case library (default: true).
 * When true, the case library shows seed cases alongside any real user-created cases.
 * When false, only real cases from storage are shown.
 *
 * This is separate from MOCK_MODE which controls API call behavior.
 */
export const DEFAULT_MOCK_DATA = true;

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
 * DEFAULT_USE_LOCAL
 *
 * Controls whether to use local storage instead of distributed services (default: true).
 *
 * When true (default):
 *   - Cases and jobs stored in JSON files
 *   - Payloads stored as local files (instead of R1FS)
 *
 * When false:
 *   - Cases and jobs stored in CSTORE
 *   - Payloads uploaded to R1FS
 *
 * Note: Authentication always uses CSTORE regardless of this setting.
 */
export const DEFAULT_USE_LOCAL = true;

/**
 * Default data directory for local storage
 *
 * Structure:
 *   {DATA_DIR}/
 *     db/
 *       cases.json    - Case records
 *       jobs.json     - Inference job records
 *     payloads/
 *       {caseId}.json - Case submission payloads
 */
export const DEFAULT_DATA_DIR = './data';
