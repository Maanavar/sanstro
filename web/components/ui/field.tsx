"use client";

import { cloneElement, isValidElement, type ReactNode } from "react";
import type {
  CSSProperties,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { AlertCircle } from "lucide-react";

/**
 * <Field> / <Input> / <Select> / <Textarea> — the shared form primitives
 * (audit §1.3, §3a). One definition replaces the Classic `Field`/`TextInput`/
 * `Select`, the Setup `WField`/`WInput`/`WSelect`, and the inline
 * `<input style>`/`<textarea style>` stacks across Journal, Setup, etc.
 *
 * The a11y wiring (aria-invalid / aria-describedby / role="alert" / required)
 * is ported verbatim from the Classic `Field` in dashboard-ui.tsx so it isn't
 * rebuilt. Visual styling lives in `.ui-field*` / `.ui-input` / `.ui-select` /
 * `.ui-textarea` in dashboard-nova.css, so controls read the token layer and
 * theme for free.
 */

type FieldProps = {
  id?: string;
  label: string;
  children: ReactNode;
  helper?: string;
  error?: string;
  required?: boolean;
  className?: string;
  /** Sizing for the field's slot in the parent's flex/grid row (`flex`,
   *  `minWidth`, …). Visuals stay in `.ui-field*`; only layout belongs here. */
  style?: CSSProperties;
};

export function Field({ id, label, children, helper, error, required, className, style }: FieldProps) {
  const fieldId = id ?? `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "control"}`;
  const errorId = error ? `${fieldId}-error` : undefined;
  const helperId = helper ? `${fieldId}-helper` : undefined;
  const describedBy = [helperId, errorId].filter(Boolean).join(" ") || undefined;
  const control = isValidElement(children)
    ? cloneElement(children as any, {
        id: (children as any).props?.id ?? fieldId,
        "aria-invalid": error ? "true" : (children as any).props?.["aria-invalid"],
        "aria-describedby": describedBy,
        "aria-required": required ? "true" : undefined,
        required: required || (children as any).props?.required,
      })
    : children;

  const classes = ["ui-field", className].filter(Boolean).join(" ");
  return (
    <label className={classes} htmlFor={fieldId} style={style}>
      <span className="ui-field__label">
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </span>
      {control}
      {error ? (
        <span id={errorId} className="ui-field__error" role="alert" aria-live="polite">
          <AlertCircle size={14} strokeWidth={1.5} aria-hidden="true" />
          {error}
        </span>
      ) : null}
      {helper && !error ? (
        <span id={helperId} className="ui-field__helper">
          {helper}
        </span>
      ) : null}
    </label>
  );
}

/**
 * `<FieldShell>` — the same `.ui-field` label/gap shell as `<Field>`, but a
 * `<div>` with a plain `<span>` label instead of a `<label>`.
 *
 * For controls that already carry their own accessible name and must NOT be
 * wrapped in a `<label>`: `NovaSelect` renders a `<button aria-haspopup>`, and
 * `PlaceCombobox` an `<input role="combobox">` whose name comes from the
 * caller. A `<label>` around a button is the wrong semantic (a button is named
 * by its content, not by a label) and clicking the label forwards a second
 * activation to the trigger, which toggles the dropdown shut again.
 *
 * So this exists to keep a NovaSelect field *visually* identical to the `Field`
 * next to it in the same row without borrowing the labelling semantics that
 * would misfire. Anything that is a real form control belongs in `<Field>`.
 */
export function FieldShell({
  label,
  children,
  className,
  style,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const classes = ["ui-field", className].filter(Boolean).join(" ");
  return (
    <div className={classes} style={style}>
      <span className="ui-field__label">{label}</span>
      {children}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  const { error, className, ...rest } = props;
  const classes = ["ui-input", className].filter(Boolean).join(" ");
  return (
    <input {...rest} className={classes} aria-invalid={error || rest["aria-invalid"] || undefined} />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }) {
  const { error, className, ...rest } = props;
  const classes = ["ui-select", className].filter(Boolean).join(" ");
  return (
    <select {...rest} className={classes} aria-invalid={error || rest["aria-invalid"] || undefined} />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }) {
  const { error, className, ...rest } = props;
  const classes = ["ui-textarea", className].filter(Boolean).join(" ");
  return (
    <textarea {...rest} className={classes} aria-invalid={error || rest["aria-invalid"] || undefined} />
  );
}
