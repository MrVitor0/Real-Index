import { DashboardHeader } from "@/features/home/components/dashboard-header";
import { getServerSession } from "@/lib/auth/server";
import { getEnvironmentStatus } from "@/lib/env";
import { getHomeNavigation } from "@/server/markets/catalog";

export async function AppNavbar() {
  const navigation = await getHomeNavigation();
  const { hasNeonAuth } = getEnvironmentStatus();
  const session = hasNeonAuth ? await getServerSession() : null;

  return (
    <DashboardHeader
      navigation={navigation}
      authEnabled={hasNeonAuth}
      authStatus={session?.user ? "authenticated" : "anonymous"}
    />
  );
}
