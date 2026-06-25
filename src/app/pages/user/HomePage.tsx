import { useCart } from "../../hooks/useCart";
import { MenuItem } from "../../types";
import { toast } from "sonner";
import { Cookie, Plus, X } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../../../../backend/supabaseClient";

type MenuItemWithImage = MenuItem & { image?: string };

export function HomePage() {
  const { addToCart } = useCart();
  const [menuCookies, setMenuCookies] = useState<MenuItemWithImage[]>([]);
  const [loading, setLoading] = useState(true);

  //  URL ของรูปที่ต้องการเปิดดูขนาดใหญ่
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("show", true)
        .neq("item", "Shipping Standard (<=10)")
        .neq("item", "Shipping Bulk (>10)");

      if (error) {
        toast.error("Failed to load menu");
        setLoading(false);
        return;
      }

      const mapped: MenuItemWithImage[] = data.map((p) => {
        // สร้างตัวแปรเก็บ URL เริ่มต้นเป็น undefined
        let publicUrl: string | undefined = undefined;

        //  เช็กว่า p.image_url ไม่เป็น null หรือ string ว่าง
        if (p.image_url) {
          const { data: storageData } = supabase.storage
            .from("cookie_images")
            .getPublicUrl(p.image_url);

          publicUrl = storageData?.publicUrl;
        }

        return {
          id: String(p.id),
          name: p.item,
          type: "menu" as const,
          price: p.price,
          texture: p.texture,
          flavor: p.flavor ?? '',
          toppings: p.toppings,
          image: publicUrl,
        };
      });

      setMenuCookies(mapped);
      setLoading(false);
    };

    fetchMenu();
  }, []);

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

      {loading ? (
        <div className="text-center py-24 text-gray-400">Loading menu...</div>
      ) : menuCookies.length === 0 ? (
        <div className="text-center py-24 text-gray-400">No items available right now</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {menuCookies.map((cookie) => (
            <div
              key={cookie.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* cursor-pointer และ onClick */}
              <div
                className="bg-gradient-to-br from-amber-100 to-amber-200 h-48 flex items-center justify-center overflow-hidden cursor-pointer group relative"
                onClick={() => cookie.image && setSelectedImage(cookie.image)}
              >
                {cookie.image ? (
                  <>
                    <img
                      src={cookie.image}
                      alt={cookie.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {/* เพิ่ม Overlay เล็กน้อยตอนเอาเมาส์มาวางให้รู้ว่ากดขยายได้ */}
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium text-sm">
                      Click to view
                    </div>
                  </>
                ) : (
                  <Cookie className="w-12 h-12 text-amber-600" />
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl mb-2">{cookie.name}</h3>
                <p className="text-gray-600 text-sm mb-4 capitalize">
                  {cookie.texture} • {cookie.flavor} • {cookie.toppings?.join(", ")}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl text-amber-600">฿{cookie.price.toFixed(2)}</span>
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
      )}

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

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedImage(null)} // กดพื้นที่ว่างด้านนอกเพื่อปิด
        >
          <div className="relative max-w-4xl max-h-[85vh] bg-white rounded-lg  overflow-hidden shadow-2xl">
            {/* ปุ่มปิด Modal */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {/* รูปภาพขนาดใหญ่ */}
            <img
              src={selectedImage}
              alt="Cookie preview"
              className="max-w-full max-h-[80vh] object-contain rounded"
              onClick={(e) => e.stopPropagation()} // บล็อกไม่ให้กดที่ตัวรูปภาพแล้ว Modal ปิด
            />
          </div>
        </div>
      )}
    </div>
  );
}