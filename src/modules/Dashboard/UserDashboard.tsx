import { Skeleton } from "@/components/ui/skeleton";

const UserDashboard = () => {
  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <Skeleton className="aspect-video rounded-xl bg-gray-200 dark:bg-slate-900" />
          <Skeleton className="aspect-video rounded-xl bg-gray-200 dark:bg-slate-900" />
          <Skeleton className="aspect-video rounded-xl bg-gray-200 dark:bg-slate-900" />
        </div>
        <Skeleton className="min-h-[100vh] flex-1 rounded-xl bg-gray-200 dark:bg-slate-900 md:min-h-min" />
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <Skeleton className="aspect-video rounded-xl bg-gray-200 dark:bg-slate-900" />
          <Skeleton className="aspect-video rounded-xl bg-gray-200 dark:bg-slate-900" />
          <Skeleton className="aspect-video rounded-xl bg-gray-200 dark:bg-slate-900" />
        </div>
        <Skeleton className="min-h-[100vh] flex-1 rounded-xl bg-gray-200 dark:bg-slate-900 md:min-h-min" />
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <Skeleton className="aspect-video rounded-xl bg-gray-200 dark:bg-slate-900" />
          <Skeleton className="aspect-video rounded-xl bg-gray-200 dark:bg-slate-900" />
          <Skeleton className="aspect-video rounded-xl bg-gray-200 dark:bg-slate-900" />
        </div>
        <Skeleton className="min-h-[100vh] flex-1 rounded-xl bg-gray-200 dark:bg-slate-900 md:min-h-min" />
      </div>
    </>
  );
};

export default UserDashboard;
