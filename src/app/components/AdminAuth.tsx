import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "../../../backend/supabaseClient";

interface AuthContextType {
    isAdmin: boolean;
    loading: boolean;
    user: any | null;
}

const AuthContext = createContext<AuthContextType>({
    isAdmin: false, loading: true, user: null
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const checkUserRole = async () => {
        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError || !user) {
                setIsAdmin(false);
                setUser(null);
                setLoading(false);
                return;
            }

            setUser(user);

            // query the role from the customers table (by uuid)
            const { data, error } = await supabase
                .from('customers')
                .select('role')
                .eq('id', user.id)
                .limit(1);

            if (!error && data && data.length > 0) {
                setIsAdmin(data[0].role === 'admin');
            } else {
                setIsAdmin(false);
            }
        } catch (err) {
            console.error("Error checking role:", err);
            setIsAdmin(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkUserRole();

        const { data: authListener } = supabase.auth.onAuthStateChange(() => {
            checkUserRole();
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ isAdmin, loading, user }}>
            {children}
        </AuthContext.Provider>
    );
}
export const useAuth = () => useContext(AuthContext);