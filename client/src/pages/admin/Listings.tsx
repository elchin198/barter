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
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Package, 
  MoreHorizontal, 
  Eye, 
  MapPin, 
  UserCircle, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  PauseCircle
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Sample listing data - this would normally come from an API
const mockListings = [
  {
    id: 1,
    title: "Samsung Smart TV 55-inch",
    category: "Electronics",
    status: "active",
    createdAt: "2023-11-10T12:30:00",
    city: "Bakı",
    owner: {
      id: 1,
      username: "user1"
    },
    viewCount: 145,
    imageUrl: "/images/tv.jpg"
  },
  {
    id: 2,
    title: "Mountain Bike",
    category: "Sports",
    status: "pending",
    createdAt: "2023-11-08T09:15:00",
    city: "Gəncə",
    owner: {
      id: 2,
      username: "user2"
    },
    viewCount: 67,
    imageUrl: "/images/bike.jpg"
  },
  {
    id: 3,
    title: "Leather Sofa Set",
    category: "Furniture",
    status: "active",
    createdAt: "2023-11-06T16:45:00",
    city: "Bakı",
    owner: {
      id: 3,
      username: "user3"
    },
    viewCount: 212,
    imageUrl: "/images/sofa.jpg"
  },
  {
    id: 4,
    title: "iPhone 13 Pro",
    category: "Electronics",
    status: "suspended",
    createdAt: "2023-11-04T11:20:00",
    city: "Sumqayıt",
    owner: {
      id: 1,
      username: "user1"
    },
    viewCount: 95,
    imageUrl: "/images/iphone.jpg"
  },
  {
    id: 5,
    title: "Gaming Laptop",
    category: "Electronics",
    status: "active",
    createdAt: "2023-11-02T14:10:00",
    city: "Bakı",
    owner: {
      id: 4,
      username: "user4"
    },
    viewCount: 178,
    imageUrl: "/images/laptop.jpg"
  }
];

export default function ListingsAdmin() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  // Filter listings based on search, category, and status
  const filteredListings = mockListings.filter(listing => {
    const matchesSearch = 
      listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.owner.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = 
      categoryFilter === "" || 
      listing.category === categoryFilter;
    
    const matchesStatus = 
      statusFilter === "" || 
      listing.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });
  
  // Get unique categories for filter
  const categories = Array.from(new Set(mockListings.map(listing => listing.category)));
  
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
            <h2 className="text-3xl font-bold tracking-tight">Listings Management</h2>
            <p className="text-muted-foreground">Manage and moderate all barter items</p>
          </div>
        </div>
        
        <div className="flex flex-col space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockListings.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {mockListings.filter(item => item.status === 'active').length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <PauseCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {mockListings.filter(item => item.status === 'pending').length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Suspended</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {mockListings.filter(item => item.status === 'suspended').length}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or owner..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Listings Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Listing</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredListings.map((listing) => (
                    <TableRow key={listing.id}>
                      <TableCell className="font-medium">{listing.title}</TableCell>
                      <TableCell>{listing.category}</TableCell>
                      <TableCell>
                        {listing.status === 'active' && (
                          <Badge className="bg-green-500 text-white">Active</Badge>
                        )}
                        {listing.status === 'pending' && (
                          <Badge variant="outline">Pending</Badge>
                        )}
                        {listing.status === 'suspended' && (
                          <Badge variant="destructive">Suspended</Badge>
                        )}
                      </TableCell>
                      <TableCell>{listing.city}</TableCell>
                      <TableCell>{listing.owner.username}</TableCell>
                      <TableCell>{formatDate(listing.createdAt)}</TableCell>
                      <TableCell>{listing.viewCount}</TableCell>
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
                              View Listing
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem className="flex items-center">
                              <MapPin className="mr-2 h-4 w-4" />
                              View on Map
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem className="flex items-center">
                              <UserCircle className="mr-2 h-4 w-4" />
                              View Owner
                            </DropdownMenuItem>
                            
                            {listing.status !== 'active' && (
                              <DropdownMenuItem className="flex items-center">
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Approve
                              </DropdownMenuItem>
                            )}
                            
                            {listing.status !== 'suspended' && (
                              <DropdownMenuItem className="flex items-center text-amber-500">
                                <AlertCircle className="mr-2 h-4 w-4" />
                                Suspend
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuItem className="flex items-center text-destructive">
                              <XCircle className="mr-2 h-4 w-4" />
                              Delete
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