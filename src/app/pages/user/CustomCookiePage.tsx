import { useState } from "react";
import { useCart } from "../../hooks/useCart";
import { MenuItem } from "../../types";
import { toast } from "sonner";
import { useNavigate } from "react-router";

const textures = ["hard", "soft"] as const;
const flavors = [
  "vanilla",
  "chocolate",
  "red velvet",
  "choc chip",
  "rainbow",
  "oreo",
  "almond",
  "pistachio",
];

export function CustomCookiePage() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [texture, setTexture] = useState<"hard" | "soft">("soft");
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);

  const toggleFlavor = (flavor: string) => {
    setSelectedFlavors((prev) =>
      prev.includes(flavor)
        ? prev.filter((f) => f !== flavor)
        : [...prev, flavor]
    );
  };

  const handleAddToCart = () => {
    if (selectedFlavors.length === 0) {
      toast.error("Please select at least one flavor!");
      return;
    }

    const customCookie: MenuItem = {
      id: `custom-${Date.now()}`,
      name: `Custom Cookie (${selectedFlavors.join(", ")})`,
      type: "custom",
      price: 4.99,
      texture,
      flavors: selectedFlavors,
    };

    addToCart(customCookie);
    toast.success("Custom cookie added to cart!");
    setSelectedFlavors([]);
    navigate("/cart");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl mb-4">Build Your Custom Cookie</h1>
        <p className="text-gray-600">Choose your texture and flavors</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <div className="mb-8">
          <h2 className="text-2xl mb-4">Texture</h2>
          <div className="flex gap-4">
            {textures.map((t) => (
              <button
                key={t}
                onClick={() => setTexture(t)}
                className={`flex-1 py-4 px-6 rounded-lg border-2 transition-all capitalize ${
                  texture === t
                    ? "border-amber-600 bg-amber-50 text-amber-600"
                    : "border-gray-200 hover:border-amber-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl mb-4">Flavors</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {flavors.map((flavor) => (
              <button
                key={flavor}
                onClick={() => toggleFlavor(flavor)}
                className={`py-3 px-4 rounded-lg border-2 transition-all capitalize ${
                  selectedFlavors.includes(flavor)
                    ? "border-amber-600 bg-amber-50 text-amber-600"
                    : "border-gray-200 hover:border-amber-300"
                }`}
              >
                {flavor}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl mb-1">Your Custom Cookie</h3>
            <p className="text-gray-600 text-sm capitalize">
              {texture} • {selectedFlavors.length > 0 ? selectedFlavors.join(", ") : "No flavors selected"}
            </p>
          </div>
          <span className="text-2xl text-amber-600">$4.99</span>
        </div>
        <button
          onClick={handleAddToCart}
          disabled={selectedFlavors.length === 0}
          className="w-full bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
