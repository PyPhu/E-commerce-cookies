import { Outlet, Link, useLocation } from "react-router";
import { ShoppingCart, Cookie, User } from "lucide-react";
import { useCart } from "../hooks/useCart";

export function Layout() {
  const location = useLocation();
  const { cart } = useCart();
  const isAdmin = location.pathname.startsWith('/admin');

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Cookie className="w-8 h-8 text-amber-600" />
              <span className="font-bold text-xl">Cookie Shop</span>
            </Link>

            {!isAdmin && (
              <nav className="flex items-center gap-6">
                <Link
                  to="/"
                  className={location.pathname === '/' ? 'text-amber-600' : 'text-gray-600 hover:text-amber-600'}
                >
                  Menu
                </Link>
                <Link
                  to="/custom"
                  className={location.pathname === '/custom' ? 'text-amber-600' : 'text-gray-600 hover:text-amber-600'}
                >
                  Custom Cookie
                </Link>
                <Link
                  to="/profile"
                  className={location.pathname === '/profile' ? 'text-amber-600' : 'text-gray-600 hover:text-amber-600'}
                >
                  Profile
                </Link>
                <Link to="/cart" className="relative">
                  <ShoppingCart className="w-6 h-6 text-gray-600 hover:text-amber-600" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-amber-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </nav>
            )}

            <Link
              to={isAdmin ? '/' : '/admin'}
              className="flex items-center gap-2 text-gray-600 hover:text-amber-600"
            >
              <User className="w-5 h-5" />
              <span className="text-sm">{isAdmin ? 'Shop' : 'Admin'}</span>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
