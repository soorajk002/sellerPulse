import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SessionProvider } from "@/components/SessionProvider";
import { MarketplaceProvider } from "@/components/MarketplaceContext";
import TopNav from "@/components/TopNav";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <SessionProvider session={session}>
      <MarketplaceProvider>
      <div className="flex flex-col h-screen bg-bg overflow-hidden">
        <TopNav />
        <div className="flex flex-1 overflow-hidden">
          <div className="hidden md:flex">
            <Sidebar />
          </div>
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
      </MarketplaceProvider>
    </SessionProvider>
  );
}
