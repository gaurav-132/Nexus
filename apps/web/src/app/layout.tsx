import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: { default: "Nexus — Work, connected.", template: "%s · Nexus" },
    description:
        "A thoughtful workspace for teams to bring people, priorities, and progress together.",
};

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
