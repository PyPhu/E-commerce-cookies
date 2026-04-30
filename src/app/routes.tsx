import { createBrowserRouter } from "react-router";
import { HomePage } from "./pages/user/HomePage";
import { CustomCookiePage } from "./pages/user/CustomCookiePage";
import { CartPage } from "./pages/user/CartPage";
import { CheckoutPage } from "./pages/user/CheckoutPage";
import { AdminPage } from "./pages/admin/AdminPage";
import { UserProfilePage } from "./pages/user/UserProfilePage";
import { LoginPage } from "./pages/user/LoginPage";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";

const isAuthenticated = () => {
  const data = localStorage.getItem('user');
  if (!data) return null;
  return JSON.parse(data);
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { path: 'login', element: <LoginPage /> },

      // --- User ---
      {
        element: <ProtectedRoute isAllowed={!!isAuthenticated()} />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'custom-cookie', element: <CustomCookiePage /> },
          { path: 'cart', element: <CartPage /> },
          { path: 'checkout', element: <CheckoutPage /> },
          { path: 'profile', element: <UserProfilePage /> }
        ]
      },
      
      // --- Admin ---
      {
        path: 'admin',
        element: <ProtectedRoute isAllowed={isAuthenticated()?.role === "admin"} />,
        children: [
          { path: 'admin', element: <AdminPage /> }
        ],
      },
    ],
  },
]);
