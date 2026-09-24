/**
 * Backing store for the mocked `usePage`. Page tests assign the props their
 * component reads before rendering it, and `url` for anything that highlights
 * the current route.
 */
export const inertiaPage: { props: Record<string, unknown>; url: string } = {
    props: {},
    url: '/',
};
