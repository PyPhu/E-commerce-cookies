import { useState } from "react";
import { UserInfo } from "../../types";
import { User, MapPin, Mail, Phone, Edit2, Save, X, LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../../../backend/supabaseClient";
import { useNavigate } from "react-router";
import { OrderHistory } from "./OrderHistory"; // ✨ Import Component ที่แยกออกมา
import { useEffect } from "react";

const USER_STORAGE_KEY = 'cookie-shop-user';

export function UserProfilePage() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/login");
  };

  const [isEditing, setIsEditing] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo>(() => {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {
      name: "",
      email: "",
      address: "",
      phone: "",
    };
  });
  const [editedInfo, setEditedInfo] = useState<UserInfo>(userInfo);

  const hasProfile = userInfo.name && userInfo.email;

  const handleSave = async () => {
    if (!editedInfo.name || !editedInfo.email || !editedInfo.address || !editedInfo.phone) {
      toast.error("Please fill in all fields");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error("User not authenticated");
      return;
    }

    const { error } = await supabase
      .from('customers')
      .update({
        name: editedInfo.name,
        email: editedInfo.email,
        phone: editedInfo.phone,
        address: editedInfo.address,
      })
      .eq('id', user.id);

    if (error) {
      toast.error("Failed to save profile: " + error.message);
      return;
    }

    setUserInfo(editedInfo);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(editedInfo));
    setIsEditing(false);
    toast.success("Profile updated successfully!");
  };

  const handleCancel = () => {
    setEditedInfo(userInfo);
    setIsEditing(false);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        toast.error("Logout failed: " + error.message);
        return;
      }

      localStorage.removeItem("cookie-shop-user");
      toast.success("Logged out successfully");
      navigate("/login");

    } catch (error) {
      toast.error("Logout failed");
      console.error("Logout error:", error);
    }
  };

  // end session supabase
  useEffect(() => {
    // เช็คทันทีตอนโหลดหน้าเว็บขึ้นมา
    const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log("No initial session found");
        navigate("/login");
      }
    };
    checkInitialSession();

    // ดักฟังการเปลี่ยนแปลงหลังจากนั้น
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth Event เกิดขึ้น:", event);
      if (event === 'SIGNED_OUT' || !session) {
        console.log("Session expired");
        navigate("/login"); 
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-4xl font-bold">My Profile</h1>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 border border-black-200 bg-amber-300 hover:bg-amber-400 px-4 py-2 rounded-lg transition-colors"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* ฝั่งซ้าย: ข้อมูลส่วนตัว (Personal Info) */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl">Personal Info</h2>
              {hasProfile && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-amber-600 hover:text-amber-700 p-2"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              )}
            </div>

            {!hasProfile && !isEditing ? (
              <div className="text-center py-8">
                <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No profile information yet</p>
                <button
                  onClick={() => handleClick()}
                  className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700"
                >
                  Login
                </button>
              </div>
            ) : isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2">Name</label>
                  <input
                    type="text"
                    value={editedInfo.name}
                    onChange={(e) => setEditedInfo({ ...editedInfo, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Email</label>
                  <input
                    type="email"
                    value={editedInfo.email}
                    onChange={(e) => setEditedInfo({ ...editedInfo, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Phone</label>
                  <input
                    type="tel"
                    value={editedInfo.phone}
                    onChange={(e) => setEditedInfo({ ...editedInfo, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Address</label>
                  <textarea
                    value={editedInfo.address}
                    onChange={(e) => setEditedInfo({ ...editedInfo, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                    rows={3}
                    placeholder="123 Main St, City, State, ZIP"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="flex-1 bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  {hasProfile && (
                    <button
                      onClick={handleCancel}
                      className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p>{userInfo.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p>{userInfo.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p>{userInfo.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p>{userInfo.address}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Developer Profile */}
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-3">
              <div className="bg-amber-100 p-2 rounded-lg text-amber-700">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Developer Profile</h3>
                <p className="text-xs text-gray-500">student from kmitl</p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-700">
              <p className="flex justify-between">
                <span className="text-gray-500">Developed by:</span>
                <span className=" text-gray-500">Phurin</span>
              </p>
              <p><span className="flex justify-end text-gray-500">Krissada</span></p>
              <p><span className="flex justify-end text-gray-500">Soponwit</span></p>
              <p className="flex justify-between">
                <span className="text-gray-500">Role:</span>
                <span className="text-amber-500 font-medium">Full-Stack Developer</span>
              </p>
              <p className="text-xs text-gray-400 border-t border-gray-50 pt-2 mt-2 text-center">
                © {new Date().getFullYear()} Cookie Shop Project.
              </p>
            </div>
          </div>
        </div>

        {/* ฝั่งขวา: เรียกประวัติการสั่งซื้อ (Order History Component) */}
        <div className="md:col-span-2">
          {userInfo.email && <OrderHistory email={userInfo.email} />}
        </div>
      </div>
    </div>
  );
}