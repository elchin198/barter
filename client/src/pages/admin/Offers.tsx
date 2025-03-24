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
  FileBox, 
  MoreHorizontal, 
  Eye, 
  CheckCircle2, 
  XCircle,
  Clock,
  AlertCircle,
  User,
  MessageSquare
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Sample offers data - this would normally come from an API
const mockOffers = [
  {
    id: 1,
    status: "pending",
    fromUser: {
      id: 1,
      username: "user1"
    },
    toUser: {
      id: 2,
      username: "user2"
    },
    fromItem: {
      id: 1,
      title: "Samsung Smart TV 55-inch",
      category: "Electronics"
    },
    toItem: {
      id: 3,
      title: "Mountain Bike",
      category: "Sports"
    },
    createdAt: "2023-11-10T14:30:00",
    updatedAt: "2023-11-10T14:30:00",
    hasReviews: false
  },
  {
    id: 2,
    status: "accepted",
    fromUser: {
      id: 3,
      username: "user3"
    },
    toUser: {
      id: 1,
      username: "user1"
    },
    fromItem: {
      id: 5,
      title: "Leather Sofa Set",
      category: "Furniture"
    },
    toItem: {
      id: 1,
      title: "Samsung Smart TV 55-inch",
      category: "Electronics"
    },
    createdAt: "2023-11-08T09:45:00",
    updatedAt: "2023-11-09T11:15:00",
    hasReviews: true
  },
  {
    id: 3,
    status: "completed",
    fromUser: {
      id: 2,
      username: "user2"
    },
    toUser: {
      id: 4,
      username: "user4"
    },
    fromItem: {
      id: 3,
      title: "Mountain Bike",
      category: "Sports"
    },
    toItem: {
      id: 7,
      title: "Gaming Laptop",
      category: "Electronics"
    },
    createdAt: "2023-11-05T16:20:00",
    updatedAt: "2023-11-07T10:30:00",
    hasReviews: true
  },
  {
    id: 4,
    status: "rejected",
    fromUser: {
      id: 4,
      username: "user4"
    },
    toUser: {
      id: 3,
      username: "user3"
    },
    fromItem: {
      id: 7,
      title: "Gaming Laptop",
      category: "Electronics"
    },
    toItem: {
      id: 5,
      title: "Leather Sofa Set",
      category: "Furniture"
    },
    createdAt: "2023-11-04T12:10:00",
    updatedAt: "2023-11-04T14:25:00",
    hasReviews: false
  },
  {
    id: 5,
    status: "cancelled",
    fromUser: {
      id: 1,
      username: "user1"
    },
    toUser: {
      id: 5,
      username: "user5"
    },
    fromItem: {
      id: 2,
      title: "iPhone 13 Pro",
      category: "Electronics"
    },
    toItem: {
      id: 9,
      title: "Professional Camera",
      category: "Electronics"
    },
    createdAt: "2023-11-01T09:15:00",
    updatedAt: "2023-11-03T17:40:00",
    hasReviews: false
  }
];

export default function OffersAdmin() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  // Filter offers based on search and status
  const filteredOffers = mockOffers.filter(offer => {
    const matchesSearch = 
      offer.fromUser.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.toUser.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.fromItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.toItem.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "" || 
      offer.status === statusFilter;
    
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
            <h2 className="text-3xl font-bold tracking-tight">Offers Management</h2>
            <p className="text-muted-foreground">Monitor and moderate barter offers</p>
          </div>
        </div>
        
        <div className="flex flex-col space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Offers</CardTitle>
                <FileBox className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockOffers.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {mockOffers.filter(offer => offer.status === 'pending').length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Accepted</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {mockOffers.filter(offer => offer.status === 'accepted').length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {mockOffers.filter(offer => offer.status === 'completed').length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {mockOffers.filter(offer => offer.status === 'rejected' || offer.status === 'cancelled').length}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user or item..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Offers Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>From User</TableHead>
                    <TableHead>To User</TableHead>
                    <TableHead>From Item</TableHead>
                    <TableHead>To Item</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Reviews</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOffers.map((offer) => (
                    <TableRow key={offer.id}>
                      <TableCell>{offer.id}</TableCell>
                      <TableCell>
                        {offer.status === 'pending' && (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            Pending
                          </Badge>
                        )}
                        {offer.status === 'accepted' && (
                          <Badge className="bg-blue-500 text-white">
                            Accepted
                          </Badge>
                        )}
                        {offer.status === 'completed' && (
                          <Badge className="bg-green-500 text-white">
                            Completed
                          </Badge>
                        )}
                        {offer.status === 'rejected' && (
                          <Badge variant="destructive">
                            Rejected
                          </Badge>
                        )}
                        {offer.status === 'cancelled' && (
                          <Badge variant="secondary">
                            Cancelled
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{offer.fromUser.username}</TableCell>
                      <TableCell>{offer.toUser.username}</TableCell>
                      <TableCell>{offer.fromItem.title}</TableCell>
                      <TableCell>{offer.toItem.title}</TableCell>
                      <TableCell>{formatDate(offer.createdAt)}</TableCell>
                      <TableCell>
                        {offer.hasReviews ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-300" />
                        )}
                      </TableCell>
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
                              View Details
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem className="flex items-center">
                              <User className="mr-2 h-4 w-4" />
                              View From User
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem className="flex items-center">
                              <User className="mr-2 h-4 w-4" />
                              View To User
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem className="flex items-center">
                              <MessageSquare className="mr-2 h-4 w-4" />
                              View Messages
                            </DropdownMenuItem>
                            
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