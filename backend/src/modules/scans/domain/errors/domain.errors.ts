export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidRepositoryUrlError extends DomainError {
  readonly code = 'INVALID_REPOSITORY_URL';
}

export class InvalidTargetUrlError extends DomainError {
  readonly code = 'INVALID_TARGET_URL';
}

export class TargetNotAuthorizedError extends DomainError {
  readonly code = 'TARGET_NOT_AUTHORIZED';
}

export class SsrfBlockedError extends DomainError {
  readonly code = 'SSRF_BLOCKED';
}

export class UnsafeProbeBlockedError extends DomainError {
  readonly code = 'UNSAFE_PROBE_BLOCKED';
}

export class OwnershipVerificationFailedError extends DomainError {
  readonly code = 'OWNERSHIP_VERIFICATION_FAILED';
}

export class ScanNotFoundError extends DomainError {
  readonly code = 'SCAN_NOT_FOUND';
}

export class AuthorizationNotFoundError extends DomainError {
  readonly code = 'AUTHORIZATION_NOT_FOUND';
}

export class GitHubIntegrationError extends DomainError {
  readonly code = 'GITHUB_INTEGRATION_ERROR';
}

export class GitHubNotConnectedError extends DomainError {
  readonly code = 'GITHUB_NOT_CONNECTED';
}
