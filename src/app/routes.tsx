import { createBrowserRouter } from "react-router-dom";
import { HomePage } from "./pages/user/HomePage";
import { CustomCookiePage } from "./pages/user/CustomCookiePage";
import { CartPage } from "./pages/user/CartPage";
import { CheckoutPage } from "./pages/user/CheckoutPage";
import { AdminPage } from "./pages/admin/AdminPage";
import { UserProfilePage } from "./pages/user/UserProfilePage";
import { UserLayout } from "./components/Layout";
import { AdminLayout } from "./components/AdminLayout";
import { AdminOnly } from "./components/AdminOnly";
import { SuccessPage } from "./pages/user/SuccessPage";
import { MessageBoardPage } from "./pages/user/MessageBoardPage";
import { CancelPage } from "./pages/user/CancelPage";
import { LoginPage } from "./pages/user/Register/LogIn";
import { ForgotPasswordPage } from "./pages/user/Register/ForgetpassPage";
import { RegisterPage } from "./pages/user/Register/RegisterPage";

export const router = createBrowserRouter([
  {
    path: '/',
    element: <UserLayout />,
    children: [
      // User
      { index: true, element: <HomePage /> },
      { path: 'custom-cookie', element: <CustomCookiePage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'profile', element: <UserProfilePage /> },
      { path: 'success', element: <SuccessPage /> },
      { path: "/message-board", element: <MessageBoardPage /> },
      { path: "cancel", element: <CancelPage /> },
    ],
  },
  //auth page (no userlayout)
  { path :  "login", element :  <LoginPage /> },
  { path :  "forgot-password", element :  <ForgotPasswordPage /> },
  { path :  "register", element :  <RegisterPage /> },
  //admin
  {
    path: '/admin',
    element: (
      <AdminOnly>
        <AdminLayout />
      </AdminOnly>
    ),
    children: [
      { index: true, element: <AdminPage /> },
    ]
  }
]);
