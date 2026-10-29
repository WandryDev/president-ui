import { format, isValid, parse } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import type { ComponentProps, ReactElement } from 'react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

/** Dates travel as `yyyy-MM-dd`: a Date would be serialised in the browser's timezone. */
const VALUE_FORMAT = 'yyyy-MM-dd';

type DayRange = { from: Date | undefined; to?: Date | undefined };

export type DataTableDateRange = {
    from: string | undefined;
    to: string | undefined;
};

export type DataTableDateRangeFilterProps = {
    title: string;
    /** First day, `yyyy-MM-dd`. */
    from?: string | null;
    /** Last day, `yyyy-MM-dd`, inclusive. */
    to?: string | null;
    /** Called with both days once a range is picked, or with both `undefined` once it is cleared. */
    onChange: (range: DataTableDateRange) => void;
    /** The calendar's locale, e.g. `ru` from `@daypicker/react/locale`. */
    locale?: ComponentProps<typeof Calendar>['locale'];
    clearLabel?: string;
    className?: string;
};

function toDate(value: string | null | undefined): Date | undefined {
    if (!value) {
        return undefined;
    }

    const parsed = parse(value, VALUE_FORMAT, new Date());

    return isValid(parsed) ? parsed : undefined;
}

function describeRange(start: Date, end: Date, locale?: string): string {
    return new Intl.DateTimeFormat(locale ?? 'ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).formatRange(start, end);
}

/**
 * A dashed trigger like `FacetedFilter`, with a calendar that picks a range
 * of days. The first click starts the range, the second applies it.
 */
export function DataTableDateRangeFilter({
    title,
    from,
    to,
    onChange,
    locale,
    clearLabel = 'Очистить даты',
    className,
}: DataTableDateRangeFilterProps): ReactElement {
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState<DayRange | undefined>();
    const start = toDate(from) ?? toDate(to);
    const end = toDate(to) ?? toDate(from);
    const applied = start && end ? { from: start, to: end } : undefined;

    return (
        <Popover
            onOpenChange={(next) => {
                setOpen(next);

                if (next) {
                    setDraft(applied);
                }
            }}
            open={open}
        >
            <PopoverTrigger
                render={
                    <Button
                        className={cn('border-dashed', className)}
                        size="sm"
                        variant="outline"
                    >
                        <CalendarIcon aria-hidden="true" />
                        {title}
                        {applied ? (
                            <>
                                <Separator
                                    className="mx-0.5 h-3.5"
                                    orientation="vertical"
                                />
                                <Badge
                                    className="tabular-nums"
                                    size="sm"
                                    variant="secondary"
                                >
                                    {describeRange(
                                        applied.from,
                                        applied.to,
                                        locale?.code,
                                    )}
                                </Badge>
                            </>
                        ) : null}
                    </Button>
                }
            />

            <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                    autoFocus
                    defaultMonth={draft?.from}
                    locale={locale}
                    mode="range"
                    onSelect={(next, day) => {
                        // DayPicker extends a complete range on every click,
                        // so a click after a finished range starts a new one
                        // and the second click applies it.
                        if (draft?.from && !draft.to && next?.from && next.to) {
                            onChange({
                                from: format(next.from, VALUE_FORMAT),
                                to: format(next.to, VALUE_FORMAT),
                            });
                            setOpen(false);

                            return;
                        }

                        setDraft({ from: day, to: undefined });
                    }}
                    selected={draft}
                />

                {applied ? (
                    <div className="border-t p-2">
                        <Button
                            className="w-full"
                            onClick={() => {
                                onChange({ from: undefined, to: undefined });
                                setOpen(false);
                            }}
                            size="sm"
                            variant="ghost"
                        >
                            {clearLabel}
                        </Button>
                    </div>
                ) : null}
            </PopoverContent>
        </Popover>
    );
}
