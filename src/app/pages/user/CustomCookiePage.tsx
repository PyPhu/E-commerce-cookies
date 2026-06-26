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
  const [selectedFlavor, setSelectedFlavor] = useState<string[]>([]);
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);

  const [cardNote, setCardNote] = useState<string>("");
  
  const [isShopClosed, setIsShopClosed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleSelectFlavor = (flavor: string) => {
    setSelectedFlavor((prev) => {
      if (prev.includes(flavor)) {
        return prev.filter((f) => f !== flavor);
      }
      if (prev.length === 2) {
        toast.error("You can only select one flavor");
        return prev;
      }
      return [...prev, flavor];
    });
  };

  const toggleTopping = (topping: string) => {
    setSelectedToppings((prev) => {
      if (prev.includes(topping)) {
        return prev.filter((t) => t !== topping);
      }
      if (prev.length === 3) {
        toast.error("You can only select 3 toppings");
        return prev;
      }
      return [...prev, topping];
    });
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [texturesRes, flavorsRes, toppingsRes, shopStatusRes] = await Promise.all([
          supabase.from("cookie_textures").select("type"),
          supabase.from("cookie_flavors").select("type"),
          supabase.from("cookie_toppings").select("type"),
          // ดึงข้อมูลสินค้า "Close" เพื่อเช็กสถานะร้าน
          supabase.from("products").select("show").eq("item", "Close").single()
        ]);

        // เช็กสถานะเปิด/ปิดร้านก่อน
        if (shopStatusRes.data) {
          setIsShopClosed(shopStatusRes.data.show === true);
        }

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
        console.error("Error loading data:", error);
        toast.error("Could not load page options");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // end session supabase
  useEffect(() => {
    // ดักฟังการเปลี่ยนแปลงสถานะระบบ
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate("/login"); 
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleAddToCart = async () => {
    // ดักจับเผื่อไว้กรณีร้านปิดไม่ให้รันฟังก์ชันแอดของลงตะกร้า
    if (isShopClosed) {
      toast.error("Sorry, the shop is currently closed.");
      return;
    }

    if (selectedFlavor.length === 0) {
      toast.error("Please select a flavor");
      return;
    }

    const { data } = await supabase.from('products').select('id').ilike('item', '%custom cookie%').single();

    if (!data) {
      toast.error("Error connecting to the database. Please try again later.");
      return;
    }

    try {

      const customCookie = {
        id: String(data?.id),
        name: "Custom Cookie Set (10 pcs)",
        type: "custom",
        price: 399,
        texture: texture,
        flavor: selectedFlavor,
        toppings: selectedToppings,
        custom_message: cardNote
      };
      
      await addToCart(customCookie as any);
      toast.success("Added Custom Set to cart!");

      setSelectedFlavor([]);
      setSelectedToppings([]);
      setCardNote("");
      navigate("/cart");
    } catch (error) {
      console.error("Error saving custom cookie:", error);
      toast.error("Failed to add custom recipe to cart");
    }
  };

  if (isLoading) {
    return <div className="text-center py-24 text-gray-500">Loading custom page...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl mb-4 font-bold">Build Your Custom Cookie</h1>
        <p className="text-gray-600">Choose your favorite texture, flavor, and toppings</p>
      </div>

      {/* แสดงแจ้งเตือนตัวใหญ่ด้านบนสุดถ้าร้านถูกตั้งเป็นปิดระบบ */}
      {isShopClosed && (
        <div className="bg-red-50 border-l-4 border-red-600 p-5 rounded-r-lg mb-8 shadow-sm">
          <div className="flex gap-3 items-center">
            <span className="text-2xl">⚠️</span>
            <div>
              <h4 className="text-red-800 font-bold text-lg">Shop Temporarily Closed</h4>
              <p className="text-red-700 text-sm">
                We are currently not accepting any orders, including custom cookie sets.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Custom Combo Set Box info */}
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

      {/* Form Area - ปรับ opacity ลงถ้าปิดร้านเพื่อให้ดูฟอร์มใช้งานไม่ได้ */}
      <div className={`transition-opacity duration-300 ${isShopClosed ? "opacity-60 pointer-events-none" : ""}`}>
        {/* Texture Selection */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="mb-8">
            <h2 className="text-2xl mb-4 font-semibold text-gray-800">Texture</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {dbTextures.map((t) => (
                <button
                  key={t}
                  disabled={isShopClosed}
                  onClick={() => setTexture(t)}
                  className={`w-full py-4 px-6 rounded-lg border-2 font-medium transition-all capitalize ${texture === t ? "border-amber-600 bg-amber-50 text-amber-600 shadow-sm" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Flavor Selection */}
          <div className="mb-8">
            <h2 className="text-2xl mb-2 font-semibold text-gray-800">Flavor</h2>
            <p className="text-sm text-gray-500 mb-4">
              (you can select 2 flavors, you will get 5 cookies of each flavor!!!)
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {dbFlavors.map((flavor) => (
                <button
                  key={flavor}
                  disabled={isShopClosed}
                  onClick={() => handleSelectFlavor(flavor)}
                  className={`py-3 px-4 rounded-lg border-2 font-medium transition-all capitalize ${selectedFlavor.includes(flavor) ? "border-amber-600 bg-amber-50 text-amber-600 shadow-sm" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                >
                  {flavor}
                </button>
              ))}
            </div>
          </div>

          {/* Topping Selection */}
          <div>
            <h2 className="text-2xl mb-4 font-semibold text-gray-800">Toppings</h2>
            <p className="text-sm text-gray-500 mb-4">
              (2 toppings are free, 3 topping add 10฿)
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {dbToppings.map((topping) => (
                <button
                  key={topping}
                  disabled={isShopClosed}
                  onClick={() => toggleTopping(topping)}
                  className={`py-3 px-2 rounded-lg border-2 font-medium transition-all capitalize ${selectedToppings.includes(topping) ? "border-amber-600 bg-amber-50 text-amber-600 shadow-sm" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                >
                  {topping}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Card Message */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-semibold text-gray-800">Custom Card Message</h2>
            <span className="text-sm text-gray-400">(Optional)</span>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            can write a special message for your loved ones! (max 200 characters)
          </p>
          <div className="relative">
            <textarea
              value={cardNote}
              disabled={isShopClosed}
              onChange={(e) => setCardNote(e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="example: Happy birthday! May you have a wonderful day!"
              className="w-full p-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-amber-600 transition-all text-gray-700 placeholder-gray-400 resize-none"
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
              {cardNote.length}/200
            </div>
          </div>
        </div>
      </div>

      {/* submit button */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Your Custom Box (10 pcs)</h3>
            <p className="text-gray-600 text-sm capitalize">
              {texture || "No texture"} • {selectedFlavor.length > 0 ? `Flavor: ${selectedFlavor.join(", ")}` : "No flavor selected"}
              {selectedToppings.length > 0 && ` • Toppings: ${selectedToppings.join(", ")}`}
            </p>
          </div>
          <span className="text-2xl text-amber-600 font-bold">{selectedToppings.length > 2 ? `฿${(399 + (selectedToppings.length - 2) * 10).toFixed(2)}` : "฿399.00"}</span>
        </div>
        
        {/*  close shop button */}
        <button
          onClick={handleAddToCart}
          disabled={isShopClosed || selectedFlavor.length === 0}
          className={`w-full py-3 rounded-lg font-semibold transition-colors shadow-sm ${
            isShopClosed
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-amber-600 text-white hover:bg-amber-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
          }`}
        >
          {isShopClosed ? "Shop Closed - Temporarily Unavailable" : "Add Custom Set to Cart"}
        </button>
      </div>
    </div>
  );
}