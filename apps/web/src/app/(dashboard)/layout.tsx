import { Sidebar } from "@/components/shared/Sidebar";
import { Header } from "@/components/shared/Header";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ActiveSessionManager } from "@/components/dashboard/ActiveSessionManager";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard area="trainer">
      <div className="flex flex-col h-screen overflow-hidden bg-white">
        <Header />
        <div className="flex flex-1 overflow-hidden relative">
          <Sidebar />
          <div className="flex flex-col flex-1 overflow-hidden relative">
            <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
            <ActiveSessionManager />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
