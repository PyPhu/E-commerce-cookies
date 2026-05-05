import { Link } from "react-router-dom";
import { XCircle, ArrowLeft, MessageCircle } from "lucide-react";

export function CancelPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl shadow-xl">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-red-50 p-4 rounded-full">
            <XCircle className="w-20 h-20 text-red-500" />
          </div>
        </div>

        {/* Text Content */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
        <p className="text-gray-600 mb-8">
          Your payment process was cancelled. <br />
          No charges were made to your account.
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <Link 
            to="/checkout" 
            className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg active:scale-95"
          >
            Try Again
          </Link>
          
          <div className="flex gap-2">
            <Link 
              to="/cart" 
              className="flex-1 flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Cart
            </Link>

          </div>
        </div>
      </div>
    </div>
  );
}