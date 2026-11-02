import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "Student sign-in" };

export default function StudentSignInPage() {
  return (
    <Suspense>
      <LoginForm role="student" />
    </Suspense>
  );
}
