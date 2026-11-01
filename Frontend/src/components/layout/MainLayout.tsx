import { useCallback, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar, MobileNav } from "./Sidebar";
import { Topbar } from "./Topbar";

export function MainLayout() {
  const location = useLocation();
  const isAnalysis = location.pathname.toLowerCase() === "/analysis";
  const [isNavOpen, setIsNavOpen] = useState(false);
  const closeNav = useCallback(() => setIsNavOpen(false), []);

  return (
    <div className="flex min-h-screen gap-3 bg-background p-3 md:gap-4 md:p-4">
      <div className="sticky top-4 self-start">
        <Sidebar />
      </div>
      <MobileNav isOpen={isNavOpen} onClose={closeNav} />

      {/* min-w-0 stops wide tables from stretching the page sideways */}
      <div className="flex min-w-0 flex-1 flex-col gap-3 md:gap-4">
        {/* Analysis hides the top bar on desktop; phones keep it for the menu button */}
        <div className={isAnalysis ? "md:hidden" : ""}>
          <Topbar onOpenNav={() => setIsNavOpen(true)} />
        </div>

        <main className="flex-1 rounded-2xl px-1 py-3 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
