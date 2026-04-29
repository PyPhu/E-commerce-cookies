import { createBrowserRouter } from "react-router";
import { HomePage } from "./pages/HomePage";
import { CustomCookiePage } from "./pages/CustomCookiePage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { AdminPage } from "./pages/AdminPage";
import { UserProfilePage } from "./pages/UserProfilePage";
import { Layout } from "./components/Layout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: HomePage },
      { path: "custom", Component: CustomCookiePage },
      { path: "cart", Component: CartPage },
      { path: "checkout", Component: CheckoutPage },
      { path: "profile", Component: UserProfilePage },
      { path: "admin", Component: AdminPage },
    ],
  },
]);
