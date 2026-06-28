import Link from "next/link";
import type { CSSProperties } from "react";

interface ThirukanithamBadgeProps {
  size?: "sm" | "md";
  style?: CSSProperties;
  asLink?: boolean;
}

export function ThirukanithamBadge({ size = "sm", style, asLink = true }: ThirukanithamBadgeProps) {
  const isSmall = size === "sm";
  const badgeStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    backgroundColor: "var(--color-gold, #C8972A)",
    borderRadius: isSmall ? "6px" : "8px",
    padding: isSmall ? "2px 8px" : "4px 12px",
    fontFamily: "var(--font-tamil, 'Noto Sans Tamil', sans-serif)",
    fontSize: isSmall ? "0.625rem" : "0.75rem",
    fontWeight: isSmall ? 400 : 700,
    lineHeight: isSmall ? "16px" : "18px",
    color: "var(--color-surface, #fff)",
    textDecoration: "none",
    whiteSpace: "nowrap",
    flexShrink: 0,
    ...style,
  };

  const content = <>திருக்கணிதம் ◉</>;

  if (asLink) {
    return (
      <Link href="/learn/what-is-thirukanitham" style={badgeStyle} title="What is Thirukanitham?">
        {content}
      </Link>
    );
  }
  return <span style={badgeStyle}>{content}</span>;
}
