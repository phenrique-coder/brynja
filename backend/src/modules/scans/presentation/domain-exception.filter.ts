import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  AuthorizationNotFoundError,
  DomainError,
  GitHubIntegrationError,
  GitHubNotConnectedError,
  InvalidRepositoryUrlError,
  InvalidTargetUrlError,
  OwnershipVerificationFailedError,
  ScanNotFoundError,
  SsrfBlockedError,
  TargetNotAuthorizedError,
  UnsafeProbeBlockedError,
} from '../domain/errors/domain.errors';

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = this.resolveStatusCode(exception);
    response.status(status).json({
      statusCode: status,
      error: exception.code,
      message: exception.message,
    });
  }

  private resolveStatusCode(exception: DomainError): number {
    if (
      exception instanceof TargetNotAuthorizedError ||
      exception instanceof SsrfBlockedError ||
      exception instanceof UnsafeProbeBlockedError
    ) {
      return HttpStatus.FORBIDDEN;
    }

    if (
      exception instanceof ScanNotFoundError ||
      exception instanceof AuthorizationNotFoundError
    ) {
      return HttpStatus.NOT_FOUND;
    }

    if (exception instanceof GitHubNotConnectedError) {
      return HttpStatus.UNAUTHORIZED;
    }

    if (
      exception instanceof OwnershipVerificationFailedError ||
      exception instanceof GitHubIntegrationError
    ) {
      return HttpStatus.UNPROCESSABLE_ENTITY;
    }

    if (
      exception instanceof InvalidRepositoryUrlError ||
      exception instanceof InvalidTargetUrlError
    ) {
      return HttpStatus.BAD_REQUEST;
    }

    return HttpStatus.BAD_REQUEST;
  }
}
