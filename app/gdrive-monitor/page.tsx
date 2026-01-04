'use client';

import { GDriveMonitorTable } from '@/components/GDriveMonitorTable';

export default function GDriveMonitorPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Google Drive Monitor</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Monitor the status of files being processed from Google Drive to Neo4j and Postgres
        </p>
      </div>
      <GDriveMonitorTable />
    </div>
  );
}

