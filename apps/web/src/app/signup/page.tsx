import type { Metadata } from "next";

import { AuthPage } from "@/features/auth/components/auth-page";

export const metadata: Metadata = { title: "Create a workspace" };

export default function SignupPage() {
    return <AuthPage mode="signup" />;
}
