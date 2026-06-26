import React, { useMemo } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  type ViewStyle,
} from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import type { ColorTokens } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";

type Props = {
  /** The always-visible header row content (excluding the toggle chevron). */
  header: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
  /** Style applied to the expanded body container. */
  bodyStyle?: ViewStyle;
  activeOpacity?: number;
};

/**
 * Controlled expandable row with a chevron toggle.
 *
 * Replaces the repeated expand/collapse pattern in varshaphala (bhava rows),
 * dosham (dosha cards), and dasha/index.tsx (3+ screens, ~20 instances).
 *
 * Usage:
 *   const [open, setOpen] = useState(false);
 *   <AccordionRow header={<Text>Title</Text>} expanded={open} onToggle={() => setOpen(v => !v)}>
 *     <Text>Body</Text>
 *   </AccordionRow>
 */
export function AccordionRow({
  header,
  expanded,
  onToggle,
  children,
  style,
  bodyStyle,
  activeOpacity = 0.85,
}: Props) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.headerRow}
        onPress={onToggle}
        activeOpacity={activeOpacity}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View style={styles.headerContent}>{header}</View>
        {expanded ? (
          <ChevronUp size={16} color={C.textTertiary} strokeWidth={1.5} />
        ) : (
          <ChevronDown size={16} color={C.textTertiary} strokeWidth={1.5} />
        )}
      </TouchableOpacity>
      {expanded ? (
        <View style={[styles.body, bodyStyle]}>{children}</View>
      ) : null}
    </View>
  );
}

function makeStyles(C: ColorTokens) {
  return StyleSheet.create({
    container: {
      backgroundColor: C.parchmentDeep,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: C.divider,
      overflow: "hidden",
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: S.md,
      gap: S.sm,
    },
    headerContent: { flex: 1 },
    body: {
      borderTopWidth: 1,
      borderTopColor: C.divider,
      padding: S.md,
    },
  });
}
