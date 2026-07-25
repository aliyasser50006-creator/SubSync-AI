import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-md bg-muted/70 relative overflow-hidden',
        'after:absolute after:inset-0 after:translate-x-[-100%]',
        'after:bg-gradient-to-r after:from-transparent after:via-white/[0.08] after:to-transparent',
        'after:animate-[shimmer-slide_2s_ease-in-out_infinite]',
        className
      )}
      {...props}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
}

export { Skeleton };
