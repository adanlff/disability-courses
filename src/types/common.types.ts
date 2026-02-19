// Common Types

// ID type
export type ID = string;

// Nullable type
export type Nullable<T> = T | null;

// Optional type
export type Optional<T> = T | undefined;

// Date string
export type DateString = string;

// Timestamp
export type Timestamp = Date | string;

// JSON value
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

// Sort order
export type SortOrder = 'asc' | 'desc';

// Pagination
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Paginated result
export interface Paginated<T> {
  data: T[];
  pagination: Pagination;
}

// Select fields
export type SelectFields<T> = Partial<Record<keyof T, boolean>>;

// Where clause
export type WhereClause<T> = Partial<T>;

// Order by
export type OrderBy<T> = Partial<Record<keyof T, SortOrder>>;

// Deep partial
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Required fields
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Enum values
export type EnumValues<T> = T[keyof T];

// Status with label
export interface StatusInfo<T> {
  value: T;
  label: string;
  color?: string;
  icon?: string;
}

// Key-value pair
export interface KeyValue<T = string> {
  key: string;
  value: T;
}

// Named entity
export interface NamedEntity {
  id: string;
  name: string;
}

// Slugged entity
export interface SluggedEntity extends NamedEntity {
  slug: string;
}

// Timestamped entity
export interface TimestampedEntity {
  created_at: Date;
  updated_at: Date;
}

// Base entity
export interface BaseEntity extends TimestampedEntity {
  id: string;
}

// Error with code
export interface CodedError extends Error {
  code: string;
  statusCode?: number;
}

// Async function result
export type AsyncResult<T, E = Error> = Promise<[T, null] | [null, E]>;

// Action result
export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
