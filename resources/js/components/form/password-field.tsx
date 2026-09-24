import { ArrowBigUpDashIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import type { ComponentProps, KeyboardEvent } from 'react';
import { useState } from 'react';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
    InputGroupText,
} from '@/components/ui/input-group';
import { FormField } from './form-field';
import type { FormFieldBaseProps } from './types';

type OwnedInputProps =
    | 'name'
    | 'id'
    | 'type'
    | 'value'
    | 'defaultValue'
    | 'onChange'
    | 'onBlur'
    | 'ref';

export type PasswordFieldProps = FormFieldBaseProps &
    Omit<ComponentProps<typeof InputGroupInput>, OwnedInputProps>;

export function PasswordField({
    name,
    label,
    labelAction,
    'aria-label': ariaLabel,
    description,
    className,
    orientation,
    disabled,
    ...inputProps
}: PasswordFieldProps) {
    const [visible, setVisible] = useState(false);
    const [capsLock, setCapsLock] = useState(false);

    /**
     * Modifier state is only readable from an event, so the warning appears on
     * the first keystroke rather than on focus.
     */
    const syncCapsLock = (event: KeyboardEvent<HTMLInputElement>) => {
        setCapsLock(event.getModifierState('CapsLock'));
    };

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
                <>
                    <InputGroup>
                        <InputGroupInput
                            {...inputProps}
                            {...field}
                            value={field.value ?? ''}
                            {...aria}
                            type={visible ? 'text' : 'password'}
                            onKeyDown={(event) => {
                                syncCapsLock(event);
                                inputProps.onKeyDown?.(event);
                            }}
                            onKeyUp={(event) => {
                                syncCapsLock(event);
                                inputProps.onKeyUp?.(event);
                            }}
                            onBlur={() => {
                                setCapsLock(false);
                                field.onBlur();
                            }}
                        />

                        <InputGroupAddon align="inline-end">
                            {capsLock && (
                                <InputGroupText
                                    aria-hidden="true"
                                    className="gap-1 text-warning-foreground text-xs"
                                >
                                    <ArrowBigUpDashIcon className="size-3.5" />
                                    Caps Lock
                                </InputGroupText>
                            )}

                            <InputGroupButton
                                size="icon-xs"
                                aria-label={
                                    visible ? 'Hide password' : 'Show password'
                                }
                                aria-pressed={visible}
                                tabIndex={-1}
                                disabled={field.disabled}
                                onClick={() => {
                                    setVisible((previous) => !previous);
                                }}
                            >
                                {visible ? <EyeOffIcon /> : <EyeIcon />}
                            </InputGroupButton>
                        </InputGroupAddon>
                    </InputGroup>

                    {/*
                     * Mounted at all times: a live region inserted together with
                     * its content is announced unreliably. `sr-only` is absolutely
                     * positioned, so it adds no gap to the field's flex column.
                     */}
                    <span className="sr-only" role="status">
                        {capsLock ? 'Caps Lock is on' : ''}
                    </span>
                </>
            )}
        </FormField>
    );
}
