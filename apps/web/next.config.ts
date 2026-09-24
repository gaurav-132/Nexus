import type { NextConfig } from "next";
import dotenv from "dotenv";
import { resolve } from "node:path";

dotenv.config({
    path: [
        resolve(process.cwd(), ".env"),
        resolve(process.cwd(), "../../.env"),
    ],
});

const apiServerUrl = process.env.API_SERVER_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
    async rewrites() {
        return [
            {
                source: "/api/v1/:path*",
                destination: `${apiServerUrl}/api/v1/:path*`,
            },
        ];
    },
};

export default nextConfig;
