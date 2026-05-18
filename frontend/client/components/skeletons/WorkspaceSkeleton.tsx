import { Skeleton } from "@/components/ui/skeleton";

export default function WorkspaceSkeleton() {
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="w-full border-b border-border p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r border-border p-3 space-y-3 hidden md:block">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        {/* Canvas */}
        <div className="flex-1 p-3">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    </div>
  );
}
