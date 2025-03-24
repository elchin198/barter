import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/components/admin/AdminLayout';
import { Users, ShoppingBag, DollarSign, Calendar } from 'lucide-react';
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import * as RechartsPrimitive from "recharts";

export default function AdminDashboard() {
  const { t } = useTranslation();

  // Placeholder data
  const stats = [
    {
      title: t('admin.totalUsers', 'Total Users'),
      value: "250",
      icon: <Users className="h-4 w-4 text-muted-foreground" />
    },
    {
      title: t('admin.totalItems', 'Total Items'),
      value: "430",
      icon: <ShoppingBag className="h-4 w-4 text-muted-foreground" />
    },
    {
      title: t('admin.completedDeals', 'Completed Deals'),
      value: "89",
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />
    },
    {
      title: t('admin.thisMonth', 'This Month'),
      value: "+24",
      icon: <Calendar className="h-4 w-4 text-muted-foreground" />
    }
  ];

  // Chart data
  const userChartData = [
    { name: "Jan", users: 12 },
    { name: "Feb", users: 18 },
    { name: "Mar", users: 24 },
    { name: "Apr", users: 32 },
    { name: "May", users: 40 },
    { name: "Jun", users: 43 },
  ];

  const itemChartData = [
    { name: "Jan", items: 24 },
    { name: "Feb", items: 28 },
    { name: "Mar", items: 42 },
    { name: "Apr", items: 58 },
    { name: "May", items: 84 },
    { name: "Jun", items: 96 },
  ];

  return (
    <AdminLayout>
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            {t('admin.dashboard', 'Dashboard')}
          </h1>
        </div>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">
              {t('admin.overview', 'Overview')}
            </TabsTrigger>
            <TabsTrigger value="analytics" disabled>
              {t('admin.analytics', 'Analytics')}
            </TabsTrigger>
            <TabsTrigger value="reports" disabled>
              {t('admin.reports', 'Reports')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    {stat.icon}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-8">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>{t('admin.newUsers', 'New Users')}</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="h-[300px]">
                    <ChartContainer
                      config={{
                        users: { label: "Active Users", color: "#0891b2" },
                      }}
                    >
                      <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
                        <RechartsPrimitive.BarChart
                          data={userChartData}
                          margin={{
                            top: 16,
                            right: 16,
                            bottom: 16,
                            left: 16,
                          }}
                        >
                          <RechartsPrimitive.XAxis dataKey="name" />
                          <RechartsPrimitive.YAxis width={40} />
                          <ChartTooltip
                            content={<ChartTooltipContent />}
                          />
                          <RechartsPrimitive.Bar
                            dataKey="users"
                            fill="var(--color-users, #0891b2)"
                            radius={4}
                          />
                        </RechartsPrimitive.BarChart>
                      </RechartsPrimitive.ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>{t('admin.itemsPosted', 'Items Posted')}</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="h-[300px]">
                    <ChartContainer
                      config={{
                        items: { label: "Items", color: "#4f46e5" },
                      }}
                    >
                      <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
                        <RechartsPrimitive.BarChart
                          data={itemChartData}
                          margin={{
                            top: 16,
                            right: 16,
                            bottom: 16,
                            left: 16,
                          }}
                        >
                          <RechartsPrimitive.XAxis dataKey="name" />
                          <RechartsPrimitive.YAxis width={40} />
                          <ChartTooltip
                            content={<ChartTooltipContent />}
                          />
                          <RechartsPrimitive.Bar
                            dataKey="items"
                            fill="var(--color-items, #4f46e5)"
                            radius={4}
                          />
                        </RechartsPrimitive.BarChart>
                      </RechartsPrimitive.ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}