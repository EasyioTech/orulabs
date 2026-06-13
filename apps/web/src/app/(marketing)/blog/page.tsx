import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — OruLabs",
  description: "Tips, guides, and insights on live training, facilitation, and L&D from the OruLabs team.",
};

export default function BlogPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <h1 className="text-3xl font-bold">Blog (Coming Soon)</h1>
    </div>
  );
}
