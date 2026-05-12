import { useCart } from "../../hooks/useCart";
import { MenuItem } from "../../types";
import { toast } from "sonner";
import { Cookie, Plus } from "lucide-react";

const tripleChocolateImage = new URL("./img/tripleChocolate_cookie.png", import.meta.url).href;
const marshmallowImage = new URL("./img/mashmelloe_cookie.png", import.meta.url).href;

type MenuItemWithImage = MenuItem & { image?: string };

const menuCookies: MenuItemWithImage[] = [
  {
    id: "triple-chocolate",
    name: "Triple Chocolate",
    type: "menu",
    price: 35,
    texture: "soft",
    flavors: ["chocolate"],
    image: tripleChocolateImage,
  },
  {
    id: "marshmallow",
    name: "Marshmallow Delight",
    type: "menu",
    price: 35,
    texture: "soft",
    flavors: ["vanilla", "marshmallow"],
    image: marshmallowImage,
  },
];

export function HomePage() {
  const { addToCart } = useCart();

  const handleAddToCart = (cookie: MenuItem) => {
    addToCart(cookie);
    toast.success(`Added ${cookie.name} to cart!`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl mb-4">Our Cookie Menu</h1>
        <p className="text-gray-600">Freshly baked cookies made with love</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {menuCookies.map((cookie) => (
          <div
            key={cookie.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="bg-gradient-to-br from-amber-100 to-amber-200 h-48 flex items-center justify-center overflow-hidden">
              {cookie.image ? (
                <img
                  src={cookie.image}
                  alt={cookie.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Cookie className="w-12 h-12 text-amber-600" /> //กันไว้ก่อนเผื่อไม่มีรูป
              )}
            </div>
            <div className="p-6">
              <h3 className="text-xl mb-2">{cookie.name}</h3>
              <p className="text-gray-600 text-sm mb-4 capitalize">
                {cookie.texture} • {cookie.flavors?.join(", ")}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl text-amber-600">${cookie.price.toFixed(2)}</span>
                <button
                  onClick={() => handleAddToCart(cookie)}
                  className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <h2 className="text-2xl mb-4">Want Something Custom?</h2>
        <p className="text-gray-600 mb-6">
          Create your own unique cookie with your choice of texture and flavors!
        </p>
        <a
          href="/custom-cookie"
          className="inline-block bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700"
        >
          Build Your Cookie
        </a>
      </div>
    </div>
  );
}
