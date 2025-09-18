"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Loader2, Trash2, CheckCircle, AlertTriangle } from "lucide-react";
import { cleanupDatabase, checkServiceKey, type CleanupResult } from "../lib/cleanup-actions";

export default function DatabaseCleanupTool() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [hasServiceKey, setHasServiceKey] = useState<boolean | null>(null);
  const [stats, setStats] = useState<{
    workers: number;
    tenants: number;
    authUsers: number;
  } | null>(null);

  useEffect(() => {
    // Check if service key is available
    checkServiceKey().then(setHasServiceKey);
  }, []);

  const handleCleanup = async () => {
    setIsLoading(true);
    setStatus([]);
    setIsComplete(false);
    setStats(null);

    try {
      const result: CleanupResult = await cleanupDatabase();
      
      setStatus(result.messages);
      
      if (result.success) {
        setIsComplete(true);
        setStats(result.stats || null);
      }
    } catch (error: any) {
      setStatus(prev => [...prev, `💥 Unexpected error: ${error.message}`]);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking service key
  if (hasServiceKey === null) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Checking configuration...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-destructive" />
          Database Cleanup Tool
        </CardTitle>
        <CardDescription>
          Remove all test data from Supabase Auth, workers, and tenants tables.
          <strong className="text-destructive"> This action cannot be undone!</strong>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!hasServiceKey && (
          <div className="p-4 border border-destructive/20 bg-destructive/10 rounded-lg">
            <div className="flex items-center gap-2 text-destructive font-medium">
              <AlertTriangle className="h-4 w-4" />
              Missing Service Role Key
            </div>
            <p className="text-sm text-destructive/80 mt-1">
              Add SUPABASE_SERVICE_ROLE_KEY to your .env.local file to use this tool.
            </p>
          </div>
        )}

        <Button 
          onClick={handleCleanup} 
          disabled={isLoading || !hasServiceKey}
          variant="destructive"
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cleaning Database...
            </>
          ) : (
            <>
              <Trash2 className="mr-2 h-4 w-4" />
              Clean All Test Data
            </>
          )}
        </Button>

        {status.length > 0 && (
          <div className="max-h-64 overflow-y-auto border rounded-lg p-3 bg-muted/50">
            <div className="space-y-1 text-sm font-mono">
              {status.map((msg, index) => (
                <div key={index} className="whitespace-pre-wrap">
                  {msg}
                </div>
              ))}
            </div>
          </div>
        )}

        {isComplete && stats && (
          <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
              <CheckCircle className="h-4 w-4" />
              Cleanup Complete
            </div>
            <div className="text-sm text-green-600">
              <p>Database is now clean:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Workers remaining: {stats.workers}</li>
                <li>Tenants remaining: {stats.tenants}</li>
                <li>Auth users remaining: {stats.authUsers}</li>
              </ul>
              <p className="mt-2 font-medium">You can now start testing with a fresh database!</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}