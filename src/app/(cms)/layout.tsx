import { DashboardShell } from "@/shared/ui/dashboard-shell";

// Group (cms) tidak muncul di URL — path tetap /admin/*
export default function CmsLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
