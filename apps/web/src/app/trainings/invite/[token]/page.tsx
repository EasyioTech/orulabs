"use client";

import { useParams, useRouter } from "next/navigation";
import { useFacilitatorInvitation, useAcceptFacilitatorInvitation, useDeclineFacilitatorInvitation } from "@/hooks/useTrainings";
import { useAuthStore } from "@/store/auth";
import Link from "next/link";

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data: invitation, isLoading, error } = useFacilitatorInvitation(token);
  const acceptMutation = useAcceptFacilitatorInvitation();
  const declineMutation = useDeclineFacilitatorInvitation();

  const handleAccept = async () => {
    const { data } = await acceptMutation.mutateAsync(token);
    router.push(`/trainings/${data.trainingId}/studio`);
  };

  const handleDecline = async () => {
    await declineMutation.mutateAsync(token);
    router.push("/dashboard");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !invitation) {
    const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Invitation not found or has expired.";
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white border border-gray-100 rounded-xl p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Invalid invitation</h1>
          <p className="text-sm text-gray-500">{msg}</p>
        </div>
      </div>
    );
  }

  const roleLabel = invitation.role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const emailMismatch = isAuthenticated && user && user.email !== invitation.email;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white border border-gray-100 rounded-xl p-8 max-w-md w-full">
        <div className="mb-6">
          <span className="text-2xl font-extrabold text-gray-900 tracking-tight">Oru</span>
          <span className="text-2xl font-extrabold text-emerald-500 tracking-tight">Labs</span>
        </div>

        <h1 className="text-xl font-semibold text-gray-900 mb-1">You&apos;re invited to facilitate</h1>
        <p className="text-gray-500 text-sm mb-6">
          <strong className="text-gray-700">{invitation.inviterName}</strong> invited you as{" "}
          <strong className="text-gray-700">{roleLabel}</strong> for{" "}
          <strong className="text-gray-700">{invitation.trainingTitle}</strong>.
        </p>

        <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 mb-6 text-sm">
          <p className="text-gray-500 mb-1">Invitation sent to</p>
          <p className="font-medium text-gray-900">{invitation.email}</p>
        </div>

        {emailMismatch ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            You&apos;re signed in as <strong>{user!.email}</strong>. This invitation was sent to{" "}
            <strong>{invitation.email}</strong>. Please sign in with the correct account to accept.
          </div>
        ) : !isAuthenticated ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 text-center">Sign in or create an account with <strong>{invitation.email}</strong> to accept.</p>
            <Link
              href={`/login/trainer?redirect=/trainings/invite/${token}`}
              className="block w-full text-center bg-brand-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href={`/login?redirect=/trainings/invite/${token}`}
              className="block w-full text-center border border-gray-100 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Create account
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleAccept}
              disabled={acceptMutation.isPending || declineMutation.isPending}
              className="w-full bg-emerald-500 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              {acceptMutation.isPending ? "Accepting…" : "Accept Invitation"}
            </button>
            <button
              onClick={handleDecline}
              disabled={acceptMutation.isPending || declineMutation.isPending}
              className="w-full border border-gray-100 text-gray-500 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {declineMutation.isPending ? "Declining…" : "Decline"}
            </button>
          </div>
        )}

        {acceptMutation.isError && (
          <p className="mt-3 text-sm text-red-500 text-center">
            {(acceptMutation.error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed to accept invitation."}
          </p>
        )}
      </div>
    </div>
  );
}
