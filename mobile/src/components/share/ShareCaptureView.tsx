import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import { Alert, Platform, Pressable, StyleProp, View, ViewStyle } from "react-native";

export interface ShareCaptureRef {
  share: () => Promise<void>;
}

export interface ShareCaptureViewProps {
  children: React.ReactNode;
  fileName?: string;
  title?: string;
  message?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  delayLongPress?: number;
}

export const ShareCaptureView = forwardRef<ShareCaptureRef, ShareCaptureViewProps>(
  function ShareCaptureView(
    {
      children,
      fileName = "vinaadi-share-card",
      title = "Vinaadi AI",
      message = "Shared from Vinaadi AI",
      style,
      disabled = false,
      delayLongPress = 520,
    },
    ref
  ) {
    const viewRef = useRef<View>(null);
    const [sharing, setSharing] = useState(false);

    async function share() {
      if (disabled || sharing || !viewRef.current) return;
      setSharing(true);
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { captureRef } = require("react-native-view-shot") as {
          captureRef: (
            ref: unknown,
            opts: { format: "png"; quality: number; result: "tmpfile"; fileName?: string }
          ) => Promise<string>;
        };
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Share = (require("react-native-share") as {
          default: { open: (opts: Record<string, unknown>) => Promise<void> };
        }).default;

        const uri = await captureRef(viewRef.current, {
          format: "png",
          quality: 1,
          result: "tmpfile",
          fileName,
        });
        await Share.open({
          url: Platform.OS === "ios" ? uri : `file://${uri}`,
          type: "image/png",
          title,
          message,
          failOnCancel: false,
        });
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        const messageText = error instanceof Error ? error.message : "";
        if (!messageText.toLowerCase().includes("cancel")) {
          Alert.alert("Share unavailable", "Could not create the share card on this device.");
        }
      } finally {
        setSharing(false);
      }
    }

    useImperativeHandle(ref, () => ({ share }));

    return (
      <Pressable onLongPress={share} delayLongPress={delayLongPress} disabled={disabled}>
        <View ref={viewRef} collapsable={false} style={style}>
          {children}
        </View>
      </Pressable>
    );
  }
);
