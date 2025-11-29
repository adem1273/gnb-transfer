import { Request, Response, NextFunction } from 'express';

/**
 * Extended Response interface with API helper methods
 */
export interface ApiResponse extends Response {
  apiSuccess: <T = unknown>(data?: T | null, message?: string, status?: number) => Response;
  apiError: (message?: string, status?: number) => Response;
}

/**
 * Response middleware - provides standardized API response methods
 * Adds res.apiSuccess and res.apiError helper methods to all responses
 */
export function responseMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  const apiRes = res as ApiResponse;

  apiRes.apiSuccess = <T = unknown>(
    data: T | null = null,
    message = 'OK',
    status = 200
  ): Response => res.status(status).json({ success: true, message, data });

  apiRes.apiError = (message = 'Error', status = 500): Response =>
    res.status(status).json({ success: false, message, data: null });

  next();
}

export default responseMiddleware;
