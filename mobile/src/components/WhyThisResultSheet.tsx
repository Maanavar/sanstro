import React, { forwardRef, useCallback, useMemo, useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { spring } from "@/theme/motion";

export interface WhyItem {
  label: string;
  value: string;
}

interface Props {
  title?: string;
  items: WhyItem[];
}

export interface WhySheetHandle {
  open: () => void;
  close: () => void;
}

export const WhyThisResultSheet = forwardRef<WhySheetHandle, Props>(
  ({ title = "How was this calculated?", items }, ref) => {
    const sheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ["50%", "80%"], []);

    React.useImperativeHandle(ref, () => ({
      open: () => sheetRef.current?.snapToIndex(0),
      close: () => sheetRef.current?.close(),
    }));

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.45}
        />
      ),
      []
    );

    return (
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        animationConfigs={spring.gentle}
        handleIndicatorStyle={styles.handle}
        backgroundStyle={styles.background}
      >
        <BottomSheetView style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <TouchableOpacity
              onPress={() => sheetRef.current?.close()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.methodBadge}>
            <Text style={styles.methodBadgeText}>◉ Thirukanitham</Text>
          </View>
          <View style={styles.itemList}>
            {items.map((item, i) => (
              <View key={i} style={styles.itemRow}>
                <View style={styles.bullet} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  <Text style={styles.itemValue}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

WhyThisResultSheet.displayName = "WhyThisResultSheet";

const styles = StyleSheet.create({
  handle: { backgroundColor: C.divider, width: 40 },
  background: { backgroundColor: C.surface, borderTopLeftRadius: RADIUS.bottomSheet, borderTopRightRadius: RADIUS.bottomSheet },
  content: { flex: 1, padding: S.base, gap: S.md },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sheetTitle: { fontFamily: "Inter_700Bold", fontSize: 16, color: C.textPrimary, flex: 1 },
  closeBtn: { fontFamily: "Inter_400Regular", fontSize: 18, color: C.textTertiary },
  methodBadge: {
    alignSelf: "flex-start",
    backgroundColor: C.goldMethodLight,
    borderRadius: RADIUS.chip,
    paddingHorizontal: S.md,
    paddingVertical: S.xs,
    borderWidth: 1,
    borderColor: C.goldMethod + "44",
  },
  methodBadgeText: { fontFamily: "NotoSansTamil_700Bold", fontSize: 11, color: C.goldMethod },
  itemList: { gap: S.md },
  itemRow: { flexDirection: "row", gap: S.sm, alignItems: "flex-start" },
  bullet: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: C.goldMethod, marginTop: 5,
  },
  itemLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.textSecond },
  itemValue: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textPrimary, lineHeight: 20 },
});
