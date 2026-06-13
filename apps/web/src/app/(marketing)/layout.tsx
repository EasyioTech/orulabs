import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { Footer } from "@/components/marketing/Footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white selection:bg-gray-200 selection:text-black">
      <MarketingNavbar />
      <main className="flex-grow pt-24 pb-16">
        {children}
      </main>
      <Footer />
    </div>
  );
}
