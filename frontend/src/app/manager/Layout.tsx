import { Outlet } from "react-router-dom";
import { ManagerSidebar } from "./Sidebar";
import { TopNavbar } from "../components/TopNavbar";

export default function ManagerLayout() {
  return (
    <div className="flex h-screen bg-slate-50 text-slate-800">
      <ManagerSidebar />
      <TopNavbar />
      <main className="ml-64 mt-16 w-full flex-1 overflow-y-auto bg-slate-50 p-8">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
