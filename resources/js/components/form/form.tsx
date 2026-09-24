import type { ComponentProps, ReactNode } from 'react';
import type { FieldErrors, FieldValues } from 'react-hook-form';
import { FormProvider } from 'react-hook-form';
import type { ZodType } from 'zod';
import AlertError from '@/components/common/alert-error';
import { FieldPathsContext } from './form-context';
import type {
    InertiaFormReturn,
    SchemaInput,
    SchemaOutput,
    UseInertiaFormOptions,
} from './use-inertia-form';
import { useInertiaForm } from './use-inertia-form';

type FormElementProps = Omit<
    ComponentProps<'form'>,
    'onSubmit' | 'action' | 'method' | 'children'
>;

type FormChildren<TInput extends FieldValues, TOutput> =
    | ReactNode
    | ((form: InertiaFormReturn<TInput, TOutput>) => ReactNode);

type ProvidedFormProps<
    TInput extends FieldValues,
    TOutput,
> = FormElementProps & {
    /** An existing form from `useInertiaForm`, for pages that need its methods outside the markup. */
    form: InertiaFormReturn<TInput, TOutput>;
    children: FormChildren<TInput, TOutput>;
};

type ManagedFormProps<TSchema extends ZodType<unknown, FieldValues>> =
    FormElementProps &
        UseInertiaFormOptions<TSchema> & {
            form?: undefined;
            children: FormChildren<SchemaInput<TSchema>, SchemaOutput<TSchema>>;
        };

export type FormProps<
    TSchema extends ZodType<unknown, FieldValues>,
    TInput extends FieldValues,
    TOutput,
> = ProvidedFormProps<TInput, TOutput> | ManagedFormProps<TSchema>;

/** Server errors that matched no field are stored under `root` and surfaced as one alert. */
function collectRootErrors(errors: FieldErrors): string[] {
    if (!errors.root) {
        return [];
    }

    return Object.values(
        errors.root as unknown as Record<string, { message?: unknown }>,
    )
        .map((error) =>
            typeof error?.message === 'string' ? error.message : null,
        )
        .filter((message): message is string => message !== null);
}

function FormShell<TInput extends FieldValues, TOutput>({
    form,
    children,
    ...formProps
}: ProvidedFormProps<TInput, TOutput>) {
    const { submit, fieldPaths, ...methods } = form;
    const rootErrors = collectRootErrors(methods.formState.errors);

    return (
        <FieldPathsContext.Provider value={fieldPaths}>
            <FormProvider {...methods}>
                <form {...formProps} onSubmit={submit} noValidate>
                    {rootErrors.length > 0 ? (
                        <AlertError errors={rootErrors} />
                    ) : null}

                    {typeof children === 'function' ? children(form) : children}
                </form>
            </FormProvider>
        </FieldPathsContext.Provider>
    );
}

function ManagedForm<TSchema extends ZodType<unknown, FieldValues>>({
    action,
    schema,
    defaultValues,
    resetOnSuccess,
    transform,
    onSuccess,
    onError,
    visit,
    mode,
    reValidateMode,
    ...formProps
}: ManagedFormProps<TSchema>) {
    const form = useInertiaForm<TSchema>({
        action,
        schema,
        defaultValues,
        resetOnSuccess,
        transform,
        onSuccess,
        onError,
        visit,
        mode,
        reValidateMode,
    });

    return <FormShell {...formProps} form={form} />;
}

/**
 * Renders the form element, provides the react-hook-form context and shows any
 * server error that belongs to no field. Creates the form itself unless one is
 * passed in.
 */
export function Form<
    TSchema extends ZodType<unknown, FieldValues>,
    TInput extends FieldValues = SchemaInput<TSchema>,
    TOutput = SchemaOutput<TSchema>,
>(props: FormProps<TSchema, TInput, TOutput>) {
    if (props.form) {
        return <FormShell {...props} />;
    }

    return <ManagedForm {...props} />;
}
