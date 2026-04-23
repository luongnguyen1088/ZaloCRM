import { FastifyReply, FastifyRequest } from 'fastify';
import { Prisma } from '@prisma/client';
import { logger } from './logger.js';

/**
 * Custom application error that carries a status code.
 */
export class AppError extends Error {
  constructor(public message: string, public statusCode: number = 500, public code?: string) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Maps Prisma error codes to appropriate HTTP status codes and messages.
 */
export function handlePrismaError(error: any) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        const target = (error.meta?.target as string[]) || [];
        return new AppError(`Dữ liệu đã tồn tại: ${target.join(', ')}`, 409, 'ALREADY_EXISTS');
      }
      case 'P2025':
        return new AppError('Không tìm thấy dữ liệu yêu cầu', 404, 'NOT_FOUND');
      case 'P2003':
        return new AppError('Lỗi ràng buộc dữ liệu (Foreign key constraint)', 400, 'CONSTRAINT_ERROR');
      default:
        return new AppError(`Lỗi cơ sở dữ liệu: ${error.code}`, 500, 'DB_ERROR');
    }
  }
  return error;
}

/**
 * Global Fastify error handler.
 */
export const globalErrorHandler = (error: any, request: FastifyRequest, reply: FastifyReply) => {
  let handledError = handlePrismaError(error);

  const statusCode = handledError instanceof AppError ? handledError.statusCode : (error.statusCode || 500);
  const message = handledError.message || error.message || 'Internal Server Error';
  const code = handledError instanceof AppError ? handledError.code : (error.code || 'INTERNAL_ERROR');

  if (statusCode >= 500) {
    logger.error(`[GlobalError] ${request.method} ${request.url}:`, error);
  } else {
    logger.warn(`[ClientError] ${request.method} ${request.url}: ${message}`);
  }

  reply.status(statusCode).send({
    error: message,
    code,
    timestamp: new Date().toISOString()
  });
};
