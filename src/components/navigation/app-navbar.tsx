import { DashboardHeader } from "@/features/home/components/dashboard-header";
import { getServerSession } from "@/lib/auth/server";
import { getEnvironmentStatus } from "@/lib/env";
import { getHomeNavigation } from "@/server/markets/catalog";
import { getViewerForecastBalance } from "@/server/markets/trading";

export async function AppNavbar() {
  const { hasNeonAuth } = getEnvironmentStatus();
  const [navigation, session] = await Promise.all([
    getHomeNavigation(),
    hasNeonAuth ? getServerSession() : Promise.resolve(null),
  ]);
  const initialBalance = session?.user
    ? await getViewerForecastBalance({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image ?? null,
      })
    : null;

  return (
    <DashboardHeader
      navigation={navigation}
      authEnabled={hasNeonAuth}
      authStatus={session?.user ? "authenticated" : "anonymous"}
      initialBalance={initialBalance}
    />
  );
}
