import { DashboardShell } from "@/components/layout/DashboardShell";

export default function TrackerLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
