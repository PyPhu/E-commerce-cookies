import { Outlet, Link, useLocation, Navigate } from "react-router";
import { ShoppingCart, Cookie, User } from "lucide-react";
import { RiAdminFill } from "react-icons/ri";

// admin guard
function AdminOnly({ children }: { children: React.ReactNode }) {
  const isAdmin = true; // replace with actual admin check logic

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
}

// menu
function UserMenu() {
  return (
    <nav className="flex gap-4">
      <Link to="cart">
        <ShoppingCart className="w-5 h-5" />
        <span className="sr-only">Cart</span>
      </Link>
      <Link to="profile">
        <User className="w-5 h-5" />
        <span className="sr-only">Profile</span>
      </Link>
    </nav>
  );
}

function AdminMenu() {
  return (
    <nav className="flex gap-4">
      <Link to="/admin">
        <RiAdminFill className="w-5 h-5" />
        <span className="sr-only">Admin</span>
      </Link>
    </nav>
  );
}

//header
function Header({ isAdminPath }: { isAdminPath: boolean }) {
  return (
    <header className="flex justify-between p-4 bg-white shadow">
      <Link to="/" className="flex items-center gap-2">
        <Cookie className="w-6 h-6" />
        <span className="font-bold">Cookie Shop</span>
      </Link>

      {isAdminPath ? <AdminMenu /> : <UserMenu />}

      <Link to={isAdminPath ? "/" : "/admin"}>
        {isAdminPath ? "Shop" : "Admin"}
      </Link>
    </header>
  );
}

//layout
export function Layout(){
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith("/admin");

  return(
    <div className="min-h-screen bg-gray-50">
      <Header isAdminPath={isAdminPath} />
      <Outlet />
    </div>
  );
}

/* export guard ไปใช้ใน router */
export { AdminOnly };