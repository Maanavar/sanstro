/**
 * ShareCard — captures a snapshot of panchangam/guidance content and shares it
 * via the native share sheet (WhatsApp, Messages, etc.).
 *
 * Usage:
 *   const cardRef = useRef<ShareCardRef>(null);
 *   <ShareCard ref={cardRef} ... />
 *   <Button onPress={() => cardRef.current?.share()} />
 */

import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import ViewShot from "react-native-view-shot";
import Share from "react-native-share";
import { C } from "@/theme/colors";
import { S, RADIUS } from "@/theme/spacing";

export interface ShareCardProps {
  tamilDate: string;
  nallaNeram: string;
  rahuKalam: string;
  rasiPalanText: string;
  isTamil: boolean;
}

export interface ShareCardRef {
  share: () => Promise<void>;
}

export const ShareCard = forwardRef<ShareCardRef, ShareCardProps>(
  function ShareCard(
    { tamilDate, nallaNeram, rahuKalam, rasiPalanText, isTamil },
    ref
  ) {
    const shotRef = useRef<ViewShot>(null);

    useImperativeHandle(ref, () => ({
      async share() {
        if (!shotRef.current) return;
        try {
          const uri = await (shotRef.current as unknown as { capture(): Promise<string> }).capture();
          await Share.open({
            url: Platform.OS === "ios" ? uri : `file://${uri}`,
            type: "image/png",
            title: isTamil ? "விநாடி AI — இன்றைய பஞ்சாங்கம்" : "Vinaadi AI — Today's Panchangam",
          });
        } catch {
          // User dismissed the share sheet — non-fatal.
        }
      },
    }));

    return (
      <ViewShot ref={shotRef} options={{ format: "png", quality: 1 }}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.brand}>
              {isTamil ? "விநாடி AI" : "Vinaadi AI"}
            </Text>
            {!!tamilDate && (
              <Text style={styles.date}>{tamilDate}</Text>
            )}
          </View>

          {/* Nalla Neram */}
          <View style={styles.row}>
            <View style={[styles.dot, { backgroundColor: C.green }]} />
            <View>
              <Text style={styles.rowLabel}>
                {isTamil ? "நல்ல நேரம்" : "Nalla Neram"}
              </Text>
              <Text style={styles.rowValue}>{nallaNeram}</Text>
            </View>
          </View>

          {/* Rahu Kalam */}
          <View style={styles.row}>
            <View style={[styles.dot, { backgroundColor: C.caution }]} />
            <View>
              <Text style={styles.rowLabel}>
                {isTamil ? "ராகு காலம்" : "Rahu Kalam"}
              </Text>
              <Text style={[styles.rowValue, { color: C.caution }]}>
                {rahuKalam}
              </Text>
            </View>
          </View>

          {/* Rasi Palan snippet */}
          {!!rasiPalanText && (
            <View style={styles.palanBox}>
              <Text style={styles.palanText} numberOfLines={3}>
                {rasiPalanText}
              </Text>
            </View>
          )}

          {/* Footer */}
          <Text style={styles.footer}>vinaadi.app</Text>
        </View>
      </ViewShot>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    width: 320,
    backgroundColor: C.parchment,
    borderRadius: RADIUS.card,
    padding: S.base,
    gap: S.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
    paddingBottom: S.sm,
    gap: 2,
  },
  brand: {
    fontFamily: "NotoSansTamil_700Bold",
    fontSize: 16,
    lineHeight: 22,
    color: C.saffron,
  },
  date: {
    fontFamily: "NotoSansTamil_400Regular",
    fontSize: 12,
    lineHeight: 18,
    color: C.textSecond,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rowLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: C.textTertiary,
  },
  rowValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: C.textPrimary,
  },
  palanBox: {
    backgroundColor: C.surfaceAlt,
    borderRadius: 10,
    padding: S.sm,
  },
  palanText: {
    fontFamily: "NotoSansTamil_400Regular",
    fontSize: 13,
    lineHeight: 20,
    color: C.textPrimary,
  },
  footer: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: C.textTertiary,
    textAlign: "right",
  },
});
