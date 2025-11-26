import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { SuperAdminAPI, CreateContractorData } from '@/services/superAdminApi';

const contractorSchema = z.object({
  user_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().optional(),
  confirm_password: z.string().optional(),
  phone_number: z.string().min(10, 'Phone number must be at least 10 digits'),
  company_name: z.string().min(2, 'Company name must be at least 2 characters'),
  contact_number: z.string().min(10, 'Contact number must be at least 10 digits'),
  allowed_locations: z.number().min(1, 'Must allow at least 1 location'),
  allowed_attendants_per_location: z.number().min(1, 'Must allow at least 1 attendant per location'),
  status: z.enum(['active', 'inactive']),
  rates_2wheeler: z.object({
    upTo2Hours: z.number().min(0),
    upTo6Hours: z.number().min(0),
    upTo12Hours: z.number().min(0),
    upTo24Hours: z.number().min(0),
  }),
  rates_4wheeler: z.object({
    upTo2Hours: z.number().min(0),
    upTo6Hours: z.number().min(0),
    upTo12Hours: z.number().min(0),
    upTo24Hours: z.number().min(0),
  }),
}).refine((data) => {
  // Only validate password match if both passwords are provided
  if (data.password && data.confirm_password) {
    return data.password === data.confirm_password;
  }
  return true;
}, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

type ContractorFormData = z.infer<typeof contractorSchema>;

interface ContractorFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contractor?: any;
  isEditing?: boolean;
}

export function ContractorForm({ 
  isOpen, 
  onClose, 
  onSuccess, 
  contractor, 
  isEditing = false 
}: ContractorFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ContractorFormData>({
    resolver: zodResolver(contractorSchema),
    defaultValues: {
      password: '',
      confirm_password: '',
      allowed_locations: 5,
      allowed_attendants_per_location: 10,
      status: 'active' as const,
      rates_2wheeler: {
        upTo2Hours: 2,
        upTo6Hours: 5,
        upTo12Hours: 8,
        upTo24Hours: 12,
      },
      rates_4wheeler: {
        upTo2Hours: 5,
        upTo6Hours: 10,
        upTo12Hours: 18,
        upTo24Hours: 30,
      },
    },
  });

  // Reset form when contractor data changes
  useEffect(() => {
    if (contractor && isEditing) {
      reset({
        user_name: contractor.profiles?.user_name || '',
        email: contractor.profiles?.email || '',
        phone_number: contractor.profiles?.phone_number || '',
        company_name: contractor.company_name || '',
        contact_number: contractor.contact_number || '',
        allowed_locations: contractor.allowed_locations || 5,
        allowed_attendants_per_location: contractor.allowed_attendants_per_location || 10,
        status: contractor.status || 'active',
        rates_2wheeler: contractor.rates_2wheeler || {
          upTo2Hours: 2,
          upTo6Hours: 5,
          upTo12Hours: 8,
          upTo24Hours: 12,
        },
        rates_4wheeler: contractor.rates_4wheeler || {
          upTo2Hours: 5,
          upTo6Hours: 10,
          upTo12Hours: 18,
          upTo24Hours: 30,
        },
        // Don't reset password fields when editing
        password: '',
        confirm_password: '',
      });
    } else if (!isEditing) {
      // Reset to default values for new contractor
      reset({
        password: '',
        confirm_password: '',
        allowed_locations: 5,
        allowed_attendants_per_location: 10,
        status: 'active' as const,
        rates_2wheeler: {
          upTo2Hours: 2,
          upTo6Hours: 5,
          upTo12Hours: 8,
          upTo24Hours: 12,
        },
        rates_4wheeler: {
          upTo2Hours: 5,
          upTo6Hours: 10,
          upTo12Hours: 18,
          upTo24Hours: 30,
        },
      });
    }
  }, [contractor, isEditing, reset]);

  const onSubmit = async (data: ContractorFormData) => {
    setIsSubmitting(true);
    try {
      // For editing, only include password if provided
      const contractorData: CreateContractorData = {
        user_name: data.user_name!,
        email: data.email!,
        phone_number: data.phone_number!,
        company_name: data.company_name!,
        contact_number: data.contact_number!,
        allowed_locations: data.allowed_locations!,
        allowed_attendants_per_location: data.allowed_attendants_per_location!,
        status: data.status!,
        rates_2wheeler: {
          upTo2Hours: data.rates_2wheeler!.upTo2Hours!,
          upTo6Hours: data.rates_2wheeler!.upTo6Hours!,
          upTo12Hours: data.rates_2wheeler!.upTo12Hours!,
          upTo24Hours: data.rates_2wheeler!.upTo24Hours!,
        },
        rates_4wheeler: {
          upTo2Hours: data.rates_4wheeler!.upTo2Hours!,
          upTo6Hours: data.rates_4wheeler!.upTo6Hours!,
          upTo12Hours: data.rates_4wheeler!.upTo12Hours!,
          upTo24Hours: data.rates_4wheeler!.upTo24Hours!,
        },
      };

      // Only include password for new contractors or if provided for editing
      if (!isEditing || data.password) {
        contractorData.password = data.password!;
      }
      
      if (isEditing && contractor) {
        console.log('Updating contractor with data:', contractorData);
        const updatedContractor = await SuperAdminAPI.updateContractor(contractor.id, contractorData);
        console.log('Updated contractor result:', updatedContractor);
        toast({
          title: 'Success',
          description: 'Contractor updated successfully',
        });
      } else {
        // Password is required for new contractors
        if (!data.password) {
          toast({
            title: 'Error',
            description: 'Password is required for new contractors',
            variant: 'destructive',
          });
          return;
        }
        
        console.log('Creating contractor with data:', contractorData);
        const newContractor = await SuperAdminAPI.createContractor(contractorData);
        console.log('Created contractor result:', newContractor);
        
        toast({
          title: 'Success',
          description: 'Contractor created successfully',
        });
      }
      
      // Call success callback to refresh the list
      onSuccess?.();
      reset();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save contractor',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {isEditing ? 'Edit Contractor' : 'Add New Contractor'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {isEditing 
              ? 'Update contractor information and settings'
              : 'Create a new contractor account with parking management settings'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Basic Information */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold">Basic Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="user_name">Full Name</Label>
                <Input
                  id="user_name"
                  {...register('user_name')}
                  placeholder="Enter full name"
                />
                {errors.user_name && (
                  <p className="text-sm text-destructive">{errors.user_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              {!isEditing && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        {...register('password')}
                        placeholder="Enter password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                        onClick={() => setShowPassword(v => !v)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm_password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        {...register('confirm_password')}
                        placeholder="Re-enter password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                        onClick={() => setShowConfirmPassword(v => !v)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.confirm_password && (
                      <p className="text-sm text-destructive">{errors.confirm_password.message}</p>
                    )}
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  {...register('phone_number')}
                  placeholder="Enter phone number"
                />
                {errors.phone_number && (
                  <p className="text-sm text-destructive">{errors.phone_number.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  {...register('company_name')}
                  placeholder="Enter company name"
                />
                {errors.company_name && (
                  <p className="text-sm text-destructive">{errors.company_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_number">Contact Number</Label>
                <Input
                  id="contact_number"
                  {...register('contact_number')}
                  placeholder="Enter contact number"
                />
                {errors.contact_number && (
                  <p className="text-sm text-destructive">{errors.contact_number.message}</p>
                )}
              </div>
            </div>

            {/* Settings & Limits */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold">Settings & Limits</h3>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select onValueChange={(value) => setValue('status', value as 'active' | 'inactive')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-sm text-destructive">{errors.status.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="allowed_locations">Allowed Locations</Label>
                <Input
                  id="allowed_locations"
                  type="number"
                  {...register('allowed_locations', { valueAsNumber: true })}
                  placeholder="Number of locations allowed"
                />
                {errors.allowed_locations && (
                  <p className="text-sm text-destructive">{errors.allowed_locations.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="allowed_attendants_per_location">Attendants per Location</Label>
                <Input
                  id="allowed_attendants_per_location"
                  type="number"
                  {...register('allowed_attendants_per_location', { valueAsNumber: true })}
                  placeholder="Attendants allowed per location"
                />
                {errors.allowed_attendants_per_location && (
                  <p className="text-sm text-destructive">{errors.allowed_attendants_per_location.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Pricing Rates */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold">Parking Rates</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* 2-Wheeler Rates */}
              <div className="space-y-3">
                <h4 className="font-medium">2-Wheeler Rates (₹)</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-sm">Up to 2 hours</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register('rates_2wheeler.upTo2Hours', { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Up to 6 hours</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register('rates_2wheeler.upTo6Hours', { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Up to 12 hours</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register('rates_2wheeler.upTo12Hours', { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Up to 24 hours</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register('rates_2wheeler.upTo24Hours', { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </div>

              {/* 4-Wheeler Rates */}
              <div className="space-y-3">
                <h4 className="font-medium">4-Wheeler Rates (₹)</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-sm">Up to 2 hours</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register('rates_4wheeler.upTo2Hours', { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Up to 6 hours</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register('rates_4wheeler.upTo6Hours', { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Up to 12 hours</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register('rates_4wheeler.upTo12Hours', { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Up to 24 hours</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register('rates_4wheeler.upTo24Hours', { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Contractor' : 'Create Contractor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}