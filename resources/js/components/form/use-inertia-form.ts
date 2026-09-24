import { zodResolver } from '@hookform/resolvers/zod';
import type { RequestPayload, VisitOptions } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import type { BaseSyntheticEvent } from 'react';
import { useState } from 'react';
import type {
    DefaultValues,
    FieldPath,
    FieldValues,
    Resolver,
    UseFormProps,
    UseFormReturn,
} from 'react-hook-form';
import { useForm } from 'react-hook-form';
import type { ZodType, z } from 'zod';
import { collectFieldPaths, isKnownFieldPath } from './field-paths';
import type { FormAction } from './types';

type ManagedVisitOptions = Omit<
    VisitOptions,
    'method' | 'data' | 'onError' | 'onSuccess' | 'onFinish'
>;

/**
 * Both are derived from the schema rather than exposed as type parameters:
 * a parameter would give TypeScript a second inference site — `resetOnSuccess`,
 * for one — and the values would be inferred from the wrong prop.
 */
export type SchemaInput<TSchema extends ZodType<unknown, FieldValues>> =
    z.input<TSchema> & FieldValues;

export type SchemaOutput<TSchema extends ZodType<unknown, FieldValues>> =
    z.output<TSchema>;

export type UseInertiaFormOptions<
    TSchema extends ZodType<unknown, FieldValues>,
> = {
    action: FormAction;
    schema: TSchema;
    defaultValues: DefaultValues<SchemaInput<TSchema>>;
    /**
     * Omitted: reset to the submitted values, clearing the dirty state but keeping the input.
     * `false`: leave the form untouched. `true`: reset every field to its default.
     * An array resets only the listed fields, mirroring Inertia's `<Form resetOnSuccess>`.
     */
    resetOnSuccess?: boolean | Array<FieldPath<SchemaInput<TSchema>>>;
    transform?: (values: SchemaOutput<TSchema>) => Record<string, unknown>;
    onSuccess?: () => void;
    onError?: (errors: Record<string, string>) => void;
    visit?: ManagedVisitOptions;
    mode?: UseFormProps['mode'];
    reValidateMode?: UseFormProps['reValidateMode'];
};

/** Named to stay clear of `InertiaForm`, which `@inertiajs/react` already exports. */
export type InertiaFormReturn<
    TInput extends FieldValues,
    TOutput = TInput,
> = UseFormReturn<TInput, unknown, TOutput> & {
    submit: (event?: BaseSyntheticEvent) => void;
    fieldPaths: Set<string>;
};

/**
 * Inertia delivers a named error bag as one nesting level keyed by the bag name.
 * Laravel's own nested fields arrive as flat dotted keys, so an object value can
 * only be a bag and its name is dropped.
 */
function flattenErrorBags(
    errors: Record<string, unknown>,
): Record<string, string> {
    const flattened: Record<string, string> = {};

    for (const [key, value] of Object.entries(errors)) {
        if (typeof value === 'string') {
            flattened[key] = value;

            continue;
        }

        if (typeof value === 'object' && value !== null) {
            Object.assign(
                flattened,
                flattenErrorBags(value as Record<string, unknown>),
            );
        }
    }

    return flattened;
}

/**
 * Laravel returns 422 errors keyed by field. Keys that match a field are shown
 * next to it; anything else — a throttle message, for example — would otherwise
 * vanish, so it lands under `root` where the form renders it as a top level alert.
 * Returns the first field that was rejected, for focusing.
 */
function applyServerErrors<TInput extends FieldValues, TOutput>(
    form: UseFormReturn<TInput, unknown, TOutput>,
    errors: Record<string, string>,
    fieldPaths: Set<string>,
): string | null {
    let firstRejectedField: string | null = null;

    for (const [key, message] of Object.entries(flattenErrorBags(errors))) {
        if (isKnownFieldPath(fieldPaths, key)) {
            form.setError(key as FieldPath<TInput>, {
                type: 'server',
                message,
            });

            firstRejectedField ??= key;

            continue;
        }

        form.setError(`root.${key}`, { type: 'server', message });
    }

    return firstRejectedField;
}

/**
 * Moves focus to the first field the server rejected. react-hook-form's own
 * `setFocus` does not reach a Controller's ref once `setError` has run, so the
 * control is looked up by the name it renders and focused directly.
 */
function focusRejectedField(
    form: HTMLFormElement | null,
    name: string | null,
): void {
    if (form === null || name === null) {
        return;
    }

    const control = form.querySelector<HTMLElement>(
        `[name="${CSS.escape(name)}"]`,
    );

    control?.focus();
}

export function useInertiaForm<
    TSchema extends ZodType<unknown, FieldValues>,
    TInput extends FieldValues = SchemaInput<TSchema>,
    TOutput = SchemaOutput<TSchema>,
>({
    action,
    schema,
    defaultValues,
    resetOnSuccess,
    transform,
    onSuccess,
    onError,
    visit,
    mode = 'onTouched',
    reValidateMode = 'onChange',
}: UseInertiaFormOptions<TSchema>): InertiaFormReturn<TInput, TOutput> {
    const form = useForm<TInput, unknown, TOutput>({
        resolver: zodResolver(schema) as unknown as Resolver<
            TInput,
            unknown,
            TOutput
        >,
        defaultValues: defaultValues as DefaultValues<TInput>,
        mode,
        reValidateMode,
    });

    // The shape of the defaults never changes at runtime, so deriving the paths
    // once keeps the context value stable across renders.
    const [fieldPaths] = useState(() => collectFieldPaths(defaultValues));

    const submit = form.handleSubmit((values, event) => {
        // The submit event carries the form element, which is what scopes the
        // lookup when focusing a rejected field. A page may hold several forms.
        const formElement = (event?.target as HTMLFormElement | null) ?? null;

        const data = transform
            ? transform(values as SchemaOutput<TSchema>)
            : (values as RequestPayload);

        // router.visit is callback based. Without wrapping it, handleSubmit
        // resolves immediately and formState.isSubmitting flips back to false
        // while the request is still in flight, un-disabling the submit button.
        return new Promise<void>((resolve) => {
            router.visit(action.url, {
                ...visit,
                method: action.method,
                data: data as RequestPayload,
                onError: (serverErrors) => {
                    const rejected = applyServerErrors(
                        form,
                        serverErrors,
                        fieldPaths,
                    );

                    focusRejectedField(formElement, rejected);
                    onError?.(serverErrors);
                },
                onSuccess: () => {
                    if (resetOnSuccess === false) {
                        onSuccess?.();

                        return;
                    }

                    if (resetOnSuccess === true) {
                        form.reset();
                    } else if (Array.isArray(resetOnSuccess)) {
                        for (const field of resetOnSuccess) {
                            form.resetField(field as FieldPath<TInput>);
                        }
                    } else {
                        form.reset(form.getValues());
                    }

                    onSuccess?.();
                },
                onFinish: () => {
                    resolve();
                },
            });
        });
    });

    return { ...form, submit, fieldPaths };
}
