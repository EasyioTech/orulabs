import { Suspense } from "react";
import { SuccessPage } from "@/components/subscription/SuccessPage";

export default function SuccessRoute() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto text-center animate-pulse"><div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4" /><div className="h-6 bg-gray-100 rounded-xl w-48 mx-auto" /></div>}>
      <SuccessPage />
    </Suspense>
  );
}
