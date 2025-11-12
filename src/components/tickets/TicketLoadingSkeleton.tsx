import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function TicketLoadingSkeleton() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar skeleton */}
      <div className="w-96 border-r flex flex-col">
        <div className="p-4 border-b space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 flex-1" />
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-2 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-3 w-full" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Chat skeleton */}
      <div className="flex-1 flex flex-col">
        <div className="h-16 border-b px-4 flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        
        <div className="flex-1 p-4 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-sm space-y-2">
                <Skeleton className={`h-16 ${i % 2 === 0 ? 'w-64' : 'w-48'}`} />
                <Skeleton className="h-3 w-24 ml-auto" />
              </div>
            </div>
          ))}
        </div>
        
        <div className="border-t p-4">
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  );
}
