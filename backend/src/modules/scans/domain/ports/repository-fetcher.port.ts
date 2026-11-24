import { RepositoryFile } from '../entities/scan.types';

export const REPOSITORY_FETCHERS_PORT = Symbol('REPOSITORY_FETCHERS_PORT');

export interface RepositoryFetchContext {
  repositoryUrl: string;
  branch: string;
  accessToken?: string | null;
}

export interface IRepositoryFetcher {
  supports(context: RepositoryFetchContext): boolean;
  fetchManifestFiles(
    context: RepositoryFetchContext,
  ): Promise<RepositoryFile[]>;
}
