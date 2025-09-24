import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  UserIcon,
  CalendarIcon,
  ImageIcon,
  MicIcon,
  FileTextIcon,
  Loader2Icon,
  PlayIcon,
  EyeIcon,
  PlusIcon,
  UploadIcon,
  CheckIcon,
  AlertCircleIcon,
} from 'lucide-react';
import IconWrapper from '@/components/IconWrapper';
import { apiClient, type User, type Media, type Report, type MediaType } from '@/lib/api-client';
import { toast } from 'sonner';

interface UserWithDetails extends User {
  media: Media[];
  reports: Report[];
}

interface UploadState {
  file: File | null;
  uploading: boolean;
  progress: number;
  completed: boolean;
  error: string | null;
  mediaId: string | null;
}

export default function UserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<UserWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        const userData = await apiClient.getUser(userId);
        setUser(userData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user');
        toast.error('Failed to load user details');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2Icon className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">User Details</h1>
          <p className="text-gray-600 mt-2">
            View user profile, media gallery, and generated reports
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Error loading user</CardTitle>
            <CardDescription>{error || 'User not found'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/users">Back to Users</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: Media['status']) => {
    const variants = {
      pending: { variant: 'secondary' as const, label: 'Pending' },
      processing: { variant: 'default' as const, label: 'Processing' },
      succeeded: { variant: 'default' as const, label: 'Complete' },
      failed: { variant: 'destructive' as const, label: 'Failed' },
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleFileUpload = async (file: File, type: MediaType, setState: typeof setImageUpload) => {
    if (!userId) {
      toast.error('User ID not found');
      return;
    }

    setState((prev) => ({ ...prev, file, uploading: true, progress: 0, error: null }));

    try {
      // Create signed URL
      const { uploadUrl, mediaId } = await apiClient.createSignedUrl({
        userId,
        type,
        contentType: file.type,
      });

      setState((prev) => ({ ...prev, progress: 25 }));

      // Upload file to signed URL
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      setState((prev) => ({ ...prev, progress: 75 }));

      // Trigger analysis
      await apiClient.triggerAnalysis(mediaId);

      setState((prev) => ({
        ...prev,
        progress: 100,
        completed: true,
        uploading: false,
        mediaId,
      }));

      toast.success(`${type} uploaded successfully`);

      // Refresh user data to show new media
      const userData = await apiClient.getUser(userId);
      setUser(userData);
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
          />
          <Label htmlFor={`${type}-upload`} className="cursor-pointer">
            <IconWrapper
              IconComponent={UploadIcon}
              className="w-8 h-8 mx-auto mb-2 text-gray-400"
            />
            <p className="text-sm text-gray-600">
              Click to upload {type === 'image' ? 'an image' : 'audio'} or drag and drop
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{user.name}</h1>
          <p className="text-gray-600 mt-2">User profile and media analysis</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/users">Back to Users</Link>
          </Button>
          <Button asChild>
            <Link to={`/experiments?userId=${user.id}`}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Generate Report
            </Link>
          </Button>
        </div>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="w-5 h-5" />
            User Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-lg">{user.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Consent Status</p>
              <Badge variant={user.consent ? 'default' : 'destructive'}>
                {user.consent ? 'Consented' : 'No Consent'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-sm">{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Media Gallery */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Media Gallery ({user.media.length})
            </span>
            <Button variant="outline" size="sm" onClick={() => {}}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Media
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderUploadArea('image', imageUpload, setImageUpload, 'image/*')}
            {renderUploadArea('audio', audioUpload, setAudioUpload, 'audio/*')}
          </div>

          {/* Media Gallery */}
          {user.media.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No media files uploaded yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {user.media.map((media) => (
                <Card key={media.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      {media.type === 'image' ? (
                        <ImageIcon className="w-6 h-6 text-blue-500" />
                      ) : (
                        <MicIcon className="w-6 h-6 text-green-500" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {media.type === 'image' ? 'Profile Image' : 'Voice Sample'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(media.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {getStatusBadge(media.status)}
                    </div>

                    {media.publicUrl && (
                      <div className="mb-3">
                        {media.type === 'image' ? (
                          <img
                            src={media.publicUrl}
                            alt="Profile"
                            className="w-full h-32 object-cover rounded"
                          />
                        ) : (
                          <div className="h-32 bg-muted rounded flex items-center justify-center">
                            <PlayIcon className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    )}

                    {media.analysisJson && (
                      <div className="text-xs space-y-1">
                        <p className="font-medium">Analysis Results:</p>
                        <p className="text-muted-foreground">
                          Provider: {media.provider} ({media.model})
                        </p>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                          <EyeIcon className="w-3 h-3 mr-1" />
                          View Details
                        </Button>
                      </div>
                    )}

                    {media.error && <p className="text-xs text-destructive mt-2">{media.error}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reports Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileTextIcon className="w-5 h-5" />
              Generated Reports ({user.reports.length})
            </span>
            <Button asChild variant="outline" size="sm">
              <Link to={`/experiments?userId=${user.id}`}>
                <PlusIcon className="w-4 h-4 mr-2" />
                Generate Report
              </Link>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.reports.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No reports generated yet</p>
              <Button asChild variant="outline" className="mt-4">
                <Link to={`/experiments?userId=${user.id}`}>Generate First Report</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {user.reports.map((report) => (
                <Card key={report.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium capitalize">
                          {report.reportType.replace('_', ' ')}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>Generated {new Date(report.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>
                            {report.aiProviderName} {report.aiModelName}
                          </span>
                          <span>•</span>
                          <span>Rev: {report.templateRevisionLabel}</span>
                        </div>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/reports/${report.id}`}>
                          <EyeIcon className="w-4 h-4 mr-2" />
                          View Report
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
