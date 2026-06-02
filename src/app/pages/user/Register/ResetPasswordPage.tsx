import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../../../../backend/supabaseClient";
import { useNavigate } from "react-router";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // สถานะเปิด-ปิดตาสำหรับดูรหัสผ่าน
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);

    // อัปเดตรหัสผ่านใหม่ของ User ที่ล็อกอินมาจากลิงก์ในอีเมล
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setIsLoading(false);

    if (error) {
      toast.error("Reset password failed: " + error.message);
      return;
    }

    toast.success("Password updated successfully! 🎉");
    
    // เคลียร์ session ออกหลังเปลี่ยนเสร็จ เพื่อบังคับให้ล็อกอินใหม่ด้วยรหัสผ่านใหม่เพื่อความปลอดภัย
    await supabase.auth.signOut();

    // นำทางกลับไปหน้าล็อกอิน
    setTimeout(() => {
      navigate("/login");
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FAF4EC", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Content */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2.5rem 1rem" }}>
        <div
          style={{
            background: "#fff",
            borderRadius: "14px",
            border: "1px solid #EDE4D6",
            width: "100%",
            maxWidth: "420px",
            padding: "2.25rem 2rem",
            boxSizing: "border-box",
          }}
        >
          {/* Header */}
          <p style={{ fontFamily: "'Baloo 2', cursive", fontSize: "20px", fontWeight: 600, color: "#2C2108", marginBottom: "4px" }}>
            Create new password
          </p>
          <p style={{ fontSize: "13px", color: "#9C8A6E", marginBottom: "1.75rem" }}>
            Your new password must be different from previous used passwords.
          </p>

          {/* New Password Field */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#9C8A6E", marginBottom: "6px", letterSpacing: "0.2px" }}>
              New Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="Min. 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={inputStyle}
                onFocus={applyFocus}
                onBlur={removeFocus}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                style={eyeButtonStyle}
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#9C8A6E", marginBottom: "6px", letterSpacing: "0.2px" }}>
              Confirm Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={inputStyle}
                onFocus={applyFocus}
                onBlur={removeFocus}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={eyeButtonStyle}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            onClick={handleUpdatePassword} 
            style={{ ...submitStyle, opacity: isLoading ? 0.7 : 1, cursor: isLoading ? "not-allowed" : "pointer" }}
            disabled={isLoading}
          >
            <Lock size={16} /> {isLoading ? "Updating..." : "Reset password"}
          </button>

        </div>
      </div>
    </div>
  );
}

// Styles
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 40px 9px 13px", // เว้นพื้นที่ด้านขวาเผื่อปุ่มเปิดตา
  border: "1px solid #E2D9CC",
  borderRadius: "8px",
  background: "#fff",
  color: "#2C2108",
  fontFamily: "'Inter', sans-serif",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};

const eyeButtonStyle: React.CSSProperties = {
  position: "absolute",
  right: "12px",
  top: "50%",
  transform: "translateY(-50%)",
  background: "none",
  border: "none",
  color: "#9C8A6E",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
};

const submitStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px",
  background: "#E07B1A",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  fontFamily: "'Inter', sans-serif",
  fontSize: "14px",
  fontWeight: 500,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "7px",
  transition: "all 0.16s",
};

function applyFocus(e: React.FocusEvent<HTMLInputElement>) {
  e.target.style.borderColor = "#E07B1A";
  e.target.style.boxShadow = "0 0 0 3px rgba(224,123,26,0.12)";
}

function removeFocus(e: React.FocusEvent<HTMLInputElement>) {
  e.target.style.borderColor = "#E2D9CC";
  e.target.style.boxShadow = "none";
}