export default function Loading() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#F8FAFC]">
      {/* LADO IZQUIERDO Skeleton */}
      <div className="lg:col-span-5 bg-[#0F2744] p-8 lg:p-12 flex-col justify-between hidden sm:flex relative overflow-hidden">
        <div className="h-7 w-28 bg-white/10 rounded-full animate-pulse" />

        <div className="my-auto py-12 space-y-4">
          <div className="h-8 w-44 bg-white/10 rounded-lg animate-pulse" />
          <div className="h-10 w-3/4 bg-white/10 rounded-lg animate-pulse" />
          <div className="h-16 w-full max-w-sm bg-white/5 rounded-lg animate-pulse" />

          <div className="pt-6 border-t border-white/10 flex items-center gap-6">
            <div className="h-10 w-20 bg-white/10 rounded-lg animate-pulse" />
            <div className="h-10 w-20 bg-white/10 rounded-lg animate-pulse" />
          </div>
        </div>

        <div className="h-4 w-48 bg-white/5 rounded animate-pulse" />
      </div>

      {/* LADO DERECHO Skeleton */}
      <div className="lg:col-span-7 flex flex-col justify-center items-center p-6 lg:p-12">
        <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-900/5 animate-pulse">
          <div className="space-y-2 mb-6">
            <div className="h-7 w-48 bg-slate-200 rounded-md" />
            <div className="h-4 w-60 bg-slate-100 rounded-md" />
          </div>

          <div className="h-11 w-full bg-slate-100 rounded-xl mb-6" />
          <div className="h-px w-full bg-slate-100 my-6" />

          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="h-3 w-20 bg-slate-200 rounded" />
              <div className="h-10 w-full bg-slate-100 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-16 bg-slate-200 rounded" />
              <div className="h-10 w-full bg-slate-100 rounded-xl" />
            </div>
            <div className="h-11 w-full bg-[#2563EB]/20 rounded-xl mt-6" />
          </div>
        </div>
      </div>
    </div>
  );
}