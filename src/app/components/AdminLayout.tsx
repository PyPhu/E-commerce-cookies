import { Outlet, Link } from "react-router";
import { RiAdminFill, RiHome4Line } from "react-icons/ri";

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Top Navbar */}
      <header className="sticky top-0 bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          
          <div className="flex items-center gap-8">
            {/* Admin Logo */}
            <Link to="/admin" className="flex items-center gap-2 hover:text-yellow-400 transition-colors">
              <RiAdminFill className="w-6 h-6 text-yellow-400" />
              <span className="font-bold text-xl uppercase tracking-wider">Admin Center</span>
            </Link>

            {/* Admin Links */}
            <nav className="flex gap-4">
              <Link to="/admin/tables" className="hover:bg-slate-800 px-3 py-2 rounded text-sm">Data Tables</Link>
            </nav>
          </div>

          {/* Exit Link */}
          <Link to="/" className="flex items-center gap-2 text-slate-300 hover:text-white text-sm border-l border-slate-700 pl-4">
            <RiHome4Line />
            <span>Exit to Shop</span>
          </Link>
        </div>
      </header>

      {/* Content Area */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm p-6 min-h-[80vh]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}