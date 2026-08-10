import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let errors: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
        code = 'HTTP_ERROR';
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, unknown>;
        if (typeof body.message === 'string') {
          message = body.message;
        } else if (Array.isArray(body.message)) {
          message = 'Validation failed';
          errors = body.message;
        }
        code = typeof body.code === 'string' ? body.code : 'HTTP_ERROR';
        if (body.errors != null) errors = body.errors;
      }
    } else if (this.isPrismaError(exception)) {
      const prismaError = exception as PrismaError;
      if (prismaError.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        message = 'A record with the same unique value already exists';
        code = 'UNIQUE_CONSTRAINT';
      } else if (prismaError.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
        code = 'NOT_FOUND';
      } else {
        this.logger.error(prismaError.message);
      }
    } else {
      this.logger.error(exception instanceof Error ? exception.stack ?? exception.message : String(exception));
    }

    const body: Record<string, unknown> = { code, message, statusCode: status };
    if (errors != null) body.errors = errors;
    response.status(status).json(body);
  }

  private isPrismaError(err: unknown): err is PrismaError {
    return (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      typeof (err as PrismaError).code === 'string' &&
      typeof (err as PrismaError).message === 'string'
    );
  }
}

interface PrismaError {
  code: string;
  message: string;
}
