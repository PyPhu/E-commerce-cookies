import { createBrowserRouter } from "react-router";
import { HomePage } from "./pages/user/HomePage";
import { CustomCookiePage } from "./pages/user/CustomCookiePage";
import { CartPage } from "./pages/user/CartPage";
import { CheckoutPage } from "./pages/user/CheckoutPage";
import { AdminPage } from "./pages/admin/AdminPage";
import { UserProfilePage } from "./pages/user/UserProfilePage";
import { Layout, AdminOnly } from "./components/Layout";

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      // User
      { index: true, element: <HomePage /> },
      { path: 'custom-cookie', element: <CustomCookiePage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'profile', element: <UserProfilePage /> },
      
      // Admin
      {
        path: 'admin',
       element: (
          <AdminOnly>
            <AdminPage />
          </AdminOnly>
       ),
      },
    ],
  },
]);
