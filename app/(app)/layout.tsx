import { ProtectedRoute } from '@/components/protected-route';
import { AppSidebar } from '@/components/app-sidebar';
import { MobileNav } from '@/components/mobile-nav';
import { CommandPalette } from '@/components/command-palette';
import { BreadcrumbNav } from '@/components/breadcrumb-nav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex h-[100dvh] min-h-screen overflow-hidden bg-background text-foreground">
        <div className="hidden lg:block">
          <AppSidebar />
        </div>
        <MobileNav />
        <div className="min-w-0 flex-1 flex flex-col overflow-hidden">
          {/* ── Top Bar with Breadcrumbs ── */}
          <div className="hidden lg:flex items-center border-b border-border/40 bg-card/30 px-6 py-2.5 backdrop-blur-sm">
            <BreadcrumbNav />
          </div>
          <main
            id="main-content"
            className="flex-1 overflow-y-auto pt-14 lg:pt-0"
            tabIndex={-1}
          >
            {children}
          </main>
        </div>
        <CommandPalette />
      </div>
    </ProtectedRoute>
  );
}
