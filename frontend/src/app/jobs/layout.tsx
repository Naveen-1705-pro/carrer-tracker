import { DashboardShell } from "@/components/layout/DashboardShell";

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
