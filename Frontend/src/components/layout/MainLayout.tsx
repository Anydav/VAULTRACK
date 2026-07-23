import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function MainLayout() {
  return (
    <div className="flex min-h-screen gap-4 bg-background p-4">
      <div className="sticky top-4 self-start">
        <Sidebar />
      </div>
      
      <div className="flex flex-1 flex-col gap-4">
        
        <Topbar />

        <main className="flex-1 rounded-2xl  p-6">
          <Outlet />
        </main>
      </div>
     </div>
  );
}