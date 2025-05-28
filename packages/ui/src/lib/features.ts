import semver from 'semver';

export const FeatureVersions = {} as const;

export type FeatureKey = keyof typeof FeatureVersions;

export const isFeatureSupported = (
  feature: FeatureKey,
  version: string
): boolean => {
  const parsedVersion = semver.parse(version);
  if (!parsedVersion) {
    return true;
  }

  const featureVersion = FeatureVersions[feature];
  if (!featureVersion) {
    return false;
  }

  return semver.gte(featureVersion, parsedVersion);
};
