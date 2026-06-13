import type { Metadata } from "next";
import { WorkspaceDashboard } from "@/components/dashboard/WorkspaceDashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return <WorkspaceDashboard />;
}
