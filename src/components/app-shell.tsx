import { signOut } from "@/app/actions/auth";
import { ShellChrome, type NavItem, type PlanChip } from "./shell-chrome";
import { IncomingCall } from "./calls/incoming-call";
import type { Helpline } from "@/lib/settings";

export type { NavItem };

export function AppShell({
  nav,
  userName,
  roleLabel,
  userId,
  withCalls = false,
  plan,
  helplines,
  children,
}: {
  nav: NavItem[];
  userName: string;
  roleLabel: string;
  userId: string;
  withCalls?: boolean;
  plan?: PlanChip;
  helplines?: Helpline[];
  children: React.ReactNode;
}) {
  return (
    <ShellChrome nav={nav} userName={userName} roleLabel={roleLabel} signOut={signOut} plan={plan} helplines={helplines}>
      {children}
      {withCalls && <IncomingCall userId={userId} />}
    </ShellChrome>
  );
}
