/**
 * Validated form field — Design Constitution §7.3
 *
 * Wraps an input/select with label, error state, and success indicator.
 * Pass `error` to show red border + message. Pass `valid` to show checkmark.
 * Use with react-hook-form: spread `register("fieldName")` onto the input
 * and pass `errors.fieldName?.message` as `error`.
 */
import { cloneElement, isValidElement, type ReactNode } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface ValidatedFieldProps {
  id: string;
  label: string;
  error?: string;
  valid?: boolean;
  helper?: string;
  required?: boolean;
  children: ReactNode;
}

export function ValidatedField({
  id,
  label,
  error,
  valid,
  helper,
  required,
  children,
}: ValidatedFieldProps) {
  const errorId = error ? `${id}-error` : undefined;
  const helperId = helper ? `${id}-helper` : undefined;
  const describedBy = [helperId, errorId].filter(Boolean).join(" ") || undefined;
  const child = isValidElement(children)
    ? cloneElement(children as any, {
        id: (children as any).props?.id ?? id,
        "aria-invalid": error ? "true" : undefined,
        "aria-describedby": describedBy,
        "aria-required": required ? "true" : undefined,
        required: required || (children as any).props?.required,
      })
    : children;

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>

      <div className="input-wrapper">
        {/* Children receive the error/valid class via cloneElement pattern
            or callers apply className directly — see ValidatedInput below */}
        {children}
        {valid && !error && (
          <span className="input-wrapper__check" aria-hidden="true">
            <CheckCircle2 size={16} strokeWidth={1.5} />
          </span>
        )}
      </div>

      {error && (
        <span
          id={errorId}
          className="field__error"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle size={14} strokeWidth={1.5} aria-hidden="true" />
          {error}
        </span>
      )}

      {helper && !error && (
        <span id={helperId} className="field__helper">
          {helper}
        </span>
      )}
    </div>
  );
}

/**
 * Drop-in validated <input> — apply error/valid classes automatically.
 * Usage:
 *   <ValidatedField id="name" label="Name" error={errors.name?.message} valid={!errors.name && !!watch("name")}>
 *     <ValidatedInput id="name" error={!!errors.name} {...register("name")} />
 *   </ValidatedField>
 */
interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  valid?: boolean;
}
export function ValidatedInput({ error, valid, className = "", ...rest }: ValidatedInputProps) {
  const stateClass = error ? "input--error" : valid ? "input--valid" : "";
  return (
    <input
      className={`input ${stateClass} ${className}`.trim()}
      aria-invalid={error ? "true" : undefined}
      {...rest}
    />
  );
}

/**
 * Drop-in validated <textarea>.
 */
interface ValidatedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}
export function ValidatedTextarea({ error, className = "", ...rest }: ValidatedTextareaProps) {
  return (
    <textarea
      className={`input ${error ? "input--error" : ""} ${className}`.trim()}
      aria-invalid={error ? "true" : undefined}
      {...rest}
    />
  );
}

/**
 * Drop-in validated <select>.
 */
interface ValidatedSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}
export function ValidatedSelect({ error, className = "", children, ...rest }: ValidatedSelectProps) {
  return (
    <select
      className={`select ${error ? "select--error" : ""} ${className}`.trim()}
      aria-invalid={error ? "true" : undefined}
      {...rest}
    >
      {children}
    </select>
  );
}
