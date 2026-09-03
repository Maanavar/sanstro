import React, { useState } from "react";
import {
  StyleSheet, Text, TouchableOpacity, View,} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Location from "expo-location";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { saveGuestPrefs } from "@/features/guest/guestStore";
import { trackEvent } from "@/lib/analytics";

export default function LocationScreen() {
  const { t, strings, lang } = useI18n();
  const isTamil = lang === "ta";
  const [loading, setLoading] = useState(false);

  async function handleAllow() {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const [geo] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        await saveGuestPrefs({
          lat: loc.coords.latitude,
          lon: loc.coords.longitude,
          city: geo?.city ?? geo?.region ?? null,
        });
      }
    } finally {
      setLoading(false);
      trackEvent("onboarding_step_completed", { step: "location_entry" });
      router.replace("/(onboarding)/rasi-picker");
    }
  }

  function handleSkip() {
    trackEvent("onboarding_step_completed", { step: "location_entry", skipped: true });
    router.replace("/(onboarding)/rasi-picker");
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.illustration}>
        <Text style={styles.mapEmoji}>🗺️</Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.heading, isTamil ? TamilType.display : EnType.display]}>
          {isTamil ? "உங்கள் இடம் எங்கே?" : "Where are you located?"}
        </Text>
        <Text style={[styles.body, isTamil ? TamilType.body : EnType.body]}>
          {isTamil
            ? "இன்றைய நல்ல நேரம் உங்கள் நகரில் கணக்கிட அனுமதிக்கவும்."
            : "Allow location to calculate today's nalla neram for your city."}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryBtn, loading && styles.btnDisabled]}
          onPress={handleAllow}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>
            {loading ? t(strings.common.loading) : (isTamil ? "அனுமதிக்க" : "Allow Location")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSkip} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={[styles.skipText, isTamil ? TamilType.bodySmall : EnType.bodySmall]}>
            {isTamil ? "பின்னர் — நகரம் கைமுறையாக உள்ளிடு" : "Enter city manually later"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.parchment,
    paddingHorizontal: S.base,
  },
  illustration: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mapEmoji: {
    fontSize: 120,
  },
  content: {
    paddingBottom: S.xl,
    gap: S.md,
  },
  heading: {
    color: C.textPrimary,
    textAlign: "center",
  },
  body: {
    color: C.textSecond,
    textAlign: "center",
  },
  actions: {
    paddingBottom: S.xxl,
    gap: S.base,
    alignItems: "center",
  },
  primaryBtn: {
    backgroundColor: C.saffron,
    borderRadius: RADIUS.button,
    height: 52,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    fontFamily: "NotoSansTamil_700Bold",
    fontSize: 16,
    lineHeight: 24,
    color: C.surface,
  },
  skipText: {
    color: C.textTertiary,
    textDecorationLine: "underline",
  },
});
