'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Settings, 
  RefreshCw, 
  AlertTriangle,
  Save,
  Clock,
  Layers,
  RotateCcw,
  Power
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getPipelineConfig, updatePipelineConfig, type PipelineConfigMap } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ConfigFormData extends Record<string, string> {
  poll_interval_seconds: string;
  batch_size: string;
  max_retries: string;
  enabled: string;
}

export default function PipelineSettingsPage() {
  const [config, setConfig] = useState<PipelineConfigMap | null>(null);
  const [formData, setFormData] = useState<ConfigFormData>({
    poll_interval_seconds: '300',
    batch_size: '10',
    max_retries: '3',
    enabled: 'true',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const data = await getPipelineConfig();
      setConfig(data);
      
      // Update form data from config
      setFormData({
        poll_interval_seconds: data.poll_interval_seconds?.value || '300',
        batch_size: data.batch_size?.value || '10',
        max_retries: data.max_retries?.value || '3',
        enabled: data.enabled?.value || 'true',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch configuration');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      await updatePipelineConfig(formData);
      setSaveMessage({ type: 'success', message: 'Configuration saved successfully!' });
      // Refresh config
      await fetchData();
    } catch (err) {
      setSaveMessage({ 
        type: 'error', 
        message: err instanceof Error ? err.message : 'Failed to save configuration' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (key: keyof ConfigFormData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const formatDate = (isoString: string | null) => {
    if (!isoString) return 'Never';
    try {
      return new Date(isoString).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
          <p className="text-gray-600">Loading configuration...</p>
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
            <h3 className="text-lg font-semibold text-gray-900">Failed to load configuration</h3>
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
          <h1 className="text-2xl font-bold text-gray-900">Pipeline Settings</h1>
          <p className="text-sm text-gray-500">Configure the Otter Neo4j pipeline behavior</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={cn(
          'px-4 py-3 rounded-lg text-sm border',
          saveMessage.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-700' 
            : 'bg-red-50 border-red-200 text-red-700'
        )}>
          {saveMessage.message}
        </div>
      )}

      {/* Configuration Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5 text-green-600" />
            Pipeline Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Poll Interval */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Clock className="h-4 w-4 text-gray-500" />
                Poll Interval (seconds)
              </label>
              <Input
                type="number"
                value={formData.poll_interval_seconds}
                onChange={(e) => handleInputChange('poll_interval_seconds', e.target.value)}
                min="60"
                max="3600"
                className="max-w-xs"
              />
              <p className="text-xs text-gray-500">
                How often the pipeline checks for new transcripts (60-3600 seconds).
                {config?.poll_interval_seconds?.description && (
                  <span className="block mt-1">{config.poll_interval_seconds.description}</span>
                )}
              </p>
            </div>

            {/* Batch Size */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Layers className="h-4 w-4 text-gray-500" />
                Batch Size
              </label>
              <Input
                type="number"
                value={formData.batch_size}
                onChange={(e) => handleInputChange('batch_size', e.target.value)}
                min="1"
                max="100"
                className="max-w-xs"
              />
              <p className="text-xs text-gray-500">
                Number of transcripts to process in each batch (1-100).
                {config?.batch_size?.description && (
                  <span className="block mt-1">{config.batch_size.description}</span>
                )}
              </p>
            </div>

            {/* Max Retries */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <RotateCcw className="h-4 w-4 text-gray-500" />
                Max Retries
              </label>
              <Input
                type="number"
                value={formData.max_retries}
                onChange={(e) => handleInputChange('max_retries', e.target.value)}
                min="0"
                max="10"
                className="max-w-xs"
              />
              <p className="text-xs text-gray-500">
                Maximum number of retry attempts for failed transcripts (0-10).
                {config?.max_retries?.description && (
                  <span className="block mt-1">{config.max_retries.description}</span>
                )}
              </p>
            </div>

            {/* Enabled */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Power className="h-4 w-4 text-gray-500" />
                Pipeline Enabled
              </label>
              <select
                value={formData.enabled}
                onChange={(e) => handleInputChange('enabled', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 max-w-xs"
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
              <p className="text-xs text-gray-500">
                Enable or disable the pipeline. When disabled, no new transcripts will be processed.
                {config?.enabled?.description && (
                  <span className="block mt-1">{config.enabled.description}</span>
                )}
              </p>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Configuration
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Config Info */}
      {config && Object.keys(config).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Current Configuration Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">Key</th>
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">Value</th>
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">Type</th>
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(config).map(([key, item]) => (
                    <tr key={key} className="border-b border-gray-100">
                      <td className="py-2 px-4 font-mono text-sm text-gray-700">{key}</td>
                      <td className="py-2 px-4 text-sm text-gray-900">{item.value}</td>
                      <td className="py-2 px-4 text-sm text-gray-500">{item.type}</td>
                      <td className="py-2 px-4 text-sm text-gray-500">{formatDate(item.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
