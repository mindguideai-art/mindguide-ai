import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { SubmitButton } from "@/components/ui/submit-button";
import { verifyEmailLink } from "@/app/actions/session";

export const metadata = { title: "Confirm" };

export default async function VerifyLink({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { token_hash, type, next } = await searchParams;
  if (!token_hash || !type) redirect("/login?error=link");
  const recovery = type === "recovery";
  return (
    <AuthCard
      title={recovery ? "Reset your password" : "Confirm your email"}
      text={recovery ? "Continue to choose a new password." : "One last step: confirm your email to open your account."}
    >
      <form action={verifyEmailLink}>
        <input type="hidden" name="token_hash" value={token_hash} />
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="next" value={next ?? ""} />
        <SubmitButton className="btn-primary w-full" pendingText="Confirming…">{recovery ? "Continue" : "Confirm my email"}</SubmitButton>
      </form>
    </AuthCard>
  );
}
