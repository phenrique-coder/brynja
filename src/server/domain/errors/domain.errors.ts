export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidRepositoryUrlError extends DomainError {
  readonly code = 'INVALID_REPOSITORY_URL';
  readonly statusCode = 400;
}

export class InvalidTargetUrlError extends DomainError {
  readonly code = 'INVALID_TARGET_URL';
  readonly statusCode = 400;
}

export class TargetNotAuthorizedError extends DomainError {
  readonly code = 'TARGET_NOT_AUTHORIZED';
  readonly statusCode = 403;
}

export class SsrfBlockedError extends DomainError {
  readonly code = 'SSRF_BLOCKED';
  readonly statusCode = 403;
}

export class UnsafeProbeBlockedError extends DomainError {
  readonly code = 'UNSAFE_PROBE_BLOCKED';
  readonly statusCode = 403;
}

export class OwnershipVerificationFailedError extends DomainError {
  readonly code = 'OWNERSHIP_VERIFICATION_FAILED';
  readonly statusCode = 422;
}

export class GitHubIntegrationError extends DomainError {
  readonly code = 'GITHUB_INTEGRATION_ERROR';
  readonly statusCode = 400;
}

export class GitHubNotConnectedError extends DomainError {
  readonly code = 'GITHUB_NOT_CONNECTED';
  readonly statusCode = 401;
}
