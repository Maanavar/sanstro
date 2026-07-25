"use client";

/**
 * <Toggle> — the shared switch primitive (audit §1.3). Replaces the Settings
 * local `Toggle`. Renders a real `role="switch"` button so it's keyboard- and
 * AT-operable. Styling lives in `.ui-toggle*` in dashboard-nova.css.
 */

type ToggleProps = {
  checked: boolean;
  onChange: (value: boolean) => void;
  /** Accessible name — required when there's no visible adjacent label. */
  label?: string;
  disabled?: boolean;
  className?: string;
};

export function Toggle({ checked, onChange, label, disabled, className }: ToggleProps) {
  const classes = ["ui-toggle", checked ? "ui-toggle--on" : "", className].filter(Boolean).join(" ");
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={classes}
      onClick={() => onChange(!checked)}
    >
      <span className="ui-toggle__knob" aria-hidden="true" />
    </button>
  );
}
