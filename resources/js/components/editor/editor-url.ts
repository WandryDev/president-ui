const LINK_PROTOCOLS = ['http:', 'https:', 'mailto:'];
const IMAGE_PROTOCOLS = ['http:', 'https:'];

export const LINK_SCHEMES = LINK_PROTOCOLS.map((protocol) =>
    protocol.slice(0, -1),
);

function hasProtocol(url: unknown, protocols: string[]): boolean {
    if (typeof url !== 'string') {
        return false;
    }

    try {
        return protocols.includes(new URL(url.trim()).protocol);
    } catch {
        return false;
    }
}

export function isAllowedLinkUrl(url: unknown): boolean {
    return hasProtocol(url, LINK_PROTOCOLS);
}

export function isAllowedImageUrl(url: unknown): boolean {
    return hasProtocol(url, IMAGE_PROTOCOLS);
}
