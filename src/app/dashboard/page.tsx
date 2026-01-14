import {
  getDashboardStats,
  getSalesAnalytics,
  getCategoryDistribution,
  getRecentActivity,
  getLowStockItems
} from "@/lib/olap-engine";
import DashboardClient from "@/app/dashboard-client";

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const salesData = await getSalesAnalytics();
  const categoryDist = await getCategoryDistribution();
  const recentActivity = await getRecentActivity();
  const lowStockItems = await getLowStockItems();

  // BI data - default to category grouping
  const biData = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/olap/aggregate?groupBy=category`)
    .then(r => r.json())
    .then(d => d.result || [])
    .catch(() => []);

  return (
    <DashboardClient
      stats={stats}
      salesData={salesData}
      categoryDist={categoryDist}
      recentActivity={recentActivity}
      lowStockItems={lowStockItems}
      biData={biData}
    />
  );
}
