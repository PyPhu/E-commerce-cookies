import express from "express"
import Stripe from "stripe"
import cors from "cors"
import dotenv from "dotenv"

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const YOUR_DOMAIN = "http://localhost:5173" // React dev server

app.post("/create-checkout-session", async (req, res) => {
    try{
        const { cart} = req.body;
        // prevent error
        if (!cart || cart.length === 0){
            return res.status(400).json({error: "Cart is empty"})
        }

        const line_items =cart.map(item =>({
            price_data:{
                currency: "thb",
                product_data:{
                    name: item.name,
                },
                unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity,
        }));

        const session = await stripe.checkout.sessions.create({
            // ระบุเฉพาะ promptpay เพื่อบังคับให้แสดงแค่ QR
            payment_method_types: ['promptpay'], 
            line_items,
            mode: "payment",
            success_url: `http://localhost:5173/success`,
            cancel_url: `http://localhost:5173/cancel`,
        });

        res.json({url: session.url });
    } catch (err) {
        console.error(err);
        res.status(500).json({error: err.message});
    }
});

app.listen(3000, () => console.log("Server running on port 3000"))