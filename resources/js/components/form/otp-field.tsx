import type { ReactNode } from 'react';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { FormField } from './form-field';
import type { FormFieldBaseProps } from './types';

export type OtpFieldProps = FormFieldBaseProps & {
    length?: number;
    /** Regex source restricting what may be typed, e.g. `REGEXP_ONLY_DIGITS`. */
    pattern?: string;
    /** Renders in place of the default slot row. */
    children?: ReactNode;
    autoFocus?: boolean;
    /** Fires once every slot is filled — use it to submit without a click. */
    onComplete?: (value: string) => void;
};

export function OtpField({
    name,
    label,
    labelAction,
    'aria-label': ariaLabel,
    description,
    className,
    orientation,
    disabled,
    length = 6,
    pattern,
    children,
    autoFocus,
    onComplete,
}: OtpFieldProps) {
    return (
        <FormField
            name={name}
            label={label}
            labelAction={labelAction}
            aria-label={ariaLabel}
            description={description}
            className={className}
            orientation={orientation}
            disabled={disabled}
        >
            {({ field, ...aria }) => (
                <InputOTP
                    {...aria}
                    maxLength={length}
                    pattern={pattern}
                    autoFocus={autoFocus}
                    name={field.name}
                    ref={field.ref}
                    value={field.value ?? ''}
                    disabled={field.disabled}
                    onBlur={field.onBlur}
                    onChange={(value) => {
                        field.onChange(value);
                    }}
                    onComplete={onComplete}
                >
                    {children ?? (
                        <InputOTPGroup>
                            {Array.from({ length }, (_, index) => (
                                <InputOTPSlot
                                    // biome-ignore lint/suspicious/noArrayIndexKey: OTP slots are a fixed-length list addressed by position
                                    key={index}
                                    index={index}
                                    aria-invalid={aria['aria-invalid']}
                                />
                            ))}
                        </InputOTPGroup>
                    )}
                </InputOTP>
            )}
        </FormField>
    );
}
