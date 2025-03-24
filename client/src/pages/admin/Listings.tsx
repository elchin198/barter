import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { AdminAPI } from '@/lib/api';
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
  DropdownMenuSeparator
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
  PauseCircle,
  Loader2
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Item } from '@shared/schema';

interface ItemWithDetails extends Item {
  mainImage?: string;
  owner?: {
    id: number;
    username: string;
    fullName?: string;
  };
  offerCount?: number;
  viewCount?: number;
}

export default function ListingsAdmin() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [itemToUpdateStatus, setItemToUpdateStatus] = useState<{id: number, status: 'active' | 'pending' | 'suspended' | 'completed'} | null>(null);
  
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch items from API
  const { data: items = [], isLoading } = useQuery<ItemWithDetails[]>({
    queryKey: ['/api/admin/items', { search: searchTerm, category: categoryFilter, status: statusFilter }],
    queryFn: () => AdminAPI.getItems({
      search: searchTerm || undefined,
      category: categoryFilter || undefined,
      status: statusFilter || undefined
    })
  });
  
  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: (id: number) => AdminAPI.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/items'] });
      toast({
        title: "Əşya silindi",
        description: "Əşya uğurla silindi",
        variant: "default"
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Xəta",
        description: `Əşya silinmədi: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Update item status mutation
  const updateItemStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: 'active' | 'pending' | 'suspended' | 'completed' }) => 
      AdminAPI.updateItemStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/items'] });
      
      const statusMessages = {
        active: "Əşya aktivləşdirildi",
        pending: "Əşya gözləmə rejimində",
        suspended: "Əşya dayandırıldı",
        completed: "Əşya tamamlandı"
      };
      
      toast({
        title: "Status yeniləndi",
        description: statusMessages[itemToUpdateStatus?.status || 'active'],
        variant: "default"
      });
      
      setIsStatusDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Xəta",
        description: `Status yenilənmədi: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Handle item deletion
  const handleDeleteItem = (id: number) => {
    setItemToDelete(id);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle item status update
  const handleUpdateStatus = (id: number, status: 'active' | 'pending' | 'suspended' | 'completed') => {
    setItemToUpdateStatus({ id, status });
    setIsStatusDialogOpen(true);
  };
  
  // Get unique categories for filter
  const categories = Array.from(new Set(items.map(item => item.category).filter(Boolean) as string[]));
  
  // Format date
  const formatDate = (dateString: string | Date) => {
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
            <h2 className="text-3xl font-bold tracking-tight">Elanlar İdarəetməsi</h2>
            <p className="text-muted-foreground">Bütün barter elanlarını idarə və nəzarət edin</p>
          </div>
        </div>
        
        <div className="flex flex-col space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Cəmi Elanlar</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : items.length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Aktiv</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? 
                    <Loader2 className="h-6 w-6 animate-spin" /> : 
                    items.filter(item => item.status === 'active').length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Gözləmədə</CardTitle>
                <PauseCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? 
                    <Loader2 className="h-6 w-6 animate-spin" /> : 
                    items.filter(item => item.status === 'pending').length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Dayandırılmış</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? 
                    <Loader2 className="h-6 w-6 animate-spin" /> : 
                    items.filter(item => item.status === 'suspended').length}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Başlığa və ya sahibə görə axtar..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Kateqoriya" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Bütün Kateqoriyalar</SelectItem>
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
                <SelectItem value="">Bütün Statuslar</SelectItem>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="pending">Gözləmədə</SelectItem>
                <SelectItem value="suspended">Dayandırılmış</SelectItem>
                <SelectItem value="completed">Tamamlanmış</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Listings Table */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <span className="ml-2">Elanlar yüklənir...</span>
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Package className="h-12 w-12 text-gray-300 mb-2" />
                  <h3 className="text-lg font-medium mb-1">Elan tapılmadı</h3>
                  <p className="text-sm text-gray-500">
                    Seçilmiş filterlərlə uyğun elan yoxdur
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Elan</TableHead>
                      <TableHead>Kateqoriya</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Şəhər</TableHead>
                      <TableHead>Sahibi</TableHead>
                      <TableHead>Yaradıldı</TableHead>
                      <TableHead className="text-right">Əməliyyatlar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            {item.mainImage ? (
                              <div className="w-8 h-8 mr-3 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                                <img src={item.mainImage} alt={item.title} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 mr-3 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <Package className="h-4 w-4 text-gray-400" />
                              </div>
                            )}
                            <span className="line-clamp-1">{item.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>{item.category || 'N/A'}</TableCell>
                        <TableCell>
                          {item.status === 'active' && (
                            <Badge className="bg-green-500 text-white">Aktiv</Badge>
                          )}
                          {item.status === 'pending' && (
                            <Badge variant="outline" className="text-amber-500 border-amber-200 bg-amber-50">Gözləmədə</Badge>
                          )}
                          {item.status === 'suspended' && (
                            <Badge variant="destructive">Dayandırılmış</Badge>
                          )}
                          {item.status === 'completed' && (
                            <Badge variant="outline" className="text-blue-500 border-blue-200 bg-blue-50">Tamamlanmış</Badge>
                          )}
                        </TableCell>
                        <TableCell>{item.city || 'N/A'}</TableCell>
                        <TableCell>
                          {item.owner ? (
                            <div className="flex items-center space-x-1">
                              <span>{item.owner.username}</span>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6" 
                                onClick={() => navigate(`/admin/users/${item.owner?.id}`)}
                              >
                                <UserCircle className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : 'N/A'}
                        </TableCell>
                        <TableCell>{formatDate(item.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Əməliyyatlar</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                className="flex items-center"
                                onClick={() => navigate(`/items/${item.id}`)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Elana bax
                              </DropdownMenuItem>
                              
                              {item.city && (
                                <DropdownMenuItem 
                                  className="flex items-center"
                                  onClick={() => navigate(`/map?city=${item.city}`)}
                                >
                                  <MapPin className="mr-2 h-4 w-4" />
                                  Xəritədə göstər
                                </DropdownMenuItem>
                              )}
                              
                              {item.owner && (
                                <DropdownMenuItem 
                                  className="flex items-center"
                                  onClick={() => navigate(`/admin/users/${item.owner?.id}`)}
                                >
                                  <UserCircle className="mr-2 h-4 w-4" />
                                  Sahibə bax
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuSeparator />
                              
                              {item.status !== 'active' && (
                                <DropdownMenuItem 
                                  className="flex items-center text-green-600"
                                  onClick={() => handleUpdateStatus(item.id, 'active')}
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Aktivləşdir
                                </DropdownMenuItem>
                              )}
                              
                              {item.status !== 'pending' && (
                                <DropdownMenuItem 
                                  className="flex items-center text-amber-500"
                                  onClick={() => handleUpdateStatus(item.id, 'pending')}
                                >
                                  <PauseCircle className="mr-2 h-4 w-4" />
                                  Gözləməyə al
                                </DropdownMenuItem>
                              )}
                              
                              {item.status !== 'suspended' && (
                                <DropdownMenuItem 
                                  className="flex items-center text-red-500"
                                  onClick={() => handleUpdateStatus(item.id, 'suspended')}
                                >
                                  <AlertCircle className="mr-2 h-4 w-4" />
                                  Dayandır
                                </DropdownMenuItem>
                              )}
                              
                              {item.status !== 'completed' && (
                                <DropdownMenuItem 
                                  className="flex items-center text-blue-500"
                                  onClick={() => handleUpdateStatus(item.id, 'completed')}
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Tamamlandı olaraq işarələ
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuSeparator />
                              
                              <DropdownMenuItem 
                                className="flex items-center text-destructive"
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Sil
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Confirmation dialogs */}
      <AlertDialog 
        open={isDeleteDialogOpen} 
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elanı silmək istədiyinizə əminsiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu əməliyyat geri qaytarıla bilməz. Bu elan və bütün əlaqəli məlumatlar daimi olaraq silinəcək.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ləğv et</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => itemToDelete && deleteItemMutation.mutate(itemToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteItemMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Silinir...
                </>
              ) : (
                "Sil"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog 
        open={isStatusDialogOpen} 
        onOpenChange={setIsStatusDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Elanın statusunu dəyişmək istədiyinizə əminsiniz?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {itemToUpdateStatus?.status === 'active' && "Bu elan aktivləşdiriləcək və platformada görünəcək."}
              {itemToUpdateStatus?.status === 'pending' && "Bu elan gözləmə rejiminə keçəcək və platformada görünməyəcək."}
              {itemToUpdateStatus?.status === 'suspended' && "Bu elan dayandırılacaq və platformada görünməyəcək."}
              {itemToUpdateStatus?.status === 'completed' && "Bu elan tamamlandı olaraq işarələnəcək və platformada aktivliyini itirəcək."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ləğv et</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => itemToUpdateStatus && updateItemStatusMutation.mutate(itemToUpdateStatus)}
              className={
                itemToUpdateStatus?.status === 'active' ? "bg-green-600 hover:bg-green-700" :
                itemToUpdateStatus?.status === 'pending' ? "bg-amber-500 hover:bg-amber-600" :
                itemToUpdateStatus?.status === 'suspended' ? "bg-red-600 hover:bg-red-700" : 
                "bg-blue-600 hover:bg-blue-700"
              }
            >
              {updateItemStatusMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Yenilənir...
                </>
              ) : (
                "Təsdiq et"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}