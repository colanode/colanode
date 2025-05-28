import semver from 'semver';

export const isServerOutdated = (version: string) => {
  const parsedVersion = semver.parse(version);
  if (!parsedVersion) {
    return false;
  }

  return semver.gte(parsedVersion, '2.2.0');
};
