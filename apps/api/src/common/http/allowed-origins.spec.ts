import { describe, expect, it } from 'vitest';

import { getAllowedWebOrigins, isAllowedWebOrigin } from './allowed-origins.js';

function config(values: Record<string, string>) {
    return {
        get: (key: string) => values[key],
    } as never;
}

describe('web origin configuration', () => {
    it('normalizes configured origins and supports an explicit list', () => {
        const origins = getAllowedWebOrigins(
            config({
                WEB_ORIGIN: 'http://localhost:3000/',
                WEB_ORIGINS: 'http://127.0.0.1:3000, https://nexus.example/path',
            }),
        );

        expect(origins).toEqual([
            'http://127.0.0.1:3000',
            'https://nexus.example',
            'http://localhost:3000',
        ]);
    });

    it('matches normalized origins and rejects unconfigured or malformed origins', () => {
        const origins = ['http://localhost:3000'];

        expect(isAllowedWebOrigin('http://localhost:3000', origins)).toBe(true);
        expect(isAllowedWebOrigin('http://localhost:3001', origins)).toBe(false);
        expect(isAllowedWebOrigin('null', origins)).toBe(false);
    });

    it('accepts local host aliases in development on the configured port', () => {
        const origins = getAllowedWebOrigins(
            config({
                WEB_ORIGIN: 'http://localhost:3000',
                NODE_ENV: 'development',
            }),
        );

        expect(isAllowedWebOrigin('http://127.0.0.1:3000', origins)).toBe(true);
        expect(isAllowedWebOrigin('http://[::1]:3000', origins)).toBe(true);
        expect(isAllowedWebOrigin('http://127.0.0.1:3001', origins)).toBe(false);
    });
});
