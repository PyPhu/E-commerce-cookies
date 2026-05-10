import { useState } from "react";
import { supabase } from "../../../../../backend/supabaseClient";
import { toast } from "sonner";

const USER_STORAGE_KEY = "user_profile";

export function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password){
            toast.error("Please enter both email and password");
            return;
        }

        //login with supabase
        const {data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            toast.error(error.message);
            return;
        }

        // pull customer data from supabase
        const {data: customerData, error: customerError} = await supabase
            .from("customers")
            .select("*")
            .eq("email", email)
            .single();

        if (customerError) {
            toast.error("Failed to fetch customer data");
            return;
        }

        // save local storage
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(customerData));

        toast.success('Login successful!');

        console.log("User:", data.user);
        console.log("Customer Data:", customerData);

        // redirect to home page
        window.location.href = "/";
    };

    return(
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-6">
          Login
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block mb-1 text-sm font-medium">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block mb-1 text-sm font-medium">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div>
                <a href="/forgot-password" className="text-right text-sm text-blue-500 hover:underline mt-2 block">
                    Forgot password?
                </a>
            </div>
          </div>

          {/* Login button */}
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
          >
            Login
          </button>
        </form>

        <p className="text-sm text-center mt-4">
          Do not have an account?{" "}
          <a
            href="/register"
            className="text-blue-500 hover:underline"
          >
            Register
          </a>
        </p>
      </div>
    </div>
    );
}