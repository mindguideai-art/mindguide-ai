import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const notice = sp.reset ? "Password updated. Please sign in." : sp.error ? "That link has expired or was already used. Links work once, for one hour. If you already confirmed, just sign in. Otherwise send yourself a new link." : undefined;
  return (
    <AuthCard title="Welcome back" text="Sign in to your account.">
      <LoginForm next={sp.next} notice={notice} showResend={Boolean(sp.error)} />
    </AuthCard>
  );
}
