import { AuthGuard } from "@/components/auth/AuthGuard";

export default function LiveRoomLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="h-screen overflow-hidden bg-gray-50">
        {children}
      </div>
    </AuthGuard>
  );
}
