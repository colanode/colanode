import semver from 'semver';

export const FeatureVersions = {
  'workspace.storage.management': '0.3.0',
  'file.upload.tus': '0.3.0',
} as const;

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

  return semver.gte(parsedVersion, featureVersion);
};
