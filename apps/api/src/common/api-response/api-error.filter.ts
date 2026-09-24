import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';

interface SafeHttpError {
    message: string;
    details?: unknown;
}

@Catch()
export class APIErrorFilter implements ExceptionFilter {
    private readonly logger = new Logger(APIErrorFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const context = host.switchToHttp();
        const request = context.getRequest<Request>();
        const response = context.getResponse<Response>();
        const requestId = randomUUID();
        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        if (!(exception instanceof HttpException) || status >= 500) {
            this.logger.error(
                `Unhandled error for ${request.method} ${request.url} (request ${requestId})`,
                exception instanceof Error ? exception.stack : undefined,
            );
        }

        const safeError =
            exception instanceof HttpException && status < 500
                ? this.toSafeHttpError(exception)
                : { message: 'An unexpected error occurred.' };

        response
            .status(status)
            .setHeader('Cache-Control', 'no-store')
            .setHeader('X-Request-Id', requestId)
            .json({
                success: false,
                error: {
                    code: this.codeForStatus(status),
                    message: safeError.message,
                    ...(safeError.details === undefined
                        ? {}
                        : { details: safeError.details }),
                    requestId,
                },
            });
    }

    private toSafeHttpError(exception: HttpException): SafeHttpError {
        const payload = exception.getResponse();
        if (typeof payload === 'string') {
            return { message: payload };
        }

        if (typeof payload === 'object' && payload !== null) {
            const record = payload as Record<string, unknown>;
            const message =
                typeof record.message === 'string'
                    ? record.message
                    : exception.message;
            return {
                message,
                ...(record.details === undefined
                    ? {}
                    : { details: record.details }),
            };
        }

        return { message: exception.message };
    }

    private codeForStatus(status: number): string {
        const labels: Record<number, string> = {
            400: 'BAD_REQUEST',
            401: 'UNAUTHORIZED',
            403: 'FORBIDDEN',
            404: 'NOT_FOUND',
            409: 'CONFLICT',
            422: 'UNPROCESSABLE_ENTITY',
            429: 'TOO_MANY_REQUESTS',
        };
        return (
            labels[status] ??
            (status >= 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_FAILED')
        );
    }
}
