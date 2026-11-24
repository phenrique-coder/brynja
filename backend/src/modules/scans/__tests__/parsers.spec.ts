import { NpmManifestParser } from '../infrastructure/parsers/npm-manifest.parser';
import { PythonManifestParser } from '../infrastructure/parsers/python-manifest.parser';

describe('Dependency Parsers (OCP)', () => {
  describe('NpmManifestParser', () => {
    const parser = new NpmManifestParser();

    it('parses package.json dependencies and devDependencies', () => {
      const content = JSON.stringify({
        dependencies: { lodash: '^4.17.20', express: '~4.18.2' },
        devDependencies: { vitest: '^3.0.0' },
      });
      const deps = parser.parse('package.json', content);
      expect(deps).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'lodash',
            version: '4.17.20',
            ecosystem: 'npm',
          }),
          expect.objectContaining({
            name: 'express',
            version: '4.18.2',
            ecosystem: 'npm',
          }),
          expect.objectContaining({
            name: 'vitest',
            version: '3.0.0',
            ecosystem: 'npm',
          }),
        ]),
      );
    });

    it('parses package-lock.json v3 packages', () => {
      const lock = JSON.stringify({
        lockfileVersion: 3,
        packages: {
          '': { dependencies: { axios: '^1.6.0' } },
          'node_modules/axios': { version: '1.6.0' },
          'node_modules/follow-redirects': { version: '1.15.4' },
        },
      });
      const deps = parser.parse('package-lock.json', lock);
      expect(deps).toHaveLength(2);
      expect(deps.find((d) => d.name === 'axios')?.isDirect).toBe(true);
      expect(deps.find((d) => d.name === 'follow-redirects')?.isDirect).toBe(
        false,
      );
    });

    it('parses pnpm-lock.yaml packages section', () => {
      const yaml = `
lockfileVersion: '9.0'
packages:
  'lodash@4.17.20':
    resolution: {integrity: sha512-abc}
  '@nestjs/core@11.0.0':
    resolution: {integrity: sha512-def}
`;
      const deps = parser.parse('pnpm-lock.yaml', yaml);
      expect(deps).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'lodash', version: '4.17.20' }),
          expect.objectContaining({ name: '@nestjs/core', version: '11.0.0' }),
        ]),
      );
    });
  });

  describe('PythonManifestParser', () => {
    const parser = new PythonManifestParser();

    it('parses requirements.txt', () => {
      const req = `
# Production deps
django==4.2.10
requests>=2.31.0 # inline comment
-r base.txt
urllib3[socks]==1.26.18; python_version >= "3.8"
`;
      const deps = parser.parse('requirements.txt', req);
      expect(deps).toHaveLength(3);
      expect(deps[0]).toMatchObject({
        name: 'django',
        version: '4.2.10',
        ecosystem: 'PyPI',
      });
      expect(deps[2]).toMatchObject({
        name: 'urllib3',
        version: '1.26.18',
        ecosystem: 'PyPI',
      });
    });

    it('parses pyproject.toml PEP 621 and Poetry dependencies', () => {
      const toml = `
[project]
name = "sample-app"
dependencies = [
  "fastapi==0.109.0",
  "pydantic>=2.5.3"
]

[tool.poetry.dependencies]
python = "^3.11"
flask = "^2.3.2"
`;
      const deps = parser.parse('pyproject.toml', toml);
      expect(deps).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'fastapi', version: '0.109.0' }),
          expect.objectContaining({ name: 'pydantic', version: '2.5.3' }),
          expect.objectContaining({ name: 'flask', version: '2.3.2' }),
        ]),
      );
    });
  });
});
