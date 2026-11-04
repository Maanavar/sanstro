import React, { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import type { ColorTokens } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { formatPlaceLabel, usePlaceSuggestions } from "@/lib/placeSearch";
import type {
  BirthDetailsFormState,
  BirthFieldError,
  BirthFormErrors,
  BirthGender,
} from "@/lib/birthDetailsForm";

/**
 * The birth-input block — name, date of birth, gender, birth time and birth
 * place — as one controlled component, so the add-member and member-edit
 * screens render the same fields instead of each growing their own copy. State,
 * validation and payload building live in `@/lib/birthDetailsForm`; this only
 * draws them and wires the offline place search.
 *
 * Not used by onboarding yet: that screen owns the opt-in online-geocode and
 * "Use Chennai" fallbacks (owner ruling B-006) and stays on its own JSX until it
 * can be device-tested against this component.
 */

const GENDER_OPTIONS: { key: BirthGender; ta: string; en: string }[] = [
  { key: "male", ta: "ஆண்", en: "Male" },
  { key: "female", ta: "பெண்", en: "Female" },
  { key: "other", ta: "மற்றவை", en: "Other" },
];

function errorText(code: BirthFieldError, isTamil: boolean): string {
  switch (code) {
    case "name_required":
      return isTamil ? "பெயர் தேவை." : "Name is required.";
    case "date_invalid":
      return isTamil ? "சரியான பிறந்த தேதி தேவை." : "Enter a valid date of birth.";
    case "place_required":
      return isTamil ? "பிறந்த இடம் தேவை." : "Birth place is required.";
    case "place_not_selected":
      return isTamil
        ? "பட்டியலிலிருந்து ஒரு இடத்தைத் தேர்ந்தெடுக்கவும்."
        : "Select a place from the list.";
    case "time_invalid":
      return isTamil ? "சரியான நேரம் கொடுங்கள்." : "Enter a valid time (HH:MM).";
  }
}

export interface BirthDetailsFieldsProps {
  value: BirthDetailsFormState;
  onChange: (patch: Partial<BirthDetailsFormState>) => void;
  errors?: BirthFormErrors;
  isTamil: boolean;
  /** Onboarding and add-member show a name field; the edit screen names elsewhere. */
  showName?: boolean;
  showGender?: boolean;
}

export function BirthDetailsFields({
  value,
  onChange,
  errors = {},
  isTamil,
  showName = true,
  showGender = true,
}: BirthDetailsFieldsProps) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const T = isTamil ? TamilType : EnType;

  // Search only while nothing is picked: once a suggestion is chosen the field
  // holds a formatted label, and re-searching it would reopen the list.
  const { suggestions, loading, clear } = usePlaceSuggestions(value.placeLabel, !value.selected);

  function pick(place: Parameters<typeof formatPlaceLabel>[0]) {
    Haptics.selectionAsync();
    const label = formatPlaceLabel(place);
    onChange({
      placeLabel: label,
      selected: { lat: place.lat, lon: place.lng, timezone: place.timezone },
      timezone: place.timezone,
    });
    clear();
  }

  return (
    <View style={styles.wrap}>
      {showName && (
        <View style={styles.field}>
          <Text style={[styles.label, { fontFamily: T.caption.fontFamily }]}>
            {isTamil ? "பெயர்" : "Name"}
          </Text>
          <TextInput
            style={[styles.input, { fontFamily: T.body.fontFamily }]}
            value={value.displayName}
            onChangeText={(displayName) => onChange({ displayName })}
            placeholder={isTamil ? "பெயர்" : "Name"}
            placeholderTextColor={C.textTertiary}
            autoCapitalize="words"
            accessibilityLabel={isTamil ? "பெயர்" : "Name"}
          />
          {errors.name && <Text style={styles.error}>{errorText(errors.name, isTamil)}</Text>}
        </View>
      )}

      <View style={styles.field}>
        <Text style={[styles.label, { fontFamily: T.caption.fontFamily }]}>
          {isTamil ? "பிறந்த தேதி" : "Date of Birth"}
        </Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.dobPart, { fontFamily: T.body.fontFamily }]}
            value={value.dobDay}
            onChangeText={(dobDay) => onChange({ dobDay })}
            placeholder={isTamil ? "நாள்" : "DD"}
            placeholderTextColor={C.textTertiary}
            keyboardType="number-pad"
            maxLength={2}
            accessibilityLabel={isTamil ? "நாள்" : "Day"}
          />
          <TextInput
            style={[styles.input, styles.dobPart, { fontFamily: T.body.fontFamily }]}
            value={value.dobMonth}
            onChangeText={(dobMonth) => onChange({ dobMonth })}
            placeholder={isTamil ? "மாதம்" : "MM"}
            placeholderTextColor={C.textTertiary}
            keyboardType="number-pad"
            maxLength={2}
            accessibilityLabel={isTamil ? "மாதம்" : "Month"}
          />
          <TextInput
            style={[styles.input, styles.dobYear, { fontFamily: T.body.fontFamily }]}
            value={value.dobYear}
            onChangeText={(dobYear) => onChange({ dobYear })}
            placeholder={isTamil ? "ஆண்டு" : "YYYY"}
            placeholderTextColor={C.textTertiary}
            keyboardType="number-pad"
            maxLength={4}
            accessibilityLabel={isTamil ? "ஆண்டு" : "Year"}
          />
        </View>
        {errors.date && <Text style={styles.error}>{errorText(errors.date, isTamil)}</Text>}
      </View>

      {showGender && (
        <View style={styles.field}>
          <Text style={[styles.label, { fontFamily: T.caption.fontFamily }]}>
            {isTamil ? "பாலினம்" : "Gender"}
          </Text>
          <View style={styles.row}>
            {GENDER_OPTIONS.map((g) => {
              const active = value.gender === g.key;
              return (
                <TouchableOpacity
                  key={g.key}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    onChange({ gender: g.key });
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {isTamil ? g.ta : g.en}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.field}>
        <Text style={[styles.label, { fontFamily: T.caption.fontFamily }]}>
          {isTamil ? "பிறந்த நேரம்" : "Birth Time"}
        </Text>
        {value.timeUnknown ? (
          <View style={styles.unknownBox}>
            <Text style={[styles.help, { fontFamily: T.caption.fontFamily }]}>
              {isTamil ? "தோராய நேரம் பயன்படுத்தப்படும்." : "An approximate time will be used."}
            </Text>
          </View>
        ) : (
          <View style={styles.timeRow}>
            <TextInput
              style={[styles.input, styles.timePart, { fontFamily: T.body.fontFamily }]}
              value={value.timeHour}
              onChangeText={(timeHour) => onChange({ timeHour })}
              placeholder="HH"
              placeholderTextColor={C.textTertiary}
              keyboardType="number-pad"
              maxLength={2}
              accessibilityLabel={isTamil ? "மணி" : "Hour"}
            />
            <Text style={styles.colon}>:</Text>
            <TextInput
              style={[styles.input, styles.timePart, { fontFamily: T.body.fontFamily }]}
              value={value.timeMin}
              onChangeText={(timeMin) => onChange({ timeMin })}
              placeholder="MM"
              placeholderTextColor={C.textTertiary}
              keyboardType="number-pad"
              maxLength={2}
              accessibilityLabel={isTamil ? "நிமிடம்" : "Minute"}
            />
            {(["AM", "PM"] as const).map((ap) => {
              const active = value.ampm === ap;
              return (
                <TouchableOpacity
                  key={ap}
                  style={[styles.ampmChip, active && styles.chipActive]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    onChange({ ampm: ap });
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{ap}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => onChange({ timeUnknown: !value.timeUnknown })}
        >
          <Text style={styles.link}>
            {value.timeUnknown
              ? isTamil
                ? "நேரம் தெரியும் →"
                : "I know the time →"
              : isTamil
                ? "நேரம் தெரியவில்லையா?"
                : "Don't know the time?"}
          </Text>
        </TouchableOpacity>
        {errors.time && <Text style={styles.error}>{errorText(errors.time, isTamil)}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { fontFamily: T.caption.fontFamily }]}>
          {isTamil ? "பிறந்த இடம்" : "Birth Place"}
        </Text>
        <TextInput
          style={[styles.input, { fontFamily: T.body.fontFamily }]}
          value={value.placeLabel}
          onChangeText={(placeLabel) => onChange({ placeLabel, selected: null, timezone: "" })}
          placeholder={isTamil ? "நகரம் தட்டச்சு செய்யவும்" : "Type a city"}
          placeholderTextColor={C.textTertiary}
          autoCapitalize="words"
          autoCorrect={false}
          accessibilityLabel={isTamil ? "பிறந்த இடம்" : "Birth place"}
        />
        {loading && <ActivityIndicator size="small" color={C.saffron} style={{ alignSelf: "flex-start" }} />}
        {suggestions.length > 0 && (
          <View style={styles.suggestionBox}>
            {suggestions.map((place) => (
              <TouchableOpacity key={place.geonameId} style={styles.suggestionRow} onPress={() => pick(place)}>
                <Text style={[styles.suggestionText, { fontFamily: T.body.fontFamily }]} numberOfLines={1}>
                  {formatPlaceLabel(place)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {!value.placeLabel.trim() && (
          <Text style={[styles.help, { fontFamily: T.caption.fontFamily }]}>
            {isTamil ? "எ.கா.: Chennai, Madurai, London" : "e.g., Chennai, Madurai, London"}
          </Text>
        )}
        {value.selected && (
          <View style={styles.tzChip}>
            <Text style={styles.tzLabel}>Timezone</Text>
            <TextInput
              style={styles.tzInput}
              value={value.timezone}
              onChangeText={(timezone) => onChange({ timezone })}
              placeholder="Asia/Kolkata"
              placeholderTextColor={C.textTertiary}
              autoCapitalize="none"
              accessibilityLabel="Timezone"
            />
          </View>
        )}
        {errors.place && <Text style={styles.error}>{errorText(errors.place, isTamil)}</Text>}
      </View>
    </View>
  );
}

function makeStyles(C: ColorTokens) {
  return StyleSheet.create({
    wrap: { gap: S.md },
    field: { gap: S.xs },
    label: { fontSize: 12, color: C.textTertiary },
    input: {
      minHeight: 48,
      borderRadius: RADIUS.button,
      borderWidth: 1.5,
      borderColor: C.divider,
      paddingHorizontal: S.md,
      fontSize: 15,
      color: C.textPrimary,
      backgroundColor: C.parchment,
    },
    row: { flexDirection: "row", gap: S.sm, flexWrap: "wrap" },
    dobPart: { flex: 1, minWidth: 64 },
    dobYear: { flex: 2, minWidth: 90 },
    chip: {
      minHeight: 44,
      flex: 1,
      minWidth: 72,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: S.md,
      borderRadius: RADIUS.chip,
      borderWidth: 1.5,
      borderColor: C.divider,
    },
    chipActive: { borderColor: C.saffron, backgroundColor: C.saffron + "22" },
    chipText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.textSecond },
    chipTextActive: { color: C.textPrimary },
    timeRow: { flexDirection: "row", gap: S.sm, alignItems: "center" },
    timePart: { width: 64 },
    colon: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.textPrimary },
    ampmChip: {
      minHeight: 44,
      paddingHorizontal: S.md,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: RADIUS.chip,
      borderWidth: 1.5,
      borderColor: C.divider,
    },
    unknownBox: {
      minHeight: 48,
      borderRadius: RADIUS.button,
      backgroundColor: C.surfaceAlt,
      justifyContent: "center",
      paddingHorizontal: S.md,
    },
    linkBtn: { minHeight: 36, justifyContent: "center" },
    link: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.saffron },
    help: { fontSize: 12, color: C.textTertiary },
    error: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.alert },
    suggestionBox: {
      borderRadius: RADIUS.input,
      borderWidth: 1,
      borderColor: C.divider,
      overflow: "hidden",
      backgroundColor: C.surfaceAlt,
    },
    suggestionRow: {
      paddingHorizontal: S.md,
      paddingVertical: S.sm,
      borderBottomWidth: 1,
      borderBottomColor: C.divider,
    },
    suggestionText: { color: C.textPrimary },
    tzChip: {
      flexDirection: "row",
      alignSelf: "flex-start",
      alignItems: "center",
      gap: S.sm,
      backgroundColor: C.surfaceAlt,
      borderRadius: RADIUS.chip,
      paddingHorizontal: S.md,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: C.divider,
    },
    tzLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textSecond },
    tzInput: { minWidth: 132, padding: 0, fontFamily: "Inter_600SemiBold", fontSize: 12, color: C.textPrimary },
  });
}
