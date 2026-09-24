import '@testing-library/jest-dom/vitest';
import { router as coreRouter } from '@inertiajs/core';
import type * as InertiaReact from '@inertiajs/react';
import { cleanup, configure } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

// The app marks elements with data-test, not the library's data-testid default.
configure({ testIdAttribute: 'data-test' });

// Every form submits through router.visit. Replacing it lets tests read the
// outgoing payload and drive the success and error callbacks by hand.
vi.mock('@inertiajs/react', async (importOriginal) => {
    const actual = await importOriginal<typeof InertiaReact>();
    const { inertiaPage } = await import('./inertia-page');

    return {
        ...actual,
        router: { ...actual.router, visit: vi.fn() },
        // Head needs the head manager that createInertiaApp installs, which no
        // component test bootstraps. Nothing asserts on document.title.
        Head: () => null,
        usePage: () => inertiaPage,
    };
});

// Base UI popups and sliders measure and capture pointers. jsdom implements
// none of it, so the bare minimum is stubbed here.
class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
}

globalThis.ResizeObserver ??= ResizeObserverStub as never;

Element.prototype.scrollIntoView ??= function scrollIntoView() {};
document.elementFromPoint ??= function elementFromPoint() {
    return null;
};
Element.prototype.getAnimations ??= function getAnimations() {
    return [];
};
Element.prototype.hasPointerCapture ??= function hasPointerCapture() {
    return false;
};
Element.prototype.setPointerCapture ??= function setPointerCapture() {};
Element.prototype.releasePointerCapture ??= function releasePointerCapture() {};

globalThis.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
})) as never;

beforeEach(() => {
    // Link reaches the core router directly, so the mock on the copy
    // re-exported from @inertiajs/react never sees the call. Nothing boots an
    // Inertia app in a component test, and a real visit throws on the page it
    // has not got.
    vi.spyOn(coreRouter, 'visit').mockImplementation(() => {});
    vi.spyOn(coreRouter, 'prefetch').mockImplementation(() => {});
});

afterEach(() => {
    cleanup();

    // The router mock is created inside a vi.mock factory, which the
    // restoreMocks option does not reach, so its calls are cleared by hand.
    vi.clearAllMocks();
});
