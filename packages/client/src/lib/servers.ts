import semver from 'semver';

export const isServerOutdated = (version: string) => {
  if (version === 'local') {
    return false;
  }

  const parsedVersion = semver.parse(version);
  if (!parsedVersion) {
    return true;
  }

  return semver.lt(parsedVersion, '0.2.0');
};
