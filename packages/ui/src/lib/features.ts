import semver from 'semver';

export const FeatureVersions = {} as const;

export type FeatureKey = keyof typeof FeatureVersions;

export const isFeatureSupported = (
  feature: FeatureKey,
  version: string
): boolean => {
  if (version === 'local') {
    return true;
  }

  const parsedVersion = semver.parse(version);
  if (!parsedVersion) {
    return false;
  }

  const featureVersion = FeatureVersions[feature];
  if (!featureVersion) {
    return false;
  }

  return semver.gte(featureVersion, parsedVersion);
};
