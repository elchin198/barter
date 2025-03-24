import AdminLayout from '@/components/admin/AdminLayout';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

// Sample data - this would normally come from an API
const userRegistrationData = [
  { month: 'Jan', users: 12 },
  { month: 'Feb', users: 19 },
  { month: 'Mar', users: 25 },
  { month: 'Apr', users: 31 },
  { month: 'May', users: 42 },
  { month: 'Jun', users: 33 },
  { month: 'Jul', users: 47 },
  { month: 'Aug', users: 51 },
  { month: 'Sep', users: 42 },
  { month: 'Oct', users: 35 },
  { month: 'Nov', users: 28 },
  { month: 'Dec', users: 24 }
];

const listingsByCategoryData = [
  { name: 'Electronics', value: 35 },
  { name: 'Furniture', value: 22 },
  { name: 'Clothing', value: 18 },
  { name: 'Sports', value: 15 },
  { name: 'Books', value: 10 },
  { name: 'Other', value: 8 }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

const barterCompletionData = [
  { month: 'Jan', completed: 8, cancelled: 2 },
  { month: 'Feb', completed: 10, cancelled: 3 },
  { month: 'Mar', completed: 15, cancelled: 4 },
  { month: 'Apr', completed: 18, cancelled: 3 },
  { month: 'May', completed: 25, cancelled: 5 },
  { month: 'Jun', completed: 22, cancelled: 4 },
  { month: 'Jul', completed: 28, cancelled: 6 },
  { month: 'Aug', completed: 30, cancelled: 4 },
  { month: 'Sep', completed: 24, cancelled: 5 },
  { month: 'Oct', completed: 20, cancelled: 3 },
  { month: 'Nov', completed: 16, cancelled: 4 },
  { month: 'Dec', completed: 12, cancelled: 2 }
];

const citiesActivityData = [
  { city: 'Bakı', listings: 145, offers: 87, completed: 42 },
  { city: 'Gəncə', listings: 62, offers: 35, completed: 18 },
  { city: 'Sumqayıt', listings: 48, offers: 29, completed: 14 },
  { city: 'Mingəçevir', listings: 25, offers: 15, completed: 7 },
  { city: 'Şəki', listings: 15, offers: 8, completed: 3 }
];

export default function StatsAdmin() {
  const [timeRange, setTimeRange] = useState('yearly');
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Statistics</h2>
            <p className="text-muted-foreground">Platform analytics and performance metrics</p>
          </div>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Last 30 days</SelectItem>
              <SelectItem value="quarterly">Last Quarter</SelectItem>
              <SelectItem value="yearly">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {/* User Growth Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
              <CardDescription>Monthly user registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={userRegistrationData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="users" 
                      stroke="#8884d8" 
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Listings by Category Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Listings by Category</CardTitle>
              <CardDescription>Distribution of items across categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={listingsByCategoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {listingsByCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} listings`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Barter Completion Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Barter Completion Rate</CardTitle>
              <CardDescription>Monthly successful vs cancelled trades</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barterCompletionData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completed" name="Completed" fill="#82ca9d" />
                    <Bar dataKey="cancelled" name="Cancelled" fill="#ff8042" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Cities Activity */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Cities Activity</CardTitle>
              <CardDescription>Platform usage by location</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={citiesActivityData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="city" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="listings" name="Listings" fill="#8884d8" />
                    <Bar dataKey="offers" name="Offers" fill="#82ca9d" />
                    <Bar dataKey="completed" name="Completed Trades" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Additional Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Metrics</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="user" className="space-y-4">
              <TabsList>
                <TabsTrigger value="user">User Metrics</TabsTrigger>
                <TabsTrigger value="content">Content Metrics</TabsTrigger>
                <TabsTrigger value="engagement">Engagement</TabsTrigger>
              </TabsList>
              
              <TabsContent value="user" className="space-y-4">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                  <div className="flex flex-col space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">Total Registered Users</span>
                    <span className="text-2xl font-bold">325</span>
                    <span className="text-sm text-green-500">↑ 12% from last month</span>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">Active Users (Monthly)</span>
                    <span className="text-2xl font-bold">187</span>
                    <span className="text-sm text-green-500">↑ 8% from last month</span>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">New Users (Last 30 Days)</span>
                    <span className="text-2xl font-bold">42</span>
                    <span className="text-sm text-green-500">↑ 15% from previous period</span>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="content" className="space-y-4">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                  <div className="flex flex-col space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">Total Listings</span>
                    <span className="text-2xl font-bold">578</span>
                    <span className="text-sm text-green-500">↑ 9% from last month</span>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">New Listings (Last 30 Days)</span>
                    <span className="text-2xl font-bold">87</span>
                    <span className="text-sm text-green-500">↑ 12% from previous period</span>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">Average Images per Listing</span>
                    <span className="text-2xl font-bold">3.2</span>
                    <span className="text-sm text-green-500">↑ 0.4 from last month</span>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="engagement" className="space-y-4">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                  <div className="flex flex-col space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">Barter Success Rate</span>
                    <span className="text-2xl font-bold">68%</span>
                    <span className="text-sm text-green-500">↑ 5% from last month</span>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">Average Response Time</span>
                    <span className="text-2xl font-bold">3.5h</span>
                    <span className="text-sm text-red-500">↓ 0.8h from last month</span>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">Average Rating</span>
                    <span className="text-2xl font-bold">4.7/5.0</span>
                    <span className="text-sm text-green-500">↑ 0.2 from last month</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}