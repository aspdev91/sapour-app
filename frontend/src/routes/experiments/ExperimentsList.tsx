import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import IconWrapper from '@/components/IconWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  BeakerIcon,
  UserIcon,
  HeartIcon,
  UsersIcon,
  Loader2Icon,
  SparklesIcon,
  ArrowRightIcon,
} from 'lucide-react';
import { apiClient, type User, type ReportType, type TemplateRevision } from '@/lib/api-client';
import { toast } from 'sonner';

const experimentSchema = z.object({
  reportType: z.enum([
    'first_impression',
    'first_impression_divergence',
    'my_type',
    'my_type_divergence',
    'romance_compatibility',
    'friendship_compatibility',
  ]),
  primaryUserId: z.string().uuid('Please select a primary user'),
  secondaryUserId: z.string().uuid().optional(),
  templateRevisionId: z.string().min(1, 'Please select a template revision'),
  selfObservedDifferences: z.string().optional(),
});

type ExperimentForm = z.infer<typeof experimentSchema>;

const experimentTypes = [
  {
    id: 'first_impression',
    title: 'First Impression',
    description: 'Generate initial personality impressions from user media',
    icon: SparklesIcon,
    needsSecondaryUser: false,
    templateType: 'first_impression',
  },
  {
    id: 'first_impression_divergence',
    title: 'First Impression Divergence',
    description: 'Compare AI impressions with self-reported differences',
    icon: SparklesIcon,
    needsSecondaryUser: false,
    templateType: 'first_impression_divergence',
  },
  {
    id: 'my_type',
    title: 'My Type',
    description: "Analyze user's self-perception and personality type",
    icon: UserIcon,
    needsSecondaryUser: false,
    templateType: 'my_type',
  },
  {
    id: 'my_type_divergence',
    title: 'My Type Divergence',
    description: 'Compare personality type with self-observed traits',
    icon: UserIcon,
    needsSecondaryUser: false,
    templateType: 'my_type_divergence',
  },
  {
    id: 'romance_compatibility',
    title: 'Romance Compatibility',
    description: 'Compare romantic compatibility between two users',
    icon: HeartIcon,
    needsSecondaryUser: true,
    templateType: 'romance_compatibility',
  },
  {
    id: 'friendship_compatibility',
    title: 'Friendship Compatibility',
    description: 'Compare friendship compatibility between two users',
    icon: UsersIcon,
    needsSecondaryUser: true,
    templateType: 'friendship_compatibility',
  },
] as const;

export default function ExperimentsList() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedExperiment, setSelectedExperiment] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [revisions, setRevisions] = useState<TemplateRevision[]>([]);
  const [generating, setGenerating] = useState(false);

  const preselectedUserId = searchParams.get('userId');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ExperimentForm>({
    resolver: zodResolver(experimentSchema),
  });

  const selectedReportType = watch('reportType');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await apiClient.getUsers({ limit: 100 });
        setUsers(response.users);
      } catch (error) {
        toast.error('Failed to load users');
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchRevisions = async () => {
      if (!selectedReportType) return;

      const experiment = experimentTypes.find((exp) => exp.id === selectedReportType);
      if (!experiment) return;

      try {
        const response = await apiClient.getTemplateRevisions(experiment.templateType);
        setRevisions(response.revisions);
      } catch (error) {
        toast.error('Failed to load template revisions');
        setRevisions([]);
      }
    };

    fetchRevisions();
  }, [selectedReportType]);

  useEffect(() => {
    if (preselectedUserId) {
      setValue('primaryUserId', preselectedUserId);
    }
  }, [preselectedUserId, setValue]);

  const onSubmit = async (data: ExperimentForm) => {
    setGenerating(true);

    try {
      const experiment = experimentTypes.find((exp) => exp.id === data.reportType);
      if (!experiment) {
        throw new Error('Invalid experiment type');
      }

      const reportData = {
        reportType: data.reportType,
        primaryUserId: data.primaryUserId,
        secondaryUserId: experiment.needsSecondaryUser ? data.secondaryUserId : undefined,
        templateType: experiment.templateType,
        templateRevisionId: data.templateRevisionId,
        selfObservedDifferences: data.selfObservedDifferences,
      };

      const report = await apiClient.createReport(reportData);
      toast.success('Report generated successfully!');
      navigate(`/reports/${report.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const selectedExperimentData = experimentTypes.find((exp) => exp.id === selectedReportType);

  if (selectedExperiment || selectedReportType) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Generate Report</h1>
            <p className="text-gray-600 mt-2">Configure and run your experiment</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedExperiment(null);
              reset();
            }}
          >
            Back to Experiments
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {selectedExperimentData && (
                  <>
                    <IconWrapper IconComponent={selectedExperimentData.icon} className="w-5 h-5" />
                    {selectedExperimentData.title}
                  </>
                )}
              </CardTitle>
              <CardDescription>{selectedExperimentData?.description}</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Primary User</CardTitle>
              <CardDescription>Select the main user for this analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="primaryUserId">User</Label>
                <Select
                  onValueChange={(value: string) => setValue('primaryUserId', value)}
                  defaultValue={preselectedUserId || undefined}
                >
                  <SelectTrigger className={errors.primaryUserId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.primaryUserId && (
                  <p className="text-xs text-red-500">{errors.primaryUserId.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {selectedExperimentData?.needsSecondaryUser && (
            <Card>
              <CardHeader>
                <CardTitle>Secondary User</CardTitle>
                <CardDescription>Select the second user for compatibility analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="secondaryUserId">User</Label>
                  <Select onValueChange={(value: string) => setValue('secondaryUserId', value)}>
                    <SelectTrigger className={errors.secondaryUserId ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.secondaryUserId && (
                    <p className="text-xs text-red-500">{errors.secondaryUserId.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Template Version</CardTitle>
              <CardDescription>Select the template revision to use for analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="templateRevisionId">Template Revision</Label>
                <Select onValueChange={(value: string) => setValue('templateRevisionId', value)}>
                  <SelectTrigger className={errors.templateRevisionId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select template version" />
                  </SelectTrigger>
                  <SelectContent>
                    {revisions.map((revision) => (
                      <SelectItem key={revision.id} value={revision.id}>
                        {revision.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.templateRevisionId && (
                  <p className="text-xs text-red-500">{errors.templateRevisionId.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Context (Optional)</CardTitle>
              <CardDescription>
                Add any self-observed differences or additional context for the analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="selfObservedDifferences">Self-Observed Differences</Label>
                <Textarea
                  id="selfObservedDifferences"
                  placeholder="Describe any self-observed personality traits or differences..."
                  {...register('selfObservedDifferences')}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedExperiment(null);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={generating}>
              {generating ? (
                <>
                  {React.createElement(Loader2Icon, { className: 'w-4 h-4 mr-2 animate-spin' })}
                  Generating Report...
                </>
              ) : (
                <>
                  {React.createElement(BeakerIcon, { className: 'w-4 h-4 mr-2' })}
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Experiments</h1>
        <p className="text-gray-600 mt-2">
          Run first impression, personality type, and compatibility experiments
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {experimentTypes.map((experiment) => {
          const Icon = experiment.icon;
          return (
            <Card
              key={experiment.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setSelectedExperiment(experiment.id);
                setValue('reportType', experiment.id as ReportType);
              }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {React.createElement(Icon, { className: 'w-5 h-5' })}
                  {experiment.title}
                  {experiment.needsSecondaryUser && (
                    <Badge variant="secondary" className="text-xs">
                      2 Users
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>{experiment.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-primary">
                  Start Experiment
                  {React.createElement(ArrowRightIcon, { className: 'w-4 h-4 ml-2' })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {preselectedUserId && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="pt-6">
            <p className="text-sm">
              <strong>Quick Start:</strong> User pre-selected for experiment. Choose an experiment
              type above to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
