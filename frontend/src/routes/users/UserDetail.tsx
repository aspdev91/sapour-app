import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  PlusIcon 
} from 'lucide-react';
import { apiClient, type User, type Media, type Report } from '@/lib/api-client';
import { toast } from 'sonner';

interface UserWithDetails extends User {
  media: Media[];
  reports: Report[];
}

export default function UserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<UserWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          <p className="text-gray-600 mt-2">View user profile, media gallery, and generated reports</p>
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
            <Button asChild variant="outline" size="sm">
              <Link to={`/users/${user.id}/upload`}>
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Media
              </Link>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.media.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No media files uploaded yet</p>
              <Button asChild variant="outline" className="mt-4">
                <Link to={`/users/${user.id}/upload`}>Upload First Media</Link>
              </Button>
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

                    {media.error && (
                      <p className="text-xs text-destructive mt-2">{media.error}</p>
                    )}
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
                          <span>{report.aiProviderName} {report.aiModelName}</span>
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
