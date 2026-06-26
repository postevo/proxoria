import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Sidebar } from "../../components/Sidebar";
import { ClerkTokenProvider } from "../../components/ClerkTokenProvider";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId, orgId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!orgId) redirect("/onboarding");

  return (
    <ClerkTokenProvider>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </ClerkTokenProvider>
  );
}
