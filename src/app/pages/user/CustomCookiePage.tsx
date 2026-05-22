import { useState, useEffect } from "react";
import { useCart } from "../../hooks/useCart";
import { MenuItem } from "../../types";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { supabase } from "../../../../backend/supabaseClient";

export function CustomCookiePage() {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [dbTextures, setDbTextures] = useState<string[]>([]);
  const [dbFlavors, setDbFlavors] = useState<string[]>([]);
  const [dbToppings, setDbToppings] = useState<string[]>([]);

  // เปลี่ยนเป็น string ทั่วไปเพื่อให้รับค่าจากฐานข้อมูลได้โดยไม่ติด Type Error
  const [texture, setTexture] = useState<string>("");
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);

  const toggleFlavor = (flavor: string) => {
    setSelectedFlavors((prev) =>
      prev.includes(flavor)
        ? prev.filter((f) => f !== flavor)
        : [...prev, flavor]
    );
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
    
    fetchIngredients(); // 👈 ย้ายมาสั่งรันให้ถูกตำแหน่งตรงนี้
  }, []);

  // 🌟 เพิ่ม async ตรงนี้เพื่อให้ใช้คำสั่งร่วมกับฐานข้อมูลได้
  const handleAddToCart = async () => {
    if (selectedFlavors.length === 0) {
      toast.error("Please select at least one flavor!");
      return;
    }

    try {
      // 🌟 ใส่ await เพื่อรอให้ฐานข้อมูลบันทึกสูตรและคืนค่า ID กลับมา
      const { data: menuData, error: menuError } = await supabase
        .from('custom_menu')
        .insert({
          texture: [texture],
          flavors: selectedFlavors,
          toppings: selectedToppings
        })
        .select('id')
        .single();

      if (menuError) throw menuError;

      // ปั้นก้อนข้อมูลสินค้า (ใช้ "as any" หลบภัยในกรณีที่ไฟล์ types ยังไม่ได้อัปเดตฟิลด์)
      const customCookie = {
        id: `custom-${menuData.id}`, 
        name: `Custom Cookie (${selectedFlavors.join(", ")})`,
        type: "custom",
        price: 4.99,
        texture,
        flavors: selectedFlavors,
        toppings: selectedToppings,
      };

      // บันทึกลงตะกร้าฝั่ง Client
      addToCart(customCookie as any);
      
      toast.success("Saved recipe and added to cart!");
      
      // ล้างฟอร์มเคลียร์ค่าว่าง
      setSelectedFlavors([]);
      setSelectedToppings([]);
      
      navigate("/cart");

    } catch (error) {
      console.error("Error saving custom cookie:", error);
      toast.error("Failed to save your custom recipe");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl mb-4">Build Your Custom Cookie</h1>
        <p className="text-gray-600">Choose your texture and flavors</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        {/* Texture Selection */}
        <div className="mb-8">
          <h2 className="text-2xl mb-4">Texture</h2>
          <div className="flex gap-4">
            {dbTextures.map((t) => (
              <button
                key={t}
                onClick={() => setTexture(t)}
                className={`flex-1 py-4 px-6 rounded-lg border-2 transition-all capitalize ${
                  texture === t ? "border-amber-600 bg-amber-50 text-amber-600" : "border-gray-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Flavor Selection */}
        <div className="mb-8">
          <h2 className="text-2xl mb-4">Flavors</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {dbFlavors.map((flavor) => (
              <button
                key={flavor}
                onClick={() => toggleFlavor(flavor)}
                className={`py-3 px-4 rounded-lg border-2 transition-all capitalize ${
                  selectedFlavors.includes(flavor) ? "border-amber-600 bg-amber-50 text-amber-600" : "border-gray-200"
                }`}
              >
                {flavor}
              </button>
            ))}
          </div>
        </div>

        {/* Topping Selection */}
        <div>
          <h2 className="text-2xl mb-4">Toppings</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {dbToppings.map((topping) => (
              <button
                key={topping}
                onClick={() => toggleTopping(topping)}
                className={`py-3 px-4 rounded-lg border-2 transition-all capitalize ${
                  selectedToppings.includes(topping) ? "border-amber-600 bg-amber-50 text-amber-600" : "border-gray-200"
                }`}
              >
                {topping}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* กล่องสรุปราคาและปุ่มยืนยัน */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl mb-1">Your Custom Cookie</h3>
            <p className="text-gray-600 text-sm capitalize">
              {texture || "No texture"} • {selectedFlavors.length > 0 ? selectedFlavors.join(", ") : "No flavors selected"}
              {selectedToppings.length > 0 && ` • Toppings: ${selectedToppings.join(", ")}`}
            </p>
          </div>
          <span className="text-2xl text-amber-600 font-bold">$4.99</span>
        </div>
        <button
          onClick={handleAddToCart}
          disabled={selectedFlavors.length === 0}
          className="w-full bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}