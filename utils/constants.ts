/**
 * Constants used across the Network Slice Management system.
 */

export const APP_NAME = 'Network Slice Management';
export const APP_DESCRIPTION =
  'Sistem manajemen network slicing berbasis web menggunakan LLM untuk MikroTik RouterOS.';

// ---- Auth Constants ----
export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';
export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY = '7d';

// ---- Role Constants ----
export const ROLES = {
  ADMIN: 'ADMIN',
  OPERATOR: 'OPERATOR',
  VIEWER: 'VIEWER',
} as const;

// ---- Router Status Constants ----
export const ROUTER_STATUS = {
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
  ERROR: 'ERROR',
} as const;

// ---- Slice Status Constants ----
export const SLICE_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  ERROR: 'ERROR',
} as const;

// ---- Scheduler Status Constants ----
export const SCHEDULER_STATUS = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
} as const;

// ---- LLM Provider Types ----
export const LLM_PROVIDERS = {
  GEMINI: 'GEMINI',
  OPENAI: 'OPENAI',
  OLLAMA: 'OLLAMA',
  MOCK: 'MOCK',
} as const;

// ---- Pagination Defaults ----
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;
