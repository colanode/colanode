import * as Haptics from 'expo-haptics';

export const impactLight = () => {
  try {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Haptics not available (e.g. simulator)
  }
};

export const impactMedium = () => {
  try {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // Haptics not available
  }
};

export const selectionChanged = () => {
  try {
    void Haptics.selectionAsync();
  } catch {
    // Haptics not available
  }
};

export const notificationSuccess = () => {
  try {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Haptics not available
  }
};

export const notificationError = () => {
  try {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    // Haptics not available
  }
};
