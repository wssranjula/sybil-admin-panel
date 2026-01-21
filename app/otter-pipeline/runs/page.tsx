'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  History, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getPipelineRuns, type PipelineRun } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function PipelineRunsPage() {
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const data = await getPipelineRuns(100);
      setRuns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pipeline runs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const formatDate = (isoString: string | null) => {
    if (!isoString) return '-';
    try {
      return new Date(isoString).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (seconds === null) return '-';
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'bg-green-100 text-green-800 border-green-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
      running: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
          <p className="text-gray-600">Loading pipeline runs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Failed to load pipeline runs</h3>
            <p className="text-gray-600 mt-1">{error}</p>
          </div>
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline Runs</h1>
          <p className="text-sm text-gray-500">History of pipeline executions</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Runs Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5 text-green-600" />
            Recent Runs ({runs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No pipeline runs found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Run ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Started</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Duration</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Transcripts</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Chunks</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Entities</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Relationships</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.run_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs text-gray-600">{run.run_id}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={cn('font-medium flex items-center gap-1 w-fit', getStatusBadge(run.status))}>
                          {getStatusIcon(run.status)}
                          {run.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(run.started_at)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDuration(run.duration_seconds)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <span className="text-green-600">{run.transcripts_processed}</span>
                          {run.transcripts_failed > 0 && (
                            <span className="text-red-600 ml-1">/ {run.transcripts_failed} failed</span>
                          )}
                          {run.transcripts_skipped > 0 && (
                            <span className="text-gray-400 ml-1">/ {run.transcripts_skipped} skipped</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {run.chunks_created.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {run.entities_extracted.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {run.relationships_created.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {runs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{runs.length}</p>
                <p className="text-sm text-gray-500">Total Runs</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {runs.filter(r => r.status === 'completed').length}
                </p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {runs.filter(r => r.status === 'failed').length}
                </p>
                <p className="text-sm text-gray-500">Failed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {runs.reduce((sum, r) => sum + r.transcripts_processed, 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">Total Processed</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
