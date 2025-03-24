import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  MoreHorizontal, 
  Search, 
  UserCheck, 
  UserX, 
  Ban, 
  ShieldCheck, 
  User, 
  Eye, 
  XCircle 
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Sample User data - this would normally come from an API
const mockUsers = [
  { 
    id: 1, 
    username: 'user1', 
    email: 'user1@example.com', 
    fullName: 'User One', 
    role: 'user', 
    status: 'active',
    itemCount: 12,
    offerCount: 5,
    registeredAt: '2023-10-15T12:00:00'
  },
  { 
    id: 2, 
    username: 'user2', 
    email: 'user2@example.com', 
    fullName: 'User Two', 
    role: 'user', 
    status: 'banned',
    itemCount: 0,
    offerCount: 0,
    registeredAt: '2023-09-25T14:30:00'
  },
  { 
    id: 3, 
    username: 'admin1', 
    email: 'admin@example.com', 
    fullName: 'Admin User', 
    role: 'admin', 
    status: 'active',
    itemCount: 3,
    offerCount: 2,
    registeredAt: '2023-08-12T09:15:00'
  },
  { 
    id: 4, 
    username: 'user3', 
    email: 'user3@example.com', 
    fullName: 'User Three', 
    role: 'user', 
    status: 'inactive',
    itemCount: 5,
    offerCount: 0,
    registeredAt: '2023-11-01T17:45:00'
  },
  { 
    id: 5, 
    username: 'user4', 
    email: 'user4@example.com', 
    fullName: 'User Four', 
    role: 'user', 
    status: 'active',
    itemCount: 22,
    offerCount: 15,
    registeredAt: '2023-07-20T10:30:00'
  },
];

export default function UsersAdmin() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Filter users based on search and status
  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      user.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('az-AZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Users Management</h2>
            <p className="text-muted-foreground">Manage user accounts and permissions</p>
          </div>
        </div>
        
        <div className="flex flex-col space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockUsers.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {mockUsers.filter(user => user.status === 'active').length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Banned Users</CardTitle>
                <Ban className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {mockUsers.filter(user => user.status === 'banned').length}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by username, email or name..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Tabs 
              defaultValue="all" 
              className="w-full sm:w-auto"
              onValueChange={setStatusFilter}
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="banned">Banned</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Users Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{user.username}</span>
                          <span className="text-sm text-muted-foreground">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.role === 'admin' ? (
                          <Badge className="bg-primary text-primary-foreground">Admin</Badge>
                        ) : (
                          <Badge variant="outline">User</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.status === 'active' && (
                          <Badge className="bg-green-500 text-white">Active</Badge>
                        )}
                        {user.status === 'banned' && (
                          <Badge variant="destructive">Banned</Badge>
                        )}
                        {user.status === 'inactive' && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>{user.itemCount}</TableCell>
                      <TableCell>{formatDate(user.registeredAt)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="flex items-center">
                              <Eye className="mr-2 h-4 w-4" />
                              View Profile
                            </DropdownMenuItem>
                            
                            {user.role !== 'admin' && (
                              <DropdownMenuItem className="flex items-center">
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Make Admin
                              </DropdownMenuItem>
                            )}
                            
                            {user.status === 'active' ? (
                              <DropdownMenuItem className="flex items-center text-destructive">
                                <Ban className="mr-2 h-4 w-4" />
                                Ban User
                              </DropdownMenuItem>
                            ) : user.status === 'banned' ? (
                              <DropdownMenuItem className="flex items-center">
                                <UserCheck className="mr-2 h-4 w-4" />
                                Unban User
                              </DropdownMenuItem>
                            ) : null}
                            
                            <DropdownMenuItem className="flex items-center text-destructive">
                              <XCircle className="mr-2 h-4 w-4" />
                              Delete Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}