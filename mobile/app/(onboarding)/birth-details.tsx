import React, { useState } from "react";
import {
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { useSession } from "@/hooks/useSession";
import { createBirthProfile } from "@/api/charts";
import { setPrimaryChartId, setPrimaryProfileId } from "@/lib/userPrefs";

async function geocodeBirthPlace(place: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "VinaadAI/1.0 (mobile@vinaadi.app)" },
    });
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

const GENDER_OPTIONS = [
  { key: "male", ta: "ஆண்", en: "Male" },
  { key: "female", ta: "பெண்", en: "Female" },
  { key: "other", ta: "மற்றவை", en: "Other" },
];

export default function BirthDetailsScreen() {
  const { lang } = useI18n();
  const { user } = useSession();
  const isTamil = lang === "ta";

  // Internal step: 0 = name+dob+gender, 1 = birth time+place
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 0 fields
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [gender, setGender] = useState("male");

  // Step 1 fields
  const [birthTimeHour, setBirthTimeHour] = useState("");
  const [birthTimeMin, setBirthTimeMin] = useState("");
  const [birthAmPm, setBirthAmPm] = useState<"AM" | "PM">("AM");
  const [birthPlace, setBirthPlace] = useState("");
  const [birthTimeUnknown, setBirthTimeUnknown] = useState(false);

  function validateStep0(): boolean {
    if (!displayName.trim()) {
      setError(isTamil ? "பெயர் தேவை." : "Name is required.");
      return false;
    }
    const d = parseInt(dobDay), m = parseInt(dobMonth), y = parseInt(dobYear);
    const curYear = new Date().getFullYear();
    const dateObj = new Date(y, m - 1, d);
    if (isNaN(d) || isNaN(m) || isNaN(y) || y < 1900 || y > curYear || dateObj.getMonth() !== m - 1) {
      setError(isTamil ? "சரியான பிறந்த தேதி தேவை." : "Enter a valid date of birth.");
      return false;
    }
    setError(null);
    return true;
  }

  function validateStep1(): boolean {
    if (!birthPlace.trim()) {
      setError(isTamil ? "பிறந்த இடம் தேவை." : "Birth place is required.");
      return false;
    }
    if (!birthTimeUnknown) {
      const h = parseInt(birthTimeHour), m = parseInt(birthTimeMin);
      if (isNaN(h) || isNaN(m) || h < 1 || h > 12 || m < 0 || m > 59) {
        setError(isTamil ? "சரியான நேரம் கொடுங்கள்." : "Enter a valid time (HH:MM).");
        return false;
      }
    }
    setError(null);
    return true;
  }

  async function handleSubmit() {
    if (!validateStep1()) return;
    setLoading(true);
    try {
      const day = parseInt(dobDay).toString().padStart(2, "0");
      const month = parseInt(dobMonth).toString().padStart(2, "0");
      const birthDateLocal = `${dobYear}-${month}-${day}`;

      let birthTimeLocal: string | undefined;
      if (!birthTimeUnknown && birthTimeHour && birthTimeMin) {
        let h = parseInt(birthTimeHour);
        const m = parseInt(birthTimeMin);
        if (birthAmPm === "PM" && h !== 12) h += 12;
        if (birthAmPm === "AM" && h === 12) h = 0;
        birthTimeLocal = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:00`;
      }

      const geo = await geocodeBirthPlace(birthPlace.trim());
      if (!geo) {
        setError(
          isTamil
            ? "இடம் கிடைக்கவில்லை. சரியான நகரம் பெயர் கொடுங்கள்."
            : "Location not found. Please enter a valid city name."
        );
        setLoading(false);
        return;
      }

      const res = await createBirthProfile({
        displayName: displayName.trim(),
        birthDateLocal,
        birthTimeLocal,
        birthPlace: birthPlace.trim(),
        birthLatitude: geo.lat,
        birthLongitude: geo.lon,
        birthTimezone: "Asia/Kolkata",
        calculateNow: true,
        genderForTraditionalRules: gender === "other" ? null : gender,
      });

      const { birthProfileId, chartId } = res.data;
      await setPrimaryProfileId(birthProfileId);
      if (chartId) await setPrimaryChartId(chartId);
      router.replace({
        pathname: "/(onboarding)/jadhagam-reveal",
        params: { chartId: chartId ?? "", profileId: birthProfileId },
      });
    } catch {
      setError(isTamil ? "சர்வர் பிழை. மீண்டும் முயற்சிக்கவும்." : "Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleNext() {
    if (step === 0) {
      if (validateStep0()) setStep(1);
    } else {
      handleSubmit();
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Back */}
          <TouchableOpacity
            onPress={() => step === 0 ? router.back() : setStep(0)}
            style={styles.back}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.backText}>← {isTamil ? "பின்னால்" : "Back"}</Text>
          </TouchableOpacity>

          {/* Progress dots: overall steps 1-4, this screen is steps 2-3 */}
          <View style={styles.dotsRow}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[styles.dot, i === step + 1 && styles.dotActive]} />
            ))}
          </View>

          {step === 0 ? (
            <>
              <Text style={[styles.heading, isTamil ? TamilType.display : EnType.display]}>
                {isTamil ? "உங்கள் விவரங்கள்" : "Your Details"}
              </Text>

              <View style={styles.form}>
                <Text style={[styles.label, isTamil ? TamilType.caption : EnType.caption]}>
                  {isTamil ? "பெயர்" : "Name"}
                </Text>
                <TextInput
                  style={styles.input}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder={isTamil ? "உங்கள் பெயர்" : "Your name"}
                  placeholderTextColor={C.textTertiary}
                  autoCapitalize="words"
                />

                <Text style={[styles.label, isTamil ? TamilType.caption : EnType.caption]}>
                  {isTamil ? "பிறந்த தேதி" : "Date of Birth"}
                </Text>
                <View style={styles.dobRow}>
                  <TextInput
                    style={[styles.input, styles.dobPart]}
                    value={dobDay} onChangeText={setDobDay}
                    placeholder={isTamil ? "நாள்" : "DD"}
                    placeholderTextColor={C.textTertiary}
                    keyboardType="number-pad" maxLength={2}
                  />
                  <TextInput
                    style={[styles.input, styles.dobPart]}
                    value={dobMonth} onChangeText={setDobMonth}
                    placeholder={isTamil ? "மாதம்" : "MM"}
                    placeholderTextColor={C.textTertiary}
                    keyboardType="number-pad" maxLength={2}
                  />
                  <TextInput
                    style={[styles.input, styles.dobYear]}
                    value={dobYear} onChangeText={setDobYear}
                    placeholder={isTamil ? "ஆண்டு" : "YYYY"}
                    placeholderTextColor={C.textTertiary}
                    keyboardType="number-pad" maxLength={4}
                  />
                </View>

                <Text style={[styles.label, isTamil ? TamilType.caption : EnType.caption]}>
                  {isTamil ? "பாலினம்" : "Gender"}
                </Text>
                <View style={styles.genderRow}>
                  {GENDER_OPTIONS.map((g) => (
                    <TouchableOpacity
                      key={g.key}
                      style={[styles.genderChip, gender === g.key && styles.genderChipActive]}
                      onPress={() => setGender(g.key)}
                    >
                      <Text style={[styles.genderChipText, gender === g.key && styles.genderChipTextActive]}>
                        {isTamil ? g.ta : g.en}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.infoStrip} activeOpacity={0.7}>
                  <Text style={styles.infoLink}>
                    {isTamil ? "ஏன் இந்த விவரங்கள்? ▸" : "Why do we need this? ▸"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.heading, isTamil ? TamilType.display : EnType.display]}>
                {isTamil ? "பிறந்த நேரமும் இடமும்" : "Birth Time & Place"}
              </Text>
              <Text style={[styles.sub, isTamil ? TamilType.caption : EnType.caption]}>
                {isTamil ? "திருக்கணித ஜாதகத்திற்கு இவை அவசியம்" : "Required for Thirukanitham precision"}
              </Text>

              <View style={styles.form}>
                <Text style={[styles.label, isTamil ? TamilType.caption : EnType.caption]}>
                  {isTamil ? "பிறந்த நேரம்" : "Birth Time"}
                </Text>
                {birthTimeUnknown ? (
                  <View style={styles.unknownBox}>
                    <Text style={[styles.unknownText, isTamil ? TamilType.caption : EnType.caption]}>
                      {isTamil ? "தோராய நேரம் பயன்படுத்தப்படும்." : "An approximate time will be used."}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.timeRow}>
                    <TextInput
                      style={[styles.input, styles.timePart]}
                      value={birthTimeHour} onChangeText={setBirthTimeHour}
                      placeholder="HH" placeholderTextColor={C.textTertiary}
                      keyboardType="number-pad" maxLength={2}
                    />
                    <Text style={styles.timeColon}>:</Text>
                    <TextInput
                      style={[styles.input, styles.timePart]}
                      value={birthTimeMin} onChangeText={setBirthTimeMin}
                      placeholder="MM" placeholderTextColor={C.textTertiary}
                      keyboardType="number-pad" maxLength={2}
                    />
                    {(["AM", "PM"] as const).map((ap) => (
                      <TouchableOpacity
                        key={ap}
                        style={[styles.ampmChip, birthAmPm === ap && styles.ampmChipActive]}
                        onPress={() => setBirthAmPm(ap)}
                      >
                        <Text style={[styles.ampmText, birthAmPm === ap && styles.ampmTextActive]}>{ap}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <TouchableOpacity style={styles.infoStrip} onPress={() => setBirthTimeUnknown(!birthTimeUnknown)}>
                  <Text style={styles.infoLink}>
                    {birthTimeUnknown
                      ? (isTamil ? "நேரம் தெரியும் →" : "I know the time →")
                      : (isTamil ? "தெரியவில்லை?" : "Don't know the time?")}
                  </Text>
                </TouchableOpacity>

                <Text style={[styles.label, isTamil ? TamilType.caption : EnType.caption]}>
                  {isTamil ? "பிறந்த இடம்" : "Birth Place"}
                </Text>
                <TextInput
                  style={styles.input}
                  value={birthPlace}
                  onChangeText={setBirthPlace}
                  placeholder={isTamil ? "நகரம், மாவட்டம்" : "City, District"}
                  placeholderTextColor={C.textTertiary}
                  autoCapitalize="words"
                />
                <Text style={styles.placeSub}>
                  {isTamil ? "எ.கா.: Chennai, Madurai, Coimbatore" : "e.g., Chennai, Madurai, Coimbatore"}
                </Text>
              </View>
            </>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
            onPress={handleNext}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>
              {loading
                ? "…"
                : step === 0
                  ? (isTamil ? "அடுத்தது →" : "Next →")
                  : (isTamil ? "ஜாதகம் உருவாக்கு" : "Create My Jadhagam")}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.parchment },
  scroll: { paddingHorizontal: S.base, paddingTop: S.xl, paddingBottom: S.xxl },
  back: { marginBottom: S.base },
  backText: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textSecond },
  dotsRow: { flexDirection: "row", gap: 6, justifyContent: "center", marginBottom: S.xl },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.divider },
  dotActive: { backgroundColor: C.saffron, width: 24, borderRadius: 4 },
  heading: { color: C.textPrimary, marginBottom: S.sm },
  sub: { color: C.textTertiary, marginBottom: S.xl },
  form: { gap: S.sm },
  label: { color: C.textSecond, marginBottom: 2 },
  input: {
    backgroundColor: C.surfaceAlt,
    borderRadius: RADIUS.input,
    height: 48,
    paddingHorizontal: S.md,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: C.textPrimary,
  },
  dobRow: { flexDirection: "row", gap: S.sm },
  dobPart: { flex: 1 },
  dobYear: { flex: 2 },
  genderRow: { flexDirection: "row", gap: S.sm },
  genderChip: {
    flex: 1, height: 40, alignItems: "center", justifyContent: "center",
    borderRadius: RADIUS.chip, borderWidth: 1, borderColor: C.divider,
    backgroundColor: C.surfaceAlt,
  },
  genderChipActive: { backgroundColor: C.saffron, borderColor: C.saffron },
  genderChipText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.textPrimary },
  genderChipTextActive: { color: C.surface },
  infoStrip: { paddingVertical: S.xs },
  infoLink: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.saffron },
  timeRow: { flexDirection: "row", gap: S.sm, alignItems: "center" },
  timePart: { width: 64 },
  timeColon: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.textPrimary },
  ampmChip: {
    height: 40, paddingHorizontal: S.md, alignItems: "center", justifyContent: "center",
    borderRadius: RADIUS.chip, borderWidth: 1, borderColor: C.divider,
    backgroundColor: C.surfaceAlt,
  },
  ampmChipActive: { backgroundColor: C.saffron, borderColor: C.saffron },
  ampmText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.textPrimary },
  ampmTextActive: { color: C.surface },
  unknownBox: {
    backgroundColor: C.surfaceAlt, borderRadius: RADIUS.input,
    height: 48, justifyContent: "center", paddingHorizontal: S.md,
  },
  unknownText: { color: C.textSecond },
  placeSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textTertiary },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.alert, marginTop: S.sm },
  primaryBtn: {
    backgroundColor: C.saffron, borderRadius: RADIUS.button,
    height: 52, alignItems: "center", justifyContent: "center", marginTop: S.xl,
  },
  primaryBtnText: { fontFamily: "NotoSansTamil_700Bold", fontSize: 16, lineHeight: 24, color: C.surface },
});
