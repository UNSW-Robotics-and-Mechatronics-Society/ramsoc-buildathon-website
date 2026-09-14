import { getAdminMarket } from "@/app/2026/admin/_actions/market";
import AdminShell from "../_components/AdminShell";
import MarketPanel from "../_components/MarketPanel";

export default async function AdminMarketPage() {
  const data = await getAdminMarket();

  return (
    <AdminShell title="Black Market">
      <MarketPanel
        open={data.open}
        messages={data.messages}
        tickets={data.tickets}
      />
    </AdminShell>
  );
}
