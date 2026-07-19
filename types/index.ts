// ============================================================
// Global Type Definitions for Network Slice Management System
// ============================================================

// ---- Roles ----
export type Role = 'ADMIN' | 'OPERATOR' | 'VIEWER';

// ---- Router Status ----
export type RouterStatus = 'CONNECTED' | 'DISCONNECTED' | 'ERROR';

// ---- Slice Status ----
export type SliceStatus = 'ACTIVE' | 'INACTIVE' | 'ERROR';

// ---- Scheduler Status ----
export type SchedulerStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED';

// ---- Scheduler Actions ----
export type SchedulerAction = 'ENABLE_SLICE' | 'DISABLE_SLICE' | 'UPDATE_BANDWIDTH';

// ---- LLM Provider Types ----
export type LLMProviderType = 'GEMINI' | 'OPENAI' | 'OLLAMA' | 'MOCK';

// ---- Audit Log Status ----
export type AuditLogStatus = 'SUCCESS' | 'FAILED';

// ---- LLM History Status ----
export type LLMHistoryStatus = 'SUCCESS' | 'FAILED';

// ---- API Response ----
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ---- Pagination ----
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ---- Auth Types ----
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken?: string;
}
