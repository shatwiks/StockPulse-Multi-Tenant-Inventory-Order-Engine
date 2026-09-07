import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
  message?: string;
  pagination?: PaginationMeta; // Backward-compatible alias
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorEnvelope {
  success: false;
  error: ApiErrorDetail;
  message?: string; // Backward-compatible top-level alias
  details?: unknown; // Backward-compatible top-level alias
  shortages?: unknown; // Backward-compatible alias for 409 shortages
}

/**
 * Standardized Success Response Envelope
 * Universal Contract:
 * {
 *   success: true,
 *   data: T,
 *   meta?: { page: number, limit: number, total: number, totalPages: number }
 * }
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  meta?: PaginationMeta,
  statusCode = 200,
  message?: string
): Response {
  const payload: ApiSuccessEnvelope<T> = {
    success: true,
    data,
    ...(meta ? { meta, pagination: meta } : {}),
    ...(message ? { message } : {}),
  };

  return res.status(statusCode).json(payload);
}

/**
 * Standardized Error Response Envelope
 * Universal Contract:
 * {
 *   success: false,
 *   error: {
 *     code: string,
 *     message: string,
 *     details?: unknown
 *   }
 * }
 */
export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
  details?: unknown
): Response {
  const payload: ApiErrorEnvelope = {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
    message, // Convenience accessor
    ...(details !== undefined ? { details, shortages: details } : {}),
  };

  return res.status(statusCode).json(payload);
}
