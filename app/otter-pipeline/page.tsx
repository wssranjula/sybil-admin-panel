'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Zap, 
  Database, 
  GitBranch, 
  AlertTriangle,
  Play,
  Square,
  RefreshCw,
  RotateCcw,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  getPipelineSummary, 
  getDailyStats,
  startPipeline, 
  stopPipeline, 
  triggerPipeline,
  retryAllFailedTranscripts,
  type DashboardSummary,
  type DailyStats
} from '@/lib/api';
import { cn } from '@/lib/utils';

export default function OtterPipelinePage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [summaryData, statsData] = await Promise.all([
        getPipelineSummary(),
        getDailyStats(14)
      ]);
      setSummary(summaryData);
      setDailyStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pipeline data');
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

  const handleAction = async (action: 'start' | 'stop' | 'trigger' | 'retry-all') => {
    setActionLoading(action);
    setActionMessage(null);
    try {
      let result;
      switch (action) {
        case 'start':
          result = await startPipeline();
          break;
        case 'stop':
          result = await stopPipeline();
          break;
        case 'trigger':
          result = await triggerPipeline();
          break;
        case 'retry-all':
          result = await retryAllFailedTranscripts();
          break;
      }
      setActionMessage({ type: 'success', message: result.message });
      // Refresh data after action
      setTimeout(fetchData, 1000);
    } catch (err) {
      setActionMessage({ 
        type: 'error', 
        message: err instanceof Error ? err.message : 'Action failed' 
      });
    } finally {
      setActionLoading(null);
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatDate = (isoString: string | null) => {
    if (!isoString) return 'Never';
    try {
      return new Date(isoString).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'stopped':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
          <p className="text-gray-600">Loading pipeline data...</p>
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
            <h3 className="text-lg font-semibold text-gray-900">Failed to load pipeline data</h3>
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
          <h1 className="text-2xl font-bold text-gray-900">Otter Neo4j Pipeline</h1>
          <p className="text-sm text-gray-500">Monitor and control the transcript processing pipeline</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Action Messages */}
      {actionMessage && (
        <div className={cn(
          'px-4 py-3 rounded-lg text-sm border',
          actionMessage.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-700' 
            : 'bg-red-50 border-red-200 text-red-700'
        )}>
          {actionMessage.message}
        </div>
      )}

      {/* Pipeline Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            Pipeline Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Status:</span>
              <Badge className={cn('font-medium', getStatusColor(summary?.status.status || 'stopped'))}>
                {summary?.status.status || 'Unknown'}
              </Badge>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => handleAction('start')}
                disabled={actionLoading !== null || summary?.status.is_running}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                {actionLoading === 'start' ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Start
              </Button>
              
              <Button
                onClick={() => handleAction('stop')}
                disabled={actionLoading !== null || !summary?.status.is_running}
                size="sm"
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                {actionLoading === 'stop' ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Square className="h-4 w-4 mr-2" />
                )}
                Stop
              </Button>
              
              <Button
                onClick={() => handleAction('trigger')}
                disabled={actionLoading !== null}
                size="sm"
                variant="outline"
              >
                {actionLoading === 'trigger' ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Trigger Now
              </Button>
              
              <Button
                onClick={() => handleAction('retry-all')}
                disabled={actionLoading !== null || (summary?.processing.failed_transcripts || 0) === 0}
                size="sm"
                variant="outline"
              >
                {actionLoading === 'retry-all' ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                Retry All Failed ({summary?.processing.failed_transcripts || 0})
              </Button>
            </div>
          </div>
          
          {/* Circuit Breaker Warning */}
          {summary?.status.circuit_breaker_open && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Circuit Breaker Open</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Pipeline is paused due to {summary.status.consecutive_failures} consecutive failures.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Processing Stats */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Processed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary?.processing.processed_transcripts.toLocaleString() || 0}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {summary?.processing.success_rate_7d.toFixed(1)}% success rate (7d)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Failed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary?.processing.failed_transcripts.toLocaleString() || 0}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {summary?.recent_errors_count || 0} errors in last 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Database className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Entities</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary?.processing.total_entities.toLocaleString() || 0}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {summary?.data_quality.avg_entities_per_transcript.toFixed(1)} avg per transcript
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <GitBranch className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Relationships</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary?.processing.total_relationships.toLocaleString() || 0}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {summary?.data_quality.avg_relationships_per_transcript.toFixed(1)} avg per transcript
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance & Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Processing Time</span>
                <span className="font-medium">{formatDuration(summary?.performance.avg_processing_time_ms || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">P95 Processing Time</span>
                <span className="font-medium">{formatDuration(summary?.performance.p95_processing_time_ms || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Throughput</span>
                <span className="font-medium">{(summary?.performance.transcripts_per_hour || 0).toFixed(1)}/hour</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Chunks</span>
                <span className="font-medium">{summary?.processing.total_chunks.toLocaleString() || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              Schedule Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Last Run</span>
                <span className="font-medium text-sm">{formatDate(summary?.status.last_run_at || null)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Next Scheduled</span>
                <span className="font-medium text-sm">{formatDate(summary?.status.next_scheduled_run || null)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Interval</span>
                <span className="font-medium">{(summary?.status.interval_seconds || 0) / 60} minutes</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending Transcripts</span>
                <span className="font-medium">{summary?.processing.pending_transcripts || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Stats Chart */}
      {dailyStats.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              Daily Processing (Last 14 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end gap-1">
              {dailyStats.slice(-14).map((stat, index) => {
                const maxProcessed = Math.max(...dailyStats.map(s => s.transcripts_processed), 1);
                const height = (stat.transcripts_processed / maxProcessed) * 100;
                return (
                  <div
                    key={stat.date}
                    className="flex-1 flex flex-col items-center gap-1"
                    title={`${stat.date}: ${stat.transcripts_processed} processed, ${stat.transcripts_failed} failed`}
                  >
                    <div className="w-full flex flex-col justify-end" style={{ height: '160px' }}>
                      <div
                        className="w-full bg-green-500 rounded-t transition-all hover:bg-green-600"
                        style={{ height: `${height}%`, minHeight: stat.transcripts_processed > 0 ? '4px' : '0' }}
                      />
                      {stat.transcripts_failed > 0 && (
                        <div
                          className="w-full bg-red-400 rounded-b"
                          style={{ 
                            height: `${(stat.transcripts_failed / maxProcessed) * 100}%`,
                            minHeight: '2px'
                          }}
                        />
                      )}
                    </div>
                    <span className="text-xs text-gray-500 transform -rotate-45 origin-top-left whitespace-nowrap">
                      {new Date(stat.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 justify-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span className="text-gray-600">Processed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-400 rounded" />
                <span className="text-gray-600">Failed</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Updated */}
      <p className="text-xs text-gray-400 text-center">
        Last updated: {summary?.last_updated ? formatDate(summary.last_updated) : 'Unknown'}
      </p>
    </div>
  );
}
