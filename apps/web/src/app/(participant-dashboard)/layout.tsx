import { AuthGuard } from "@/components/auth/AuthGuard";
import { ParticipantSidebar } from "@/components/shared/ParticipantSidebar";
import { ParticipantTopBar } from "@/components/shared/ParticipantTopBar";

export default function ParticipantDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard area="participant">
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <ParticipantSidebar />
        <div className="flex flex-col flex-1 overflow-hidden relative">
          <ParticipantTopBar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
