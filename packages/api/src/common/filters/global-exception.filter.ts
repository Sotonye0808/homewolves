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
    } else if (this.isDatabaseError(exception)) {
      const dbError = exception as DatabaseError;
      switch (dbError.code) {
        case '23505':
          status = HttpStatus.CONFLICT;
          message = 'A record with the same unique value already exists';
          code = 'UNIQUE_CONSTRAINT';
          break;
        case '23503':
          status = HttpStatus.BAD_REQUEST;
          message = 'Referenced record does not exist';
          code = 'FOREIGN_KEY_CONSTRAINT';
          break;
        case '22P02':
        case '22003':
          status = HttpStatus.BAD_REQUEST;
          message = 'Invalid input value';
          code = 'INVALID_INPUT';
          break;
        default:
          this.logger.error(dbError.message);
      }
    } else {
      this.logger.error(exception instanceof Error ? exception.stack ?? exception.message : String(exception));
    }

    const body: Record<string, unknown> = { code, message, statusCode: status };
    if (errors != null) body.errors = errors;
    response.status(status).json(body);
  }

  private isDatabaseError(err: unknown): err is DatabaseError {
    return (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      typeof (err as DatabaseError).code === 'string' &&
      typeof (err as DatabaseError).message === 'string'
    );
  }
}

interface DatabaseError {
  code: string;
  message: string;
}
