import { useState, useEffect } from "react";
import { Navigate } from "react-router";
import { supabase } from "../../../backend/supabaseClient";

interface AdminOnlyProps {
  children: React.ReactNode;
}

export function AdminOnly({ children }: AdminOnlyProps) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // null = still loading
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      // Get current logged-in user's email from localStorage
      const stored = localStorage.getItem('cookie-shop-user');
      if (!stored) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { email } = JSON.parse(stored);

      // Fetch role from Supabase
      const { data, error } = await supabase
        .from('customers')
        .select('role')
        .eq('email', email)
        .single();

      if (error || !data) {
        setIsAdmin(false);
      } else {
        setIsAdmin(data.role === 'admin');
      }

      setLoading(false);
    };

    checkAdmin();
  }, []);

  // Still checking
  if (loading) return <div className="text-center py-12">Checking access...</div>;

  // Not admin → redirect
  if (!isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}