import semver from 'semver';

export const isServerOutdated = (version: string) => {
  if (version === 'dev') {
    return false;
  }

  return semver.gte(version, '2.2.0');
};
