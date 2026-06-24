import { useState } from "react";
import { LogIn, UserPlus, LogOut, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../../../../backend/supabaseClient";
import { useNavigate } from "react-router";


type Tab = "login" | "signup";

export function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("login");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupAddress, setSignupAddress] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      toast.error("Login failed: " + error.message);
      return;
    }

    // Fetch profile from Supabase and save to localStorage
    const { data } = await supabase
      .from("customers")
      .select("*")
      .eq("email", loginEmail)
      .single();

    if (data) {
      localStorage.setItem("cookie-shop-user", JSON.stringify({
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
      }));
    }
    navigate("/");
    toast.success("Signed in — welcome back! 🍪");
  };

  const handleSignup = async () => {
    if (!signupName || !signupEmail || !signupPhone || !signupAddress || !signupPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    if (signupPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
    });

    if (authError) {
      toast.error("Signup failed: " + authError.message);
      return;
    }

    const { error: profileError } = await supabase
      .from("customers")
      .upsert(
        {
          id: authData.user?.id, // ใช้ user ID จาก Supabase
          name: signupName,
          email: signupEmail,
          phone: signupPhone,
          address: signupAddress,
        },
        { onConflict: "email" }
      );

    if (profileError) {
      toast.error("Profile save failed: " + profileError.message);
      return;
    }

    // Save user info to localStorage
    localStorage.setItem("cookie-shop-user", JSON.stringify({
      name: signupName,
      email: signupEmail,
      phone: signupPhone,
      address: signupAddress,
    }));

    toast.success("Account created — welcome! 🎉");
    navigate("/");
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
          {/* Tabs */}
          <div
            style={{
              display: "flex",
              background: "#F5EEE3",
              borderRadius: "8px",
              padding: "3px",
              marginBottom: "1.75rem",
            }}
          >
            {(["login", "signup"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1,
                  padding: "7px 0",
                  border: "none",
                  background: tab === t ? "#E07B1A" : "transparent",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: tab === t ? "#fff" : "#9C8A6E",
                  cursor: "pointer",
                  transition: "all 0.16s",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {t === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          {/* Login Panel */}
          {tab === "login" && (
            <div>
              <p style={{ fontFamily: "'Baloo 2', cursive", fontSize: "20px", fontWeight: 600, color: "#2C2108", marginBottom: "4px" }}>
                Welcome back
              </p>
              <p style={{ fontSize: "13px", color: "#9C8A6E", marginBottom: "1.75rem" }}>
                Sign in to your cookiekamin account
              </p>

              <Field label="Email">
                <input
                  type="email"
                  placeholder="example@gmail.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => applyFocus(e)}
                  onBlur={(e) => removeFocus(e)}
                />
              </Field>

              <Field label="Password">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => applyFocus(e)}
                  onBlur={(e) => removeFocus(e)}
                />
              </Field>

              <div style={{ textAlign: "right", marginTop: "-6px", marginBottom: "12px" }}>
                <a href="/forgot-password" className="text-[12px] text-[#E07B1A] no-underline hover:underline" >
                  Forgot password?
                </a>
              </div>

              <button onClick={handleLogin} style={submitStyle}>
                <LogIn size={16} /> Sign in
              </button>

              <p style={{ textAlign: "center", fontSize: "13px", color: "#9C8A6E", marginTop: "1.25rem" }}>
                No account?{" "}
                <span onClick={() => setTab("signup")} style={{ color: "#E07B1A", cursor: "pointer", fontWeight: 500 }}>
                  Create one free
                </span>
              </p>
            </div>
          )}

          {/* Signup Panel */}
          {tab === "signup" && (
            <div>
              <p style={{ fontFamily: "'Baloo 2', cursive", fontSize: "20px", fontWeight: 600, color: "#2C2108", marginBottom: "4px" }}>
                Create your account
              </p>
              <p style={{ fontSize: "13px", color: "#9C8A6E", marginBottom: "1.75rem" }}>
                Join cookiekamin and start ordering
              </p>

              <Field label="Name">
                <input type="text" placeholder="username" value={signupName} onChange={(e) => setSignupName(e.target.value)} style={inputStyle} onFocus={applyFocus} onBlur={removeFocus} />
              </Field>
              <Field label="Email">
                <input type="email" placeholder="example@gmail.com" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} style={inputStyle} onFocus={applyFocus} onBlur={removeFocus} />
              </Field>
              <Field label="Phone">
                <input type="tel" placeholder="1234567890" value={signupPhone} onChange={(e) => setSignupPhone(e.target.value)} style={inputStyle} onFocus={applyFocus} onBlur={removeFocus} />
              </Field>
              <Field label="Address">
                <input type="text" placeholder="example address" value={signupAddress} onChange={(e) => setSignupAddress(e.target.value)} style={inputStyle} onFocus={applyFocus} onBlur={removeFocus} />
              </Field>
              <Field label="Password">
                <input type="password" placeholder="Min. 8 characters" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} style={inputStyle} onFocus={applyFocus} onBlur={removeFocus} />
              </Field>

              <button onClick={handleSignup}  style={submitStyle}>
                <UserPlus size={16} /> Create account
              </button>

              <p style={{ textAlign: "center", fontSize: "13px", color: "#9C8A6E", marginTop: "1.25rem" }}>
                Already have an account?{" "}
                <span onClick={() => setTab("login")} style={{ color: "#E07B1A", cursor: "pointer", fontWeight: 500 }}>
                  Sign in
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#9C8A6E", marginBottom: "6px", letterSpacing: "0.2px" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 13px",
  border: "1px solid #E2D9CC",
  borderRadius: "8px",
  background: "#fff",
  color: "#2C2108",
  fontFamily: "'Inter', sans-serif",
  fontSize: "14px",
  outline: "none",
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
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "7px",
};

function applyFocus(e: React.FocusEvent<HTMLInputElement>) {
  e.target.style.borderColor = "#E07B1A";
  e.target.style.boxShadow = "0 0 0 3px rgba(224,123,26,0.12)";
}

function removeFocus(e: React.FocusEvent<HTMLInputElement>) {
  e.target.style.borderColor = "#E2D9CC";
  e.target.style.boxShadow = "none";
}
