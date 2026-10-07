import { requireUser } from "@/server/auth/session";
import { unreadCount } from "@/server/services/notification.service";
import { AppShell } from "@/components/shell/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["FREELANCER", "CONTRACTOR"]);
  const unread = await unreadCount(user.id);
  return (
    <AppShell user={user} unread={unread}>
      {children}
    </AppShell>
  );
}
