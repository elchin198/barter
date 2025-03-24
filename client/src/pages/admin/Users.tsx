import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AdminAPI } from '@/lib/api';
import { User } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Trash2, 
  MoreVertical, 
  Lock, 
  Unlock, 
  Shield, 
  User as UserIcon,
  Loader2,
  UserX,
  ShieldAlert
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { queryClient } from '@/lib/queryClient';

export default function UsersAdmin() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [userIdToDelete, setUserIdToDelete] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);

  // Fetch users data
  const { data: users, isLoading, isError, error } = useQuery({
    queryKey: ['/api/admin/users', search],
    queryFn: () => AdminAPI.getUsers(search),
  });

  // Fetch detailed user data when a user is selected
  const { data: userDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['/api/admin/users', selectedUser?.id],
    queryFn: () => selectedUser ? AdminAPI.getUser(selectedUser.id) : null,
    enabled: !!selectedUser,
  });

  // Mutation for changing user role
  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number, role: 'user' | 'admin' }) => 
      AdminAPI.updateUserRole(id, role),
    onSuccess: () => {
      toast({
        title: t('admin.roleUpdated', 'Role updated'),
        description: t('admin.roleUpdatedDescription', 'User role has been updated successfully'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: t('admin.roleUpdateFailed', 'Failed to update role'),
        description: error.message,
      });
    }
  });

  // Mutation for changing user status
  const statusMutation = useMutation({
    mutationFn: ({ id, active }: { id: number, active: boolean }) => 
      AdminAPI.updateUserStatus(id, active),
    onSuccess: () => {
      toast({
        title: t('admin.statusUpdated', 'Status updated'),
        description: t('admin.statusUpdatedDescription', 'User status has been updated successfully'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: t('admin.statusUpdateFailed', 'Failed to update status'),
        description: error.message,
      });
    }
  });

  // Mutation for deleting a user
  const deleteMutation = useMutation({
    mutationFn: (id: number) => AdminAPI.deleteUser(id),
    onSuccess: () => {
      toast({
        title: t('admin.userDeleted', 'User deleted'),
        description: t('admin.userDeletedDescription', 'User has been deleted successfully'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setUserIdToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: t('admin.userDeleteFailed', 'Failed to delete user'),
        description: error.message,
      });
      setUserIdToDelete(null);
    }
  });

  // Handle role change
  const handleRoleChange = (user: User, newRole: 'user' | 'admin') => {
    if (user.role !== newRole) {
      roleMutation.mutate({ id: user.id, role: newRole });
    }
  };

  // Handle status change
  const handleStatusChange = (user: User, newActive: boolean) => {
    statusMutation.mutate({ id: user.id, active: newActive });
  };

  // Handle user delete
  const handleDeleteUser = () => {
    if (userIdToDelete) {
      deleteMutation.mutate(userIdToDelete);
    }
  };

  // View user details
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserDetail(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            {t('admin.users', 'Users')}
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('admin.searchUsers', 'Search users...') || ''}
              className="w-full pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="bg-destructive/10 p-4 rounded-md text-center">
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : 'Failed to load users'}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.id', 'ID')}</TableHead>
                  <TableHead>{t('admin.username', 'Username')}</TableHead>
                  <TableHead>{t('admin.email', 'Email')}</TableHead>
                  <TableHead>{t('admin.fullName', 'Full Name')}</TableHead>
                  <TableHead>{t('admin.role', 'Role')}</TableHead>
                  <TableHead>{t('admin.status', 'Status')}</TableHead>
                  <TableHead>{t('admin.joinDate', 'Join Date')}</TableHead>
                  <TableHead className="text-right">{t('admin.actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users && users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.id}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.fullName || '-'}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.role === 'admin' ? 'default' : 'outline'}
                          className="flex w-fit items-center gap-1"
                        >
                          {user.role === 'admin' ? (
                            <ShieldAlert className="h-3 w-3" />
                          ) : (
                            <UserIcon className="h-3 w-3" />
                          )}
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.active ? 'success' : 'destructive'}
                          className="flex w-fit items-center gap-1"
                        >
                          {user.active ? (
                            <UserIcon className="h-3 w-3" />
                          ) : (
                            <UserX className="h-3 w-3" />
                          )}
                          {user.active ? 'Active' : 'Blocked'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewUser(user)}>
                              <UserIcon className="mr-2 h-4 w-4" />
                              {t('admin.viewDetails', 'View Details')}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleRoleChange(user, user.role === 'admin' ? 'user' : 'admin')}
                            >
                              {user.role === 'admin' ? (
                                <>
                                  <UserIcon className="mr-2 h-4 w-4" />
                                  {t('admin.makeUser', 'Make User')}
                                </>
                              ) : (
                                <>
                                  <Shield className="mr-2 h-4 w-4" />
                                  {t('admin.makeAdmin', 'Make Admin')}
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(user, !user.active)}
                            >
                              {user.active ? (
                                <>
                                  <Lock className="mr-2 h-4 w-4" />
                                  {t('admin.block', 'Block')}
                                </>
                              ) : (
                                <>
                                  <Unlock className="mr-2 h-4 w-4" />
                                  {t('admin.unblock', 'Unblock')}
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => setUserIdToDelete(user.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t('admin.delete', 'Delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      {search
                        ? t('admin.noMatchingUsers', 'No users match your search')
                        : t('admin.noUsers', 'No users found')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* User Detail Dialog */}
      <Dialog open={showUserDetail} onOpenChange={setShowUserDetail}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('admin.userDetails', 'User Details')}</DialogTitle>
            <DialogDescription>
              {t('admin.viewingUserDetails', 'Viewing detailed information for this user.')}
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingDetail ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : userDetail ? (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium text-right">{t('admin.id', 'ID')}:</span>
                <span className="col-span-3">{userDetail.id}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium text-right">{t('admin.username', 'Username')}:</span>
                <span className="col-span-3">{userDetail.username}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium text-right">{t('admin.email', 'Email')}:</span>
                <span className="col-span-3">{userDetail.email}</span>
              </div>
              {userDetail.fullName && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-sm font-medium text-right">{t('admin.fullName', 'Full Name')}:</span>
                  <span className="col-span-3">{userDetail.fullName}</span>
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium text-right">{t('admin.role', 'Role')}:</span>
                <span className="col-span-3">
                  <Badge variant={userDetail.role === 'admin' ? 'default' : 'outline'}>
                    {userDetail.role}
                  </Badge>
                </span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium text-right">{t('admin.status', 'Status')}:</span>
                <span className="col-span-3">
                  <Badge variant={userDetail.active ? 'success' : 'destructive'}>
                    {userDetail.active ? 'Active' : 'Blocked'}
                  </Badge>
                </span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium text-right">{t('admin.joinDate', 'Join Date')}:</span>
                <span className="col-span-3">{formatDate(userDetail.createdAt)}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium text-right">{t('admin.items', 'Items')}:</span>
                <span className="col-span-3">{userDetail.itemsCount || 0}</span>
              </div>
              {userDetail.averageRating !== undefined && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-sm font-medium text-right">{t('admin.rating', 'Rating')}:</span>
                  <span className="col-span-3">
                    {userDetail.averageRating.toFixed(1)} ⭐ ({userDetail.reviewCount || 0} reviews)
                  </span>
                </div>
              )}
            </div>
          ) : null}
          
          <DialogFooter>
            <Button onClick={() => setShowUserDetail(false)}>
              {t('common.close', 'Close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userIdToDelete} onOpenChange={(open) => !open && setUserIdToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.confirmDelete', 'Confirm deletion')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.deleteWarning', "This action cannot be undone. This will permanently delete the user's account and remove their data from our servers.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('common.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {t('admin.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}