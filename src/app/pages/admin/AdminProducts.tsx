import { useState, useEffect } from "react";
import { supabase } from "../../../../backend/supabaseClient";
import { Plus, Edit2, Trash2, Eye, EyeOff, Save, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Product } from "../../types";

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // สำหรับแยกว่ากำลัง "เพิ่มใหม่" หรือ "แก้ไขตัวเก่า"
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // State ฟอร์มสำหรับสร้าง/แก้ไขสินค้า
  const [formData, setFormData] = useState<Product>({
    item: "",
    price: 0,
    texture: "Soft-Baked",
    flavor: "Original",
    image_url: "",
    show: true,
    toppings: []
  });

  // สำหรับเก็บ input ข้อความ toppings ชั่วคราว (เช่น "Choco chip, Almond")
  const [toppingsInput, setToppingsInput] = useState("");

  // 1. ดึงข้อมูลสินค้าทั้งหมดมาจาก Supabase
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("id", { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (err: any) {
      toast.error("โหลดข้อมูลสินค้าไม่สำเร็จ: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // manage modal to add item
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      item: "",
      price: 0,
      texture: "Soft-Baked",
      flavor: "Original",
      image_url: "",
      show: true,
      toppings: []
    });
    setToppingsInput("");
    setIsModalOpen(true);
  };

  // manage modal to edit item
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({ ...product });
    setToppingsInput(product.toppings ? product.toppings.join(", ") : "");
    setIsModalOpen(true);
  };

  // save data to supabase (both add and edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.item || formData.price <= 30) {
        toast.error("please provide valid item name and price");
        return;
    }

    // adapt toppings input to array
    const toppingsArray = toppingsInput
      .split(",")
      .map(t => t.trim())
      .filter(t => t !== "");

    const productPayload = {
      ...formData,
      toppings: toppingsArray
    };

    try{
        if (editingProduct && editingProduct.id) {
            // update existing product
            const { error } = await supabase
                .from("products")
                .update(productPayload)
                .eq("id", editingProduct.id);

            if (error) throw error;
            toast.success("fix product successfully");
        } else {
            // insert new product
            const { error } = await supabase
                .from("products")
                .insert([productPayload]);

            if (error) throw error;
            toast.success("add new product successfully");
        }

        setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      toast.error("เกิดข้อผิดพลาดในการบันทึก: " + err.message);
    }
  };
  // delete product
  const handleDeleteProduct = async (id: number, name: string) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบสินค้า "${name}"?`)) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("ลบสินค้าเรียบร้อยแล้ว");
      fetchProducts();
    } catch (err: any) {
      toast.error("ไม่สามารถลบสินค้าได้: " + err.message);
    }
  };

  // 6. สลับการแสดงผลหน้าร้านอย่างรวดเร็ว (Toggle Show/Hide)
  const handleToggleShow = async (id: number, currentShow: boolean) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ show: !currentShow })
        .eq("id", id);

      if (error) throw error;
      toast.success("อัปเดตสถานะการแสดงผลแล้ว");
      fetchProducts();
    } catch (err: any) {
      toast.error("ไม่สามารถเปลี่ยนสถานะได้: " + err.message);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {/* Header ของหน้าจัดการสินค้า */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-black text-amber-950">Product Store Management</h2>
          <p className="text-sm text-gray-500">เพิ่ม ลด หรือแก้ไขรายการคุกกี้ที่แสดงหน้าร้าน</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" /> เพิ่มสินค้าใหม่
        </button>
      </div>

      {/* ส่วนแสดงตารางรายการสินค้า */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
          <Loader2 className="w-10 h-10 animate-spin text-amber-600" />
          <p>กำลังดึงรายการสินค้าจากระบบ...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border border-dashed rounded-xl">ไม่มีสินค้าในระบบขณะนี้</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-amber-50/50 border-b border-gray-100 text-amber-900 font-bold">
              <tr>
                <th className="py-3 px-4 text-center">รูป</th>
                <th className="py-3 px-4">ชื่อคุกกี้</th>
                <th className="py-3 px-4">ราคา</th>
                <th className="py-3 px-4">เนื้อสัมผัส / รสชาติ</th>
                <th className="py-3 px-4">ท็อปปิ้งเริ่มต้น</th>
                <th className="py-3 px-4 text-center">แสดงหน้าร้าน</th>
                <th className="py-3 px-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-amber-50/20 transition-colors">
                  <td className="py-3 px-4 text-center">
                    <img
                      src={product.image_url || "https://placehold.co/100x100?text=Cookie"}
                      alt={product.item}
                      className="w-12 h-12 rounded-lg object-cover mx-auto bg-gray-100 border"
                    />
                  </td>
                  <td className="py-3 px-4 font-bold text-gray-800">{product.item}</td>
                  <td className="py-3 px-4 font-black text-amber-700">฿{product.price}</td>
                  <td className="py-3 px-4">
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium mr-1">{product.texture}</span>
                    <span className="text-xs bg-amber-100 px-2 py-0.5 rounded text-amber-800 font-medium">{product.flavor}</span>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500 max-w-[200px] truncate">
                    {product.toppings && product.toppings.length > 0 ? product.toppings.join(", ") : "-"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleToggleShow(product.id!, product.show)}
                      className={`p-1.5 rounded-md transition-all ${
                        product.show ? "text-green-600 bg-green-50 hover:bg-green-100" : "text-gray-400 bg-gray-50 hover:bg-gray-100"
                      }`}
                      title={product.show ? "คลิกเพื่อซ่อนหน้าร้าน" : "คลิกเพื่อแสดงหน้าร้าน"}
                    >
                      {product.show ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(product)}
                        className="p-1.5 rounded text-blue-600 hover:bg-blue-50"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id!, product.item)}
                        className="p-1.5 rounded text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 🌟 หน้าต่างป๊อปอัพ (Modal Form) สำหรับ เพิ่ม/แก้ไข สินค้า */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-amber-50 border-b px-6 py-4 flex justify-between items-center">
              <h3 className="font-black text-amber-900 text-lg">
                {editingProduct ? "📝 แก้ไขข้อมูลสินค้า" : "✨ เพิ่มสินค้าชิ้นใหม่"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">ชื่อสินค้า *</label>
                <input
                  type="text"
                  required
                  value={formData.item}
                  onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-amber-500"
                  placeholder="เช่น Classic Chocolate Chip"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">ราคา (บาท) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.price || ""}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-amber-500"
                    placeholder="65"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">เนื้อสัมผัส</label>
                  <input
                    type="text"
                    value={formData.texture}
                    onChange={(e) => setFormData({ ...formData, texture: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-amber-500"
                    placeholder="เช่น Soft-Baked / Crispy"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">รสชาติหลัก</label>
                <input
                  type="text"
                  value={formData.flavor}
                  onChange={(e) => setFormData({ ...formData, flavor: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-amber-500"
                  placeholder="เช่น Dark Chocolate / Vanilla"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">ลิงก์ที่อยู่รูปภาพ (Image URL)</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-amber-500"
                  placeholder="https://example.com/cookie.jpg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">ท็อปปิ้งเริ่มต้น (คั่นด้วยจุลภาค `,` )</label>
                <input
                  type="text"
                  value={toppingsInput}
                  onChange={(e) => setToppingsInput(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-amber-500"
                  placeholder="เช่น M&M, Chocolate Chips, Cashew Nut"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="show_field"
                  checked={formData.show}
                  onChange={(e) => setFormData({ ...formData, show: e.target.checked })}
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <label htmlFor="show_field" className="text-sm font-medium text-gray-700 select-none">
                  เปิดให้ลูกค้าสั่งซื้อทันที (แสดงหน้าร้าน)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <Save className="w-4 h-4" /> บันทึกข้อมูล
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-600 text-sm font-medium py-2 rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

}