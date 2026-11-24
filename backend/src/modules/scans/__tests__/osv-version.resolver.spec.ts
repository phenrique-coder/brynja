import {
  OsvAffectedPackage,
  compareVersions,
  resolveFixedVersionForInstalled,
} from '../infrastructure/vuln-intel/osv-version.resolver';

describe('OSV Version Resolver', () => {
  const nextMiddlewareAdvisory: OsvAffectedPackage[] = [
    {
      package: { name: 'next', ecosystem: 'npm' },
      ranges: [
        {
          type: 'SEMVER',
          events: [{ introduced: '12.0.0' }, { fixed: '12.3.5' }],
        },
        {
          type: 'SEMVER',
          events: [{ introduced: '13.0.0' }, { fixed: '13.5.9' }],
        },
        {
          type: 'SEMVER',
          events: [{ introduced: '14.0.0' }, { fixed: '14.2.25' }],
        },
        {
          type: 'SEMVER',
          events: [{ introduced: '15.0.0' }, { fixed: '15.2.3' }],
        },
      ],
    },
  ];

  it('selects 15.2.3 (not 12.3.5/13.5.9) when installed version is next@15.0.0', () => {
    expect(
      resolveFixedVersionForInstalled(
        nextMiddlewareAdvisory,
        'next',
        '15.0.0',
        'npm',
      ),
    ).toBe('15.2.3');
  });

  it('selects branch-accurate fix for 14.x and 13.x without downgrading', () => {
    expect(
      resolveFixedVersionForInstalled(
        nextMiddlewareAdvisory,
        'next',
        '14.1.2',
        'npm',
      ),
    ).toBe('14.2.25');

    expect(
      resolveFixedVersionForInstalled(
        nextMiddlewareAdvisory,
        'next',
        '13.4.0',
        'npm',
      ),
    ).toBe('13.5.9');
  });

  it('handles multiple introduced/fixed pairs inside a single events array', () => {
    const singleRange: OsvAffectedPackage[] = [
      {
        package: { name: 'axios', ecosystem: 'npm' },
        ranges: [
          {
            type: 'SEMVER',
            events: [
              { introduced: '0' },
              { fixed: '0.28.0' },
              { introduced: '1.0.0' },
              { fixed: '1.6.4' },
            ],
          },
        ],
      },
    ];

    expect(
      resolveFixedVersionForInstalled(singleRange, 'axios', '1.5.0', 'npm'),
    ).toBe('1.6.4');
    expect(
      resolveFixedVersionForInstalled(singleRange, 'axios', '0.21.1', 'npm'),
    ).toBe('0.28.0');
  });

  it('ignores GIT ranges and never recommends an older version', () => {
    const mixed: OsvAffectedPackage[] = [
      {
        package: { name: 'pkg', ecosystem: 'npm' },
        ranges: [
          {
            type: 'GIT',
            events: [{ introduced: 'abc123' }, { fixed: 'def456' }],
          },
          {
            type: 'SEMVER',
            events: [{ introduced: '1.0.0' }, { fixed: '1.2.0' }],
          },
        ],
      },
    ];

    expect(
      resolveFixedVersionForInstalled(mixed, 'pkg', '2.0.0', 'npm'),
    ).toBeNull();
  });

  it('compares SemVer prereleases correctly', () => {
    expect(compareVersions('15.0.0-canary.1', '15.0.0')).toBe(-1);
    expect(compareVersions('15.0.0', '15.2.3')).toBe(-1);
    expect(compareVersions('15.2.3', '15.2.3')).toBe(0);
  });
});
