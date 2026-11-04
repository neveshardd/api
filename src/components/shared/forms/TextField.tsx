"use client";

import { Button, FormGroup, InputGroup, Intent } from "@blueprintjs/core";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { type HTMLAttributes, type HTMLInputTypeAttribute, useId, useState } from "react";
import { type Control, type FieldPath, type FieldValues, useController } from "react-hook-form";
import { icon } from "@/components/shared/icons/AppIcon";

interface TextFieldProps<T extends FieldValues> {
  readonly control: Control<T>;
  readonly name: FieldPath<T>;
  readonly label: string;
  readonly type?: HTMLInputTypeAttribute;
  readonly autoComplete?: string;
  readonly helperText?: string;
  readonly autoFocus?: boolean;
  readonly disabled?: boolean;
  readonly inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  readonly maxLength?: number;
  /** Para senhas: botão oficial do Blueprint que alterna a visibilidade. */
  readonly revealable?: boolean;
}

/**
 * Campo de texto Blueprint integrado ao React Hook Form.
 * Erros e dicas são associados ao input por `aria-describedby`, e `aria-invalid` sinaliza o erro.
 */
export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  type = "text",
  autoComplete,
  helperText,
  autoFocus,
  disabled,
  inputMode,
  maxLength,
  revealable = false,
}: TextFieldProps<T>) {
  const { field, fieldState } = useController({ control, name });
  const [revealed, setRevealed] = useState(false);
  const inputId = useId();
  const messageId = `${inputId}-message`;
  const message = fieldState.error?.message ?? helperText;

  return (
    <FormGroup
      label={label}
      labelFor={inputId}
      helperText={message ? <span id={messageId}>{message}</span> : undefined}
      intent={fieldState.error ? Intent.DANGER : Intent.NONE}
    >
      <InputGroup
        id={inputId}
        name={field.name}
        value={field.value ?? ""}
        onValueChange={(value) => field.onChange(value)}
        onBlur={field.onBlur}
        inputRef={field.ref}
        type={revealable && revealed ? "text" : type}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        disabled={disabled}
        inputMode={inputMode}
        maxLength={maxLength}
        size="large"
        intent={fieldState.error ? Intent.DANGER : Intent.NONE}
        aria-invalid={fieldState.error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        rightElement={
          revealable ? (
            <Button
              variant="minimal"
              icon={icon(revealed ? IconEyeOff : IconEye)}
              aria-label={revealed ? "Ocultar senha" : "Mostrar senha"}
              aria-pressed={revealed}
              onClick={() => setRevealed((current) => !current)}
            />
          ) : undefined
        }
      />
    </FormGroup>
  );
}
