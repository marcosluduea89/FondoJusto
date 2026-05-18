import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

interface WelcomeScreenProps {
  onFinish: () => void;
}

export function WelcomeScreen({ onFinish }: WelcomeScreenProps) {
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.88)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslate = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(iconOpacity, {
          duration: 650,
          easing: Easing.out(Easing.cubic),
          toValue: 1,
          useNativeDriver: true
        }),
        Animated.spring(iconScale, {
          damping: 13,
          mass: 0.8,
          stiffness: 95,
          toValue: 1,
          useNativeDriver: true
        })
      ]),
      Animated.delay(180),
      Animated.parallel([
        Animated.timing(textOpacity, {
          duration: 520,
          easing: Easing.out(Easing.cubic),
          toValue: 1,
          useNativeDriver: true
        }),
        Animated.timing(textTranslate, {
          duration: 520,
          easing: Easing.out(Easing.cubic),
          toValue: 0,
          useNativeDriver: true
        })
      ]),
      Animated.delay(700)
    ]);

    animation.start(({ finished }) => {
      if (finished) onFinish();
    });

    return () => animation.stop();
  }, [iconOpacity, iconScale, onFinish, textOpacity, textTranslate]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoMark, { opacity: iconOpacity, transform: [{ scale: iconScale }] }]}>
        <View style={styles.logoGlow} />
        <Text style={styles.logoInitials}>FJ</Text>
      </Animated.View>
      <Animated.Text
        style={[
          styles.brand,
          {
            opacity: textOpacity,
            transform: [{ translateY: textTranslate }]
          }
        ]}
      >
        FondoJusto
      </Animated.Text>
      <Animated.Text style={[styles.tagline, { opacity: textOpacity }]}>
        Finanzas compartidas
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 0,
    marginTop: 20
  },
  container: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center",
    padding: 24
  },
  logoGlow: {
    backgroundColor: colors.softGreen,
    borderRadius: 54,
    bottom: -8,
    left: -8,
    position: "absolute",
    right: -8,
    top: -8
  },
  logoInitials: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 0
  },
  logoMark: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
    borderRadius: 42,
    borderWidth: 1,
    height: 84,
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    width: 84
  },
  tagline: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0,
    marginTop: 6
  }
});
