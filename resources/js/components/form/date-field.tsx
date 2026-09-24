import { format, isValid, parse } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { FormField } from './form-field';
import type { FormFieldBaseProps } from './types';

/**
 * The value stored in form state is a `yyyy-MM-dd` string, never a Date.
 * A Date would be serialised in the browser's timezone and can arrive at
 * Laravel as the previous day.
 */
const VALUE_FORMAT = 'yyyy-MM-dd';

function toDate(value: unknown): Date | undefined {
    if (typeof value !== 'string' || value === '') {
        return undefined;
    }

    const parsed = parse(value, VALUE_FORMAT, new Date());

    return isValid(parsed) ? parsed : undefined;
}

export type DateFieldProps = FormFieldBaseProps & {
    placeholder?: string;
    /** How the chosen day is shown on the trigger. The stored value stays `yyyy-MM-dd`. */
    displayFormat?: string;
    triggerClassName?: string;
};

export function DateField({
    name,
    label,
    labelAction,
    'aria-label': ariaLabel,
    description,
    className,
    orientation,
    disabled,
    placeholder = 'Pick a date',
    displayFormat = 'PPP',
    triggerClassName,
}: DateFieldProps) {
    const [open, setOpen] = useState(false);

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
            {({ field, ...aria }) => {
                const selected = toDate(field.value);

                return (
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger
                            render={
                                <Button
                                    {...aria}
                                    ref={field.ref}
                                    type="button"
                                    variant="outline"
                                    disabled={field.disabled}
                                    onBlur={field.onBlur}
                                    className={cn(
                                        'w-full justify-start font-normal',
                                        !selected && 'text-muted-foreground',
                                        triggerClassName,
                                    )}
                                >
                                    <CalendarIcon />
                                    {selected
                                        ? format(selected, displayFormat)
                                        : placeholder}
                                </Button>
                            }
                        />

                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                autoFocus
                                selected={selected}
                                defaultMonth={selected}
                                onSelect={(date) => {
                                    field.onChange(
                                        date ? format(date, VALUE_FORMAT) : '',
                                    );
                                    setOpen(false);
                                }}
                            />
                        </PopoverContent>
                    </Popover>
                );
            }}
        </FormField>
    );
}
