import { useState, useEffect } from "react";
import { supabase } from "../../../../backend/supabaseClient";
import { Plus, Edit2, Trash2, Eye, EyeOff, Save, X, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Product } from "../../types";

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState<Product>({
    item: "",
    price: 0,
    texture: "Soft-Baked",
    flavor: "Original",
    image_url: "",
    show: true,
    toppings: []
  });

  const [toppingsInput, setToppingsInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string>("");

  // ✅ Fetch all products
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
      toast.error("Failed to load products: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ✅ Open modal to add new product
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
    setImagePreview("");
    setIsModalOpen(true);
  };

  // ✅ Open modal to edit product
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({ ...product });
    setToppingsInput(product.toppings ? product.toppings.join(", ") : "");
    
    // Show image preview from storage
    if (product.image_url) {
      const { data } = supabase.storage
        .from("cookie_images")
        .getPublicUrl(product.image_url);
      setImagePreview(data.publicUrl);
    } else {
      setImagePreview("");
    }
    
    setIsModalOpen(true);
  };

  // ✅ Handle image upload to Supabase Storage
  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    setIsUploadingImage(true);

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${timestamp}_${file.name}`;

      // Upload to Supabase Storage
      const { error } = await supabase.storage
        .from("cookie_images")
        .upload(`public/${filename}`, file, {
          cacheControl: "3600",
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data } = supabase.storage
        .from("cookie_images")
        .getPublicUrl(`public/${filename}`);

      setFormData({ ...formData, image_url: `public/${filename}` });
      setImagePreview(data.publicUrl);
      toast.success("Image uploaded successfully!");
    } catch (err: any) {
      toast.error("Failed to upload image: " + err.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // ✅ Save product (add or edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.item || formData.price < 30) {
      toast.error("Please provide a valid product name and price (min ฿30)");
      return;
    }

    const toppingsArray = toppingsInput
      .split(",")
      .map(t => t.trim())
      .filter(t => t !== "");

    const productPayload = {
      ...formData,
      toppings: toppingsArray
    };

    try {
      if (editingProduct && editingProduct.id) {
        // Update existing product
        const { error } = await supabase
          .from("products")
          .update(productPayload)
          .eq("id", editingProduct.id);

        if (error) throw error;
        toast.success("Product updated successfully!");
      } else {
        // Insert new product
        const { error } = await supabase
          .from("products")
          .insert([productPayload]);

        if (error) throw error;
        toast.success("Product added successfully!");
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      toast.error("Error saving product: " + err.message);
    }
  };

  // ✅ Delete product
  const handleDeleteProduct = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Product deleted successfully!");
      fetchProducts();
    } catch (err: any) {
      toast.error("Failed to delete product: " + err.message);
    }
  };

  // ✅ Toggle product visibility
  const handleToggleShow = async (id: number, currentShow: boolean) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ show: !currentShow })
        .eq("id", id);

      if (error) throw error;
      toast.success("Product visibility updated!");
      fetchProducts();
    } catch (err: any) {
      toast.error("Failed to update visibility: " + err.message);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-amber-950">Product Management</h2>
          <p className="text-sm text-gray-500">Add, remove, or edit cookies displayed on the store</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" /> Add New Product
        </button>
      </div>

      {/* Products Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
          <Loader2 className="w-10 h-10 animate-spin text-amber-600" />
          <p>Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border border-dashed rounded-xl">
          No products in the system yet
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-amber-50/50 border-b border-gray-100 text-amber-900 font-bold">
              <tr>
                <th className="py-3 px-4 text-center">Image</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Texture / Flavor</th>
                <th className="py-3 px-4">Default Toppings</th>
                <th className="py-3 px-4 text-center">Show in Store</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {products.map((product) => {
                const imageUrl = product.image_url
                  ? supabase.storage.from("cookie_images").getPublicUrl(product.image_url).data.publicUrl
                  : "https://placehold.co/100x100?text=Cookie";

                return (
                  <tr key={product.id} className="hover:bg-amber-50/20 transition-colors">
                    <td className="py-3 px-4 text-center">
                      <img
                        src={imageUrl}
                        alt={product.item}
                        className="w-12 h-12 rounded-lg object-cover mx-auto bg-gray-100 border"
                      />
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-800">{product.item}</td>
                    <td className="py-3 px-4 font-bold text-amber-700">฿{product.price}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium mr-1">
                        {product.texture}
                      </span>
                      <span className="text-xs bg-amber-100 px-2 py-0.5 rounded text-amber-800 font-medium">
                        {product.flavor}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500 max-w-[200px] truncate">
                      {product.toppings && product.toppings.length > 0 ? product.toppings.join(", ") : "-"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleShow(product.id!, product.show)}
                        className={`p-1.5 rounded-md transition-all ${
                          product.show
                            ? "text-green-600 bg-green-50 hover:bg-green-100"
                            : "text-gray-400 bg-gray-50 hover:bg-gray-100"
                        }`}
                        title={product.show ? "Click to hide from store" : "Click to show in store"}
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-amber-50 border-b px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-amber-900 text-lg">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Image Upload */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Product Image
                </label>
                <div className="border-2 border-dashed border-amber-200 rounded-lg p-4 text-center hover:bg-amber-50 transition-colors">
                  {imagePreview ? (
                    <div className="space-y-2">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <label className="block">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])}
                          disabled={isUploadingImage}
                          className="hidden"
                        />
                        <span className="cursor-pointer text-sm text-amber-600 hover:text-amber-700 font-medium">
                          {isUploadingImage ? "Uploading..." : "Change Image"}
                        </span>
                      </label>
                    </div>
                  ) : (
                    <label className="block cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])}
                        disabled={isUploadingImage}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center gap-2 py-2">
                        <Upload className="w-6 h-6 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {isUploadingImage ? "Uploading..." : "Click to upload image"}
                        </span>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.item}
                  onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  placeholder="Classic Chocolate Chip"
                />
              </div>

              {/* Price & Texture */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Price (฿) *
                  </label>
                  <input
                    type="number"
                    required
                    min={30}
                    value={formData.price || ""}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-amber-500"
                    placeholder="65"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Texture
                  </label>
                  <input
                    type="text"
                    value={formData.texture}
                    onChange={(e) => setFormData({ ...formData, texture: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-amber-500"
                    placeholder="Soft-Baked / Crispy"
                  />
                </div>
              </div>

              {/* Flavor */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Main Flavor
                </label>
                <input
                  type="text"
                  value={formData.flavor}
                  onChange={(e) => setFormData({ ...formData, flavor: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  placeholder="Dark Chocolate / Vanilla"
                />
              </div>

              {/* Toppings */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Default Toppings (comma separated)
                </label>
                <input
                  type="text"
                  value={toppingsInput}
                  onChange={(e) => setToppingsInput(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  placeholder="M&M, Chocolate Chips, Cashew Nut"
                />
              </div>

              {/* Show in Store */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="show_field"
                  checked={formData.show}
                  onChange={(e) => setFormData({ ...formData, show: e.target.checked })}
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <label htmlFor="show_field" className="text-sm font-medium text-gray-700 select-none">
                  Show in store for customers to order
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <Save className="w-4 h-4" /> Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-600 text-sm font-medium py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}