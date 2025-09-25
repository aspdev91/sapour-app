import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import IconWrapper from '@/components/IconWrapper';
import { UploadIcon, CheckIcon, AlertCircleIcon, Loader2Icon } from 'lucide-react';
import { apiClient, type MediaType } from '@/lib/api-client';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

interface UploadState {
  file: File | null;
  uploading: boolean;
  progress: number;
  completed: boolean;
  error: string | null;
  mediaId: string | null;
}

export default function NewUser() {
  const navigate = useNavigate();
  const [imageUpload, setImageUpload] = useState<UploadState>({
    file: null,
    uploading: false,
    progress: 0,
    completed: false,
    error: null,
    mediaId: null,
  });
  const [audioUpload, setAudioUpload] = useState<UploadState>({
    file: null,
    uploading: false,
    progress: 0,
    completed: false,
    error: null,
    mediaId: null,
  });
  const [creating, setCreating] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema as any) as any,
  });

  const handleFileUpload = async (file: File, type: MediaType, setState: typeof setImageUpload) => {
    if (!userId) {
      toast.error('Please create the user first');
      return;
    }

    setState((prev) => ({ ...prev, file, uploading: true, progress: 0, error: null }));

    try {
      // Generate unique storage path
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const bucket = type === 'image' ? 'user-submitted-photos' : 'user-submitted-audio';
      const storagePath = `${userId}/${timestamp}-${randomSuffix}`;
      const fullPath = `${bucket}/${storagePath}`;

      setState((prev) => ({ ...prev, progress: 25 }));

      // Upload file directly to Supabase Storage
      const { error } = await supabase.storage.from(bucket).upload(storagePath, file, {
        contentType: file.type,
      });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      setState((prev) => ({ ...prev, progress: 75 }));

      // Create media record and trigger analysis
      const result = await apiClient.createMedia({
        userId,
        type,
        storagePath: fullPath,
      });

      setState((prev) => ({
        ...prev,
        progress: 100,
        completed: true,
        uploading: false,
        mediaId: result.mediaId,
      }));

      toast.success(`${type} uploaded successfully`);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Upload failed',
        uploading: false,
        progress: 0,
      }));
      toast.error(`Failed to upload ${type}`);
    }
  };

  const onSubmit = async (data: CreateUserForm) => {
    if (userId) {
      // User already created, navigate to their profile
      navigate(`/users/${userId}`);
      return;
    }

    setCreating(true);

    try {
      const user = await apiClient.createUser({ name: data.name });
      setUserId(user.id);
      toast.success('User created! Now you can upload media files.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const renderUploadArea = (
    type: MediaType,
    upload: UploadState,
    setState: typeof setImageUpload,
    accept: string,
  ) => (
    <div className="space-y-3">
      <Label htmlFor={`${type}-upload`} className="text-sm font-medium">
        {type === 'image' ? 'Profile Image' : 'Voice Sample'} {upload.completed && '✓'}
      </Label>

      {!upload.file ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <input
            id={`${type}-upload`}
            type="file"
            accept={accept}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setState((prev) => ({ ...prev, file }));
              }
            }}
            className="hidden"
            disabled={!userId}
          />
          <Label
            htmlFor={`${type}-upload`}
            className={`cursor-pointer ${!userId ? 'opacity-50' : ''}`}
          >
            <IconWrapper
              IconComponent={UploadIcon}
              className="w-8 h-8 mx-auto mb-2 text-gray-400"
            />
            <p className="text-sm text-gray-600">
              {!userId
                ? 'Create user first to enable upload'
                : `Click to upload ${type === 'image' ? 'an image' : 'audio'} or drag and drop`}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {type === 'image' ? 'PNG, JPG up to 10MB' : 'MP3, WAV up to 10MB'}
            </p>
          </Label>
        </div>
      ) : (
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {upload.completed ? (
                <IconWrapper IconComponent={CheckIcon} className="w-5 h-5 text-green-500" />
              ) : upload.error ? (
                <IconWrapper IconComponent={AlertCircleIcon} className="w-5 h-5 text-red-500" />
              ) : (
                <IconWrapper IconComponent={UploadIcon} className="w-5 h-5 text-blue-500" />
              )}
              <span className="text-sm font-medium truncate max-w-48">{upload.file.name}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setState({
                  file: null,
                  uploading: false,
                  progress: 0,
                  completed: false,
                  error: null,
                  mediaId: null,
                })
              }
              disabled={upload.uploading}
            >
              Remove
            </Button>
          </div>

          {upload.uploading && (
            <div className="space-y-2">
              <Progress value={upload.progress} />
              <p className="text-xs text-gray-500">Uploading... {upload.progress}%</p>
            </div>
          )}

          {upload.error && <p className="text-xs text-red-500">{upload.error}</p>}

          {upload.file && !upload.completed && !upload.uploading && (
            <Button
              size="sm"
              onClick={() => handleFileUpload(upload.file!, type, setState)}
              className="w-full"
            >
              Upload {type}
            </Button>
          )}

          {upload.completed && (
            <p className="text-xs text-green-600">✓ {type} uploaded and analysis started</p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New User</h1>
        <p className="text-gray-600 mt-2">Add a new user profile with initial media upload</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>Enter the user's name to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Enter user's full name"
                {...register('name')}
                className={errors.name ? 'border-red-500' : ''}
                disabled={Boolean(userId)}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              {userId && <p className="text-xs text-green-600">✓ User created successfully</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Media Upload</CardTitle>
            <CardDescription>
              Upload at least one image or audio file for personality analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderUploadArea('image', imageUpload, setImageUpload, 'image/*')}
            {renderUploadArea('audio', audioUpload, setAudioUpload, 'audio/*')}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/users')}>
            {userId ? 'Back to Users' : 'Cancel'}
          </Button>
          {!userId ? (
            <Button type="submit" disabled={creating}>
              {creating ? (
                <>
                  <IconWrapper IconComponent={Loader2Icon} className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create User'
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => {
                if (!imageUpload.completed && !audioUpload.completed) {
                  toast.error(
                    'Please upload at least one photo or audio file before viewing the user profile',
                  );
                  return;
                }
                navigate(`/users/${userId}`);
              }}
            >
              View User Profile
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
