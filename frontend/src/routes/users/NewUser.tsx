import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import IconWrapper from '@/components/IconWrapper';
import { Loader2Icon } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

export default function NewUser() {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema as any) as any,
  });

  const onSubmit = async (data: CreateUserForm) => {
    setCreating(true);

    try {
      const user = await apiClient.createUser({ name: data.name });
      toast.success('User created successfully!');
      navigate(`/users/${user.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New User</h1>
        <p className="text-gray-600 mt-2">Add a new user profile</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>Enter the user's name to create their profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Enter user's full name"
                {...register('name')}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <Button type="submit" disabled={creating} className="w-full">
              {creating ? (
                <>
                  <IconWrapper IconComponent={Loader2Icon} className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create User'
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/users')}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
