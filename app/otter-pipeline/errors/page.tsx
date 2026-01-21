'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  AlertTriangle, 
  RefreshCw, 
  XCircle,
  Clock,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getPipelineErrors, getPipelineErrorsByType, type PipelineError } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function PipelineErrorsPage() {
  const [errors, setErrors] = useState<PipelineError[]>([]);
  const [errorsByType, setErrorsByType] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [errorsData, errorsByTypeData] = await Promise.all([
        getPipelineErrors(100),
        getPipelineErrorsByType()
      ]);
      setErrors(errorsData);
      setErrorsByType(errorsByTypeData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch errors');
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

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  const getErrorTypeColor = (errorType: string) => {
    const colors: Record<string, string> = {
      'OtterAPIError': 'bg-orange-100 text-orange-800 border-orange-200',
      'Neo4jError': 'bg-purple-100 text-purple-800 border-purple-200',
      'ProcessingError': 'bg-red-100 text-red-800 border-red-200',
      'ConfigurationError': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'RateLimitError': 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return colors[errorType] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const totalErrors = Object.values(errorsByType).reduce((sum, count) => sum + count, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
          <p className="text-gray-600">Loading errors...</p>
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
            <h3 className="text-lg font-semibold text-gray-900">Failed to load errors</h3>
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
          <h1 className="text-2xl font-bold text-gray-900">Pipeline Errors</h1>
          <p className="text-sm text-gray-500">Recent pipeline errors and failures</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Error Distribution */}
      {Object.keys(errorsByType).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Error Distribution (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(errorsByType).map(([type, count]) => (
                <div
                  key={type}
                  className={cn(
                    'p-4 rounded-lg border text-center',
                    getErrorTypeColor(type)
                  )}
                >
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm font-medium">{type.replace('Error', '')}</p>
                  <p className="text-xs opacity-75">
                    {totalErrors > 0 ? ((count / totalErrors) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {errors.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No Errors Found</h3>
              <p className="text-gray-500 mt-1">Everything is running smoothly!</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Errors Table */}
      {errors.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Recent Errors ({errors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Time</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Conversation</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Run ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {errors.map((err) => (
                    <tr key={err.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          {formatDate(err.occurred_at)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={cn('font-medium', getErrorTypeColor(err.error_type))}>
                          {err.error_type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {err.conversation_id ? (
                          <div>
                            <span className="font-mono text-xs text-gray-600">
                              {err.conversation_id.slice(0, 12)}...
                            </span>
                            {err.transcript_title && (
                              <p className="text-xs text-gray-400 truncate max-w-xs">
                                {err.transcript_title}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {err.run_id ? (
                          <span className="font-mono text-xs text-gray-600">
                            {err.run_id.slice(0, 20)}...
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span 
                          className="text-sm text-gray-900 max-w-md truncate block"
                          title={err.error_message}
                        >
                          {err.error_message.length > 100
                            ? `${err.error_message.slice(0, 100)}...`
                            : err.error_message}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Text */}
      {errors.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
          <FileText className="h-5 w-5 shrink-0 mt-0.5" />
          <p>
            Showing {errors.length} recent errors. Review and retry failed transcripts from the
            main Pipeline page or the Transcripts page.
          </p>
        </div>
      )}
    </div>
  );
}
