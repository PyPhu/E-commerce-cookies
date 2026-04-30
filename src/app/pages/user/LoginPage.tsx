import { useState } from "react";
import { useNavigate } from "react-router";

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();

        if (email === 'admin' && password === '1234') {
            const userData  = {role: 'admin', isLoggedIn: true, name: 'Admin User'};
            localStorage.setItem('user', JSON.stringify(userData));

            alert('Admin login successful!');
            navigate('/admin/admin');
        } else {
            const userData = {role: 'user', isLoggedIn: true, name: 'Gerneral User'};
            localStorage.setItem('user', JSON.stringify(userData));

            alert('User login successful!');
            navigate('/')
        }
    };

    return (
        <div className="flex flex-col item-center justify-center min-h-screen">
            <form onSubmit={handleLogin} className="p-8 border rounded-lg shadow-md w-96">
                <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>
                <input type="text"
                placeholder="Email"
                className="w-full p-2 mb-4 border rounded"
                value={email}
                onChange={(e) => setEmail(e.target.value)} />

                <input type="password"
                placeholder="Password"
                className="w-full p-2 mb-4 border rounded"
                value={password}
                onChange={(e) => setPassword(e.target.value)} />

                <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
                    Login
                </button>
            </form>
        </div>
    );

}