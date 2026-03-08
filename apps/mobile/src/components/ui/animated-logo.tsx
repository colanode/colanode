import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '@colanode/mobile/contexts/theme';

interface AnimatedLogoProps {
  size?: number;
  color?: string;
}

export const AnimatedLogo = ({ size = 80, color }: AnimatedLogoProps) => {
  const { colors } = useTheme();
  const fillColor = color ?? colors.text;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale]);

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity, transform: [{ scale }] },
      ]}
    >
      <View style={{ width: size, height: size }}>
        <Svg viewBox="0 0 180 180" width={size} height={size}>
          <Path
            fill={fillColor}
            d="M97.68,141.49v13.74c0,1.85,2.12,2.9,3.59,1.78l44.14-33.58c1.99-1.52,3.17-3.88,3.17-6.39v-40.96c0-2.51-1.18-4.88-3.18-6.4l-26.49-20.05,27.27-9.61c1.44-.53,2.4-1.9,2.4-3.43v-11.69c0-1.67-1.67-2.82-3.23-2.22l-43.8,16.81c-2.34.95-3.86,3.22-3.86,5.75v50.63c0,1.91,2.19,3,3.71,1.84l9.32-7.1c1.47-1.12,2.33-2.86,2.33-4.71v-19.61l15.42,11.73c2.02,1.54,3.21,3.94,3.21,6.48v24.09c0,2.54-1.19,4.94-3.21,6.48l-28.41,21.62c-1.5,1.14-2.37,2.91-2.37,4.79Z"
          />
          <Path
            fill={fillColor}
            d="M82.32,141.49v13.74c0,1.85-2.12,2.9-3.59,1.78l-44.14-33.58c-1.99-1.52-3.17-3.88-3.17-6.39v-40.96c0-2.51,1.18-4.88,3.18-6.4l26.49-20.05-27.27-9.61c-1.44-.53-2.4-1.9-2.4-3.43v-11.69c0-1.67,1.67-2.82,3.23-2.22l43.8,16.81c2.34.95,3.86,3.22,3.86,5.75v50.63c0,1.91-2.19,3-3.71,1.84l-9.32-7.1c-1.47-1.12-2.33-2.86-2.33-4.71v-19.61l-15.42,11.73c-2.02,1.54-3.21,3.94-3.21,6.48v24.09c0,2.54,1.19,4.94,3.21,6.48l28.41,21.62c1.5,1.14,2.37,2.91,2.37,4.79Z"
          />
        </Svg>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
