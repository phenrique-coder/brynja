import { Ecosystem, ParsedDependency } from '../entities/scan.types';

export const DEPENDENCY_PARSERS_PORT = Symbol('DEPENDENCY_PARSERS_PORT');

export interface IDependencyParser {
  readonly ecosystem: Ecosystem;
  supports(filePath: string): boolean;
  parse(filePath: string, content: string): ParsedDependency[];
}
