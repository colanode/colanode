import { useEffect, useRef } from 'react';
import { Animated, DimensionValue, StyleSheet, View, ViewStyle } from 'react-native';

import { useTheme } from '@colanode/mobile/contexts/theme';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

const Skeleton = ({ width, height = 14, borderRadius = 4, style }: SkeletonProps) => {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <View style={[{ width }, style]}>
      <Animated.View
        style={{
          height,
          borderRadius,
          backgroundColor: colors.border,
          opacity,
        }}
      />
    </View>
  );
};

export const SkeletonRow = () => {
  return (
    <View style={styles.row}>
      <Skeleton width={28} height={28} borderRadius={6} />
      <View style={styles.textGroup}>
        <Skeleton width="70%" height={14} />
        <Skeleton width="40%" height={10} />
      </View>
    </View>
  );
};

interface SkeletonListProps {
  count?: number;
}

export const SkeletonList = ({ count = 5 }: SkeletonListProps) => {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonRow key={i} />
      ))}
    </View>
  );
};

export const SkeletonMessageList = ({ count = 4 }: SkeletonListProps) => {
  return (
    <View style={styles.messageList}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[styles.messageBubble, i % 2 === 0 && styles.messageBubbleRight]}>
          {i % 2 !== 0 && <Skeleton width={32} height={32} borderRadius={16} />}
          <View style={styles.messageContent}>
            <Skeleton width="60%" height={12} />
            <Skeleton width="80%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
};

export const SkeletonPage = () => {
  return (
    <View style={styles.page}>
      <Skeleton width="50%" height={22} borderRadius={6} />
      <View style={styles.pageLines}>
        <Skeleton width="90%" height={14} />
        <Skeleton width="75%" height={14} />
        <Skeleton width="85%" height={14} />
        <Skeleton width="60%" height={14} />
        <Skeleton width="70%" height={14} />
      </View>
    </View>
  );
};

export const SkeletonFilePreview = () => {
  return (
    <View style={styles.filePreview}>
      <Skeleton width="100%" height={200} borderRadius={12} />
      <View style={styles.fileMeta}>
        <Skeleton width="60%" height={14} />
        <Skeleton width="40%" height={12} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  textGroup: {
    flex: 1,
    gap: 6,
  },
  list: {
    paddingTop: 8,
  },
  messageList: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingVertical: 8,
    gap: 12,
  },
  messageBubble: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
  },
  messageBubbleRight: {
    justifyContent: 'flex-end',
    paddingLeft: 60,
  },
  messageContent: {
    gap: 6,
    maxWidth: '70%',
    padding: 12,
  },
  page: {
    padding: 16,
    gap: 20,
  },
  pageLines: {
    gap: 10,
  },
  filePreview: {
    padding: 16,
    gap: 16,
  },
  fileMeta: {
    gap: 8,
  },
});
