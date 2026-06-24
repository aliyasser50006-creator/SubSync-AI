import { ProtectedRoute } from '@/components/protected-route';
import { AppSidebar } from '@/components/app-sidebar';
import { MobileNav } from '@/components/mobile-nav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex h-[100dvh] min-h-screen overflow-hidden bg-background text-foreground">
        <div className="hidden lg:block">
          <AppSidebar />
        </div>
        <MobileNav />
        <main
          id="main-content"
          className="min-w-0 flex-1 overflow-y-auto pt-16 lg:pt-0"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
