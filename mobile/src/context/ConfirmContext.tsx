/**
 * Global confirmation bottom sheet — replaces Alert.alert() two-button confirms.
 * Design spec: UX Excellence Audit §Finding 12
 *
 * Usage:
 *   const confirm = useConfirm();
 *   await confirm({
 *     title: "Remove goal?",
 *     body: "This will mark the goal as inactive.",
 *     confirmLabel: "Remove",
 *     style: "destructive",
 *   });
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { RADIUS, S } from "@/theme/spacing";
import { spring } from "@/theme/motion";

interface ConfirmOptions {
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  style?: "default" | "destructive";
}

type ConfirmContextValue = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const C = useColors();
  const sheetRef = useRef<BottomSheet>(null);
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setOpts(options);
      if (options.style === "destructive") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
      sheetRef.current?.snapToIndex(0);
    });
  }, []);

  function handleConfirm() {
    sheetRef.current?.close();
    resolveRef.current?.(true);
    resolveRef.current = null;
  }

  function handleCancel() {
    sheetRef.current?.close();
    resolveRef.current?.(false);
    resolveRef.current = null;
  }

  const snapPoints = useMemo(() => ["35%"], []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} onPress={handleCancel} />
    ),
    []
  );

  const isDestructive = opts?.style === "destructive";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        onClose={handleCancel}
        animationConfigs={spring.gentle}
        backgroundStyle={{ backgroundColor: C.parchmentDeep }}
        handleIndicatorStyle={{ backgroundColor: C.divider }}
      >
        <BottomSheetView style={styles.content}>
          {opts && (
            <>
              <Text style={[styles.title, { color: C.textPrimary }]}>{opts.title}</Text>
              {opts.body ? (
                <Text style={[styles.body, { color: C.textSecond }]}>{opts.body}</Text>
              ) : null}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.btn, styles.cancelBtn, { borderColor: C.divider }]}
                  onPress={handleCancel}
                  accessibilityRole="button"
                >
                  <Text style={[styles.btnText, { color: C.textSecond }]}>
                    {opts.cancelLabel ?? "Cancel"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.btn,
                    styles.confirmBtn,
                    { backgroundColor: isDestructive ? C.alert : C.gold },
                  ]}
                  onPress={handleConfirm}
                  accessibilityRole="button"
                >
                  <Text style={[styles.btnText, styles.confirmBtnText]}>
                    {opts.confirmLabel ?? "Confirm"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </BottomSheetView>
      </BottomSheet>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return ctx;
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: S.xl,
    paddingTop: S.lg,
    paddingBottom: S["2xl"],
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: S.sm,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: S.xl,
  },
  actions: {
    flexDirection: "row",
    gap: S.md,
    marginTop: S.lg,
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: {
    borderWidth: 1,
  },
  confirmBtn: {},
  btnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  confirmBtnText: {
    color: "#FFFFFF",
  },
});
