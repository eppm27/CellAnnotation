import { Skeleton } from "@/components/ui/skeleton";

export default function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="w-full border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      </header>
      <main className="flex-1 p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="flex justify-center gap-3 pt-2">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </main>
    </div>
  );
}
