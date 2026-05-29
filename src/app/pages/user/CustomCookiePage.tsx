import { useState, useEffect } from "react";
import { useCart } from "../../hooks/useCart";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { supabase } from "../../../../backend/supabaseClient";

export function CustomCookiePage() {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [dbTextures, setDbTextures] = useState<string[]>([]);
  const [dbFlavors, setDbFlavors] = useState<string[]>([]);
  const [dbToppings, setDbToppings] = useState<string[]>([]);

  const [texture, setTexture] = useState<string>("");
  const [selectedFlavor, setSelectedFlavor] = useState<string>("");
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);

  const handleSelectFlavor = (flavor: string) => {
    setSelectedFlavor(flavor);
  };

  const toggleTopping = (topping: string) => {
    setSelectedToppings((prev) =>
      prev.includes(topping)
        ? prev.filter((t) => t !== topping)
        : [...prev, topping]
    );
  };

  useEffect(() => {
    async function fetchIngredients() {
      try {
        const [texturesRes, flavorsRes, toppingsRes] = await Promise.all([
          supabase.from("cookie_textures").select("type"),
          supabase.from("cookie_flavors").select("type"),
          supabase.from("cookie_toppings").select("type")
        ]);

        if (texturesRes.data) {
          const textureType = texturesRes.data.map((t: any) => t.type);
          setDbTextures(textureType);
          if (textureType.length > 0) setTexture(textureType[0]);
        }

        if (flavorsRes.data) {
          setDbFlavors(flavorsRes.data.map((f: any) => f.type));
        }

        if (toppingsRes.data) {
          setDbToppings(toppingsRes.data.map((to: any) => to.type));
        }
      } catch (error) {
        console.error("Error loading ingredients:", error);
        toast.error("Could not load cookie options");
      }
    }

    fetchIngredients();
  }, []);

  const handleAddToCart = async () => {
    if (!selectedFlavor) {
      toast.error("Please select a flavor");
      return;
    }

    try{
      const uniqueId = `custom-${Date.now()}`;

      const customCookie = {
        id: uniqueId,
        name: "Custom Cookie",
        type: "custom",
        price: 399,
        texture: texture,
        flavor: selectedFlavor,
        toppings: selectedToppings

      };
      // send to usecart function
      await addToCart(customCookie as any);
      toast.success("Added Custom Set to cart!");

      // clear selection after adding to cart
      setSelectedFlavor("");
      setSelectedToppings([]);
      navigate("/cart");
    }
    catch(error){console.error("Error saving custom cookie:", error);
      toast.error("Failed to add custom recipe to cart");}
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl mb-4 font-bold">Build Your Custom Cookie</h1>
        <p className="text-gray-600">Choose your favorite texture, flavor, and toppings</p>
      </div>

      {/* tell you will get 10 cookies */}
      <div className="bg-amber-50 border-l-4 border-amber-600 p-5 rounded-r-lg mb-8 shadow-sm">
        <div className="flex gap-3 items-center">
          <span className="text-2xl">📦</span>
          <div>
            <h4 className="text-amber-800 font-bold text-lg">Custom Combo Set Box</h4>
            <p className="text-amber-700 text-sm">
              we provide you with a set of 10 custom cookies!
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        {/* Texture Selection */}
        <div className="mb-8">
          <h2 className="text-2xl mb-4 font-semibold text-gray-800">Texture</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {dbTextures.map((t) => (
              <button
                key={t}
                onClick={() => setTexture(t)}
                className={`w-full py-4 px-6 rounded-lg border-2 font-medium transition-all capitalize ${texture === t ? "border-amber-600 bg-amber-50 text-amber-600 shadow-sm" : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Flavor Selection */}
        <div className="mb-8">
          <h2 className="text-2xl mb-2 font-semibold text-gray-800">Flavor</h2>
          <p className="text-xs text-gray-400 mb-4">please select one flavor</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {dbFlavors.map((flavor) => (
              <button
                key={flavor}
                onClick={() => handleSelectFlavor(flavor)}
                className={`py-3 px-4 rounded-lg border-2 font-medium transition-all capitalize ${selectedFlavor === flavor ? "border-amber-600 bg-amber-50 text-amber-600 shadow-sm" : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
              >
                {flavor}
              </button>
            ))}
          </div>
        </div>

        {/* Topping Selection */}
        <div>
          <h2 className="text-2xl mb-4 font-semibold text-gray-800">Toppings</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {dbToppings.map((topping) => (
              <button
                key={topping}
                onClick={() => toggleTopping(topping)}
                className={`py-3 px-2 rounded-lg border-2 font-medium transition-all capitalize ${selectedToppings.includes(topping) ? "border-amber-600 bg-amber-50 text-amber-600 shadow-sm" : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
              >
                {topping}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* submit button */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Your Custom Box (10 pcs)</h3>
            <p className="text-gray-600 text-sm capitalize">
              {texture || "No texture"} • {selectedFlavor ? `Flavor: ${selectedFlavor}` : "No flavor selected"}
              {selectedToppings.length > 0 && ` • Toppings: ${selectedToppings.join(", ")}`}
            </p>
          </div>
          <span className="text-2xl text-amber-600 font-bold">฿399.00</span>
        </div>
        <button
          onClick={handleAddToCart}
          disabled={!selectedFlavor}
          className="w-full bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          Add Custom Set to Cart
        </button>
      </div>
    </div>
  );
}