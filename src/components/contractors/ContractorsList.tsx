import { useState } from 'react';
import { formatDate } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { MoreHorizontal, Edit, Trash2, Building, Phone, Mail, ArrowUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SuperAdminAPI } from '@/services/superAdminApi';

interface Contractor {
  id: string;
  company_name: string;
  contact_number: string;
  status: string;
  allowed_locations: number;
  allowed_attendants_per_location: number;
  rates_2wheeler: any;
  rates_4wheeler: any;
  created_on: string;
  profiles?: {
    user_name: string;
    email: string;
    phone_number: string;
  };
}

interface ContractorsListProps {
  contractors: Contractor[];
  onEdit: (contractor: Contractor) => void;
  onRefresh: () => void;
  onSort?: (field: string) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  loading?: boolean;
}

export function ContractorsList({ contractors, onEdit, onRefresh, onSort, sortBy, sortOrder, loading }: ContractorsListProps) {
  const [deleteContractor, setDeleteContractor] = useState<Contractor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!deleteContractor) return;

    setIsDeleting(true);
    try {
      await SuperAdminAPI.deleteContractor(deleteContractor.id);
      toast({
        title: 'Success',
        description: 'Contractor deleted successfully',
      });
      onRefresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete contractor',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteContractor(null);
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge className="bg-success/10 text-success border-success/20">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    );
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortOrder === 'asc' ? 
      <ArrowUpDown className="h-4 w-4 rotate-180" /> : 
      <ArrowUpDown className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading contractors...</p>
        </div>
      </div>
    );
  }

  if (contractors.length === 0) {
    return (
      <div className="py-12">
        <div className="text-center">
          <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No contractors found</h3>
          <p className="text-muted-foreground">
            Get started by adding your first contractor
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onSort?.('company_name')}
              >
                <div className="flex items-center space-x-1">
                  <span>Company</span>
                  {getSortIcon('company_name')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onSort?.('profiles.user_name')}
              >
                <div className="flex items-center space-x-1">
                  <span>Contact Person</span>
                  {getSortIcon('profiles.user_name')}
                </div>
              </TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onSort?.('status')}
              >
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  {getSortIcon('status')}
                </div>
              </TableHead>
              <TableHead>Locations</TableHead>
              <TableHead>Attendants/Location</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onSort?.('created_on')}
              >
                <div className="flex items-center space-x-1">
                  <span>Joined</span>
                  {getSortIcon('created_on')}
                </div>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
              <TableBody>
                {contractors.map((contractor) => (
                  <TableRow key={contractor.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{contractor.company_name || 'N/A'}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div>
                        <div className="font-medium">{contractor.profiles?.user_name || 'N/A'}</div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span>{contractor.profiles?.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span>{contractor.contact_number || 'N/A'}</span>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>{getStatusBadge(contractor.status)}</TableCell>
                    
                    <TableCell>
                      <Badge variant="outline">{contractor.allowed_locations}</Badge>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="outline">{contractor.allowed_attendants_per_location}</Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(contractor.created_on)}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(contractor)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeleteContractor(contractor)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {contractors.map((contractor) => (
          <Card key={contractor.id} className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h3 className="font-medium text-sm">{contractor.company_name || 'N/A'}</h3>
                    <p className="text-xs text-muted-foreground">{contractor.profiles?.user_name || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(contractor.status)}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(contractor)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setDeleteContractor(contractor)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="flex items-center space-x-1">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate">{contractor.profiles?.email || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span>{contractor.contact_number || 'N/A'}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">Locations:</span>
                  <Badge variant="outline" className="text-xs">{contractor.allowed_locations}</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">Attendants:</span>
                  <Badge variant="outline" className="text-xs">{contractor.allowed_attendants_per_location}</Badge>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                Joined: {formatDate(contractor.created_on)}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deleteContractor} onOpenChange={() => setDeleteContractor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contractor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteContractor?.company_name}"? This action cannot be undone and will also remove all associated locations and attendants.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}