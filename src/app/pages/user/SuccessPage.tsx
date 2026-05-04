import { useEffect } from 'react';
import { Link } from "react-router-dom";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import { useCart } from "../../hooks/useCart";
import  confetti  from "canvas-confetti";

export function SuccessPage() {
    const { clearCart} = useCart();

    useEffect(() => {
        //clesr cart first
        clearCart();

        //then show confetti
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#D97706', '#FBBF24', '#5D4037']
        });
    }, []);

    return(
        <div className='min-h-[80nh] flex items-center justify-center px-4'>
            <div className='max-w-md w-full text-center bg-white p-8 rounded-2xl shadow-xl'>
                <div className='flex justify-center mb-6'>
                    <CheckCircle2 className="w-20 h-20 text-green-500 animate-bounce" /> 
                </div>

                <h1 className='text-3xl font-bold text-gray-900 mb-2'>Succesful payment</h1>
                <p className="text-gray-600 mb-8 ">Thanks for your purchase! <br />
                Your order will be processed shortly.</p>

                <div>
                    <Link to='/profile ' className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                        View Order Details
                    </Link>
                </div>
            </div>
        </div>
    )
}