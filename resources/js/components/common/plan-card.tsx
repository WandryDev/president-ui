import { Check } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type PlanCardProps = {
    name: ReactNode;
    tagline?: ReactNode;
    price: ReactNode;
    /** Follows the price on its baseline: "₴ в месяц", "per seat". */
    period?: ReactNode;
    features?: string[];
    /** Prefix for `-name` and `-tagline` ids, so a control can be labelled by them. */
    id?: string;
    /** Sits on the name row: a status badge, or the radio that selects the plan. */
    indicator?: ReactNode;
    /** Pinned to the bottom so buttons line up across cards. */
    action?: ReactNode;
    className?: string;
    /** Lets the card become a `<label>` when the whole surface selects a plan. */
    render?: ReactElement<Record<string, unknown>>;
};

/** Presents a plan; what the card does with it is up to the caller. */
export function PlanCard({
    name,
    tagline,
    price,
    period,
    features = [],
    id,
    indicator,
    action,
    className,
    render,
}: PlanCardProps): ReactElement {
    return (
        <Card
            className={cn('justify-between gap-6 p-4', className)}
            data-slot="plan-card"
            render={render}
        >
            <div className="space-y-4">
                <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                        <h3
                            className="font-medium text-base sm:text-sm"
                            id={id ? `${id}-name` : undefined}
                        >
                            {name}
                        </h3>

                        {indicator}
                    </div>

                    {tagline ? (
                        <p
                            className="text-pretty text-base text-muted-foreground sm:text-sm"
                            id={id ? `${id}-tagline` : undefined}
                        >
                            {tagline}
                        </p>
                    ) : null}
                </div>

                <div className="flex items-baseline gap-1.5">
                    <div className="whitespace-nowrap font-semibold text-2xl tabular-nums tracking-tight">
                        {price}
                    </div>

                    {period ? (
                        <div className="text-base text-muted-foreground sm:text-sm">
                            {period}
                        </div>
                    ) : null}
                </div>

                {features.length > 0 ? (
                    // biome-ignore lint/a11y/noRedundantRoles: preflight drops the marker, and Safari drops list semantics with it
                    <ul className="space-y-2" role="list">
                        {features.map((feature) => (
                            <li
                                className="flex gap-2 text-base sm:text-sm"
                                key={feature}
                            >
                                <Check className="size-4 h-lh shrink-0 text-muted-foreground" />
                                {feature}
                            </li>
                        ))}
                    </ul>
                ) : null}
            </div>

            {action}
        </Card>
    );
}
