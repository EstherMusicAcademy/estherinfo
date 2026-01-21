export function LoadingSpinner({ size = "md", fullScreen = false }: { size?: "sm" | "md" | "lg"; fullScreen?: boolean }) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  const spinner = (
    <div className={`${sizeClasses[size]} animate-spin rounded-full border-primary border-t-transparent`} />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted animate-pulse">로딩 중...</p>
        </div>
      </div>
    );
  }

  return spinner;
}

export function LoadingCard() {
  return (
    <div className="animate-pulse space-y-4 rounded-2xl border border-border bg-surface p-6">
      <div className="h-4 w-3/4 rounded bg-muted/30"></div>
      <div className="h-4 w-1/2 rounded bg-muted/30"></div>
      <div className="h-4 w-5/6 rounded bg-muted/30"></div>
    </div>
  );
}

export function LoadingDots() {
  return (
    <div className="flex items-center gap-1">
      <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]"></div>
      <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]"></div>
      <div className="h-2 w-2 animate-bounce rounded-full bg-primary"></div>
    </div>
  );
}
