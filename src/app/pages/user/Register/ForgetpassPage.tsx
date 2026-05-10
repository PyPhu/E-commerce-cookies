import { useState } from "react";
import { supabase } from "../../../../../backend/supabaseClient";
import { toast } from "sonner";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");

  const handleResetPassword = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo:
          "http://localhost:5173/reset-password",
      }
    );

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(
      "Password reset email sent!"
    );
  };

  return (
    <div className="bg-gradient-to-br from-amber-75 to-amber-100 min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">
          Forgot Password
        </h1>

        <form
          onSubmit={handleResetPassword}
          className="space-y-4"
        >
          <div>
            <label className="block mb-1 text-sm font-medium">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
          >
            Send Reset Link
          </button>
        </form>

        <p className="text-sm text-center mt-4">
          <a
            href="/login"
            className="text-blue-500 hover:underline"
          >
            Back to Login
          </a>
        </p>
      </div>
    </div>
  );
}