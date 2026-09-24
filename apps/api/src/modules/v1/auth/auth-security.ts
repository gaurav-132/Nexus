import {
    randomBytes,
    scrypt as scryptCallback,
    timingSafeEqual,
    createHash,
} from 'node:crypto';

const SCRYPT_N = 16_384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
const MAX_MEMORY = 64 * 1024 * 1024;

export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
export const SESSION_COOKIE_NAME = 'nexus_session';

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        scryptCallback(
            password,
            salt,
            KEY_LENGTH,
            { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: MAX_MEMORY },
            (error, key) => (error ? reject(error) : resolve(key as Buffer)),
        );
    });
}

export async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16);
    const key = await deriveKey(password, salt);
    return `scrypt$v1$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('hex')}$${key.toString('hex')}`;
}

export async function verifyPassword(
    password: string,
    encodedHash: string,
): Promise<boolean> {
    const [algorithm, version, n, r, p, saltHex, keyHex] =
        encodedHash.split('$');
    if (
        algorithm !== 'scrypt' ||
        version !== 'v1' ||
        n !== String(SCRYPT_N) ||
        r !== String(SCRYPT_R) ||
        p !== String(SCRYPT_P) ||
        !/^[0-9a-f]{32}$/i.test(saltHex ?? '') ||
        !/^[0-9a-f]{128}$/i.test(keyHex ?? '')
    ) {
        return false;
    }

    const expected = Buffer.from(keyHex, 'hex');
    const actual = await deriveKey(password, Buffer.from(saltHex, 'hex'));
    return timingSafeEqual(expected, actual);
}

export function createSessionToken(): string {
    return randomBytes(32).toString('base64url');
}

export function hashSessionToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}
