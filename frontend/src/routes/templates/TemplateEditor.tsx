import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeftIcon, SaveIcon, Loader2Icon, GitBranchIcon, UploadIcon } from 'lucide-react';

// TODO: Import from api-client when template API is implemented
interface Template {
  id: string;
  name: string;
  type: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

const TEMPLATE_TYPES = [
  { value: 'first_impression', label: 'First Impression' },
  { value: 'first_impression_divergence', label: 'First Impression Divergence' },
  { value: 'my_type', label: 'My Type' },
  { value: 'my_type_divergence', label: 'My Type Divergence' },
  { value: 'romance_compatibility', label: 'Romance Compatibility' },
  { value: 'friendship_compatibility', label: 'Friendship Compatibility' },
];

export default function TemplateEditor() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const isNewTemplate = !templateId;

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(!isNewTemplate);
  const [saving, setSaving] = useState(false);
  const [creatingRevision, setCreatingRevision] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');

  const fetchTemplate = async () => {
    if (!templateId) return;

    try {
      setLoading(true);
      // TODO: Replace with actual API call when templates endpoint is implemented
      // const response = await apiClient.getTemplate(templateId);
      // setTemplate(response);

      // Mock data for now
      const mockTemplate: Template = {
        id: templateId,
        name: 'First Impression Template',
        type: 'first_impression',
        description: 'Template for first impression reports',
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Mock the latest revision content
      const mockLatestRevisionContent = 'This is the template content...';

      setTemplate(mockTemplate);
      setName(mockTemplate.name);
      setType(mockTemplate.type);
      setContent(mockLatestRevisionContent);
      setDescription(mockTemplate.description || '');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplate();
  }, [templateId]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // TODO: Replace with actual API call when templates endpoint is implemented
      if (isNewTemplate) {
        // const response = await apiClient.createTemplate({ name, type, content, description });
        console.log('Creating template:', { name, type, content, description });
        // navigate(`/templates/${response.id}`);
      } else {
        // await apiClient.updateTemplate(templateId!, { name, content, description });
        console.log('Updating template:', { name, content, description });
      }

      // Mock success for now
      setTimeout(() => {
        setSaving(false);
        if (isNewTemplate) {
          navigate('/templates/mock-id');
        }
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template');
      setSaving(false);
    }
  };

  const handleCreateRevision = async () => {
    try {
      setCreatingRevision(true);
      setError(null);

      const changelog = prompt('Enter changelog for this revision (optional):');

      // TODO: Replace with actual API call when templates endpoint is implemented
      // await apiClient.createRevision(templateId!, { content, changelog });
      console.log('Creating revision:', { content, changelog });

      // Mock success for now
      setTimeout(() => {
        setCreatingRevision(false);
        // Refresh template data to show new revision
        fetchTemplate();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create revision');
      setCreatingRevision(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2Icon className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading template...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/templates">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Templates
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isNewTemplate ? 'New Template' : 'Edit Template'}
            </h1>
            {template && (
              <div className="flex items-center space-x-2 mt-1">
                <Badge
                  className={
                    template.status === 'published'
                      ? 'bg-green-100 text-green-800'
                      : template.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                  }
                >
                  {template.status}
                </Badge>
                {template.status === 'published' && (
                  <Link to={`/templates/${template.id}/versions`}>
                    <Button variant="ghost" size="sm">
                      <GitBranchIcon className="h-4 w-4 mr-1" />
                      View Revisions
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleSave} disabled={saving || !name || !type || !content}>
            {saving ? (
              <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <SaveIcon className="h-4 w-4 mr-2" />
            )}
            Save
          </Button>
          {!isNewTemplate && content && (
            <Button onClick={handleCreateRevision} disabled={creatingRevision || saving}>
              {creatingRevision ? (
                <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UploadIcon className="h-4 w-4 mr-2" />
              )}
              Create Revision
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
          <CardDescription>Configure the basic information for this template</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter template name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={setType} disabled={!isNewTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template type" />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_TYPES.map((templateType) => (
                    <SelectItem key={templateType.value} value={templateType.value}>
                      {templateType.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter template description (optional)"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Template Content</CardTitle>
          <CardDescription>
            Write the template content using variables and formatting as needed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter template content..."
              rows={20}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Use template variables like {'{{userName}}'} or {'{{mediaAnalysis}}'} that will be
              replaced during report generation
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
