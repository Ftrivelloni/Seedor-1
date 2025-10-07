import DatabaseCleanupTool from "../../components/cleanup/database-cleanup-tool";

export default function CleanupPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Database Management</h1>
          <p className="text-muted-foreground mt-2">
            Tools for managing your development database
          </p>
        </div>
        
        <DatabaseCleanupTool />
      </div>
    </div>
  );
}