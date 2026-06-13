import { Suspense } from "react";
import { CheckoutPage } from "@/components/subscription/CheckoutPage";

export default function CheckoutRoute() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto animate-pulse"><div className="h-8 bg-gray-100 rounded-xl w-48 mb-6" /><div className="h-96 bg-gray-100 rounded-xl" /></div>}>
      <CheckoutPage />
    </Suspense>
  );
}
