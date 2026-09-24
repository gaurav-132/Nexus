import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthPage } from "@/features/auth/components/auth-page";
import { getCurrentUser } from "@/features/auth/server-auth";

export const metadata: Metadata = { title: "Create a workspace" };

export default async function SignupPage() {
    if (await getCurrentUser()) redirect("/");
    return <AuthPage mode="signup" />;
}
