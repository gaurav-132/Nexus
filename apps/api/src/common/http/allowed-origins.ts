import type { ConfigService } from '@nestjs/config';

const DEFAULT_WEB_ORIGIN = 'http://localhost:3000';
const DEVELOPMENT_LOOPBACK_HOSTS = ['localhost', '127.0.0.1', '[::1]'];

/**
 * Returns the explicitly configured browser origins used by both CORS and
 * state-changing auth routes. WEB_ORIGINS accepts a comma-separated list;
 * WEB_ORIGIN remains supported for existing local setups.
 */
export function getAllowedWebOrigins(config: ConfigService): string[] {
    const configured = [
        config.get<string>('WEB_ORIGINS'),
        config.get<string>('WEB_ORIGIN'),
    ]
        .filter((value): value is string => Boolean(value))
        .flatMap((value) => value.split(','))
        .map((value) => value.trim())
        .filter(Boolean);

    const values = configured.length > 0 ? configured : [DEFAULT_WEB_ORIGIN];
    const origins = new Set<string>();

    for (const value of values) {
        let url: URL;
        try {
            url = new URL(value);
        } catch {
            throw new Error(`Invalid web origin configured: ${value}`);
        }

        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            throw new Error(`Web origin must use HTTP or HTTPS: ${value}`);
        }

        origins.add(url.origin);
    }

    if (config.get<string>('NODE_ENV') === 'development') {
        for (const origin of [...origins]) {
            const url = new URL(origin);
            if (!DEVELOPMENT_LOOPBACK_HOSTS.includes(url.hostname)) continue;

            for (const hostname of DEVELOPMENT_LOOPBACK_HOSTS) {
                const localAlias = new URL(origin);
                localAlias.hostname = hostname;
                origins.add(localAlias.origin);
            }
        }
    }

    return [...origins];
}

export function isAllowedWebOrigin(origin: string, allowedOrigins: string[]): boolean {
    try {
        const parsedOrigin = new URL(origin);
        if (parsedOrigin.protocol !== 'http:' && parsedOrigin.protocol !== 'https:') {
            return false;
        }

        return allowedOrigins.includes(parsedOrigin.origin);
    } catch {
        return false;
    }
}
