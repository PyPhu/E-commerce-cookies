import express from "express"
import Stripe from "stripe"
import cors from "cors"
import dotenv from "dotenv"
import { createClient } from "@supabase/supabase-js"

dotenv.config({ path: "../.env" })

const app = express() // สร้าง backend server

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

app.use(cors()) // อนุญาต frontend คนละ port เรียก API ได้

// webhook session
app.post("/create-checkout-session", express.json(), async (req, res) => {
    try {
        const { cart, userInfo } = req.body;
        if (!cart || !userInfo) {
            return res.status(400).json({ error: "Cart is empty" })
        }

        const line_items = cart.map(item => ({
            price_data: {
                currency: "thb",
                product_data: { name: item.name },
                unit_amount: Math.round(item.price * 100)
            },
            quantity: item.quantity
        }));

        // prepare metadata for order details
        const metadata = {
            customer_email: userInfo.email,
            customer_name: userInfo.name,
            // แปลงอาร์เรย์ของตะกร้าสินค้าให้กลายเป็น string เพื่อฝากไว้กับ Stripe
            cart_data: JSON.stringify(cart.map(item => ({
                name: item.name,
                texture: item.texture ?? null, // รองรับกรณีไม่มี texture
                // order_items.flavor เป็นรสชาติเดี่ยว (text) -> ดึงรสชาติแรกจาก Array มาเก็บ
                flavor: Array.isArray(item.flavors) && item.flavors.length > 0 ? item.flavors[0] : (item.flavor ?? null), 
                // cart_items.toppings แก้เป็น _text (Array) แล้ว -> ส่งค่า Array ไปพักไว้ได้เลยโดยไม่ต้องแปลง
                toppings: item.toppings ?? [], 
                quantity: item.quantity
            })))
        };

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['promptpay'],
            line_items,
            mode: 'payment',
            metadata: metadata,
            success_url: `http://localhost:5173/success`,
            cancel_url: `http://localhost:5173/cancel`
        });
        res.json({ url: session.url });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// webhook for stripe after payment success
app.post("/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        // check if the event is sent from stripe
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // handle the checkout session completed event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { customer_email, customer_name, cart_data } = session.metadata; // pull data from metadata
        const parsedCart = JSON.parse(cart_data); // แปลง string กลับเป็นอาร์เรย์ของตะกร้าสินค้า

        console.log(`🔔 ตรวจพบการชำระเงินสำเร็จจากคุณ: ${customer_name} (${customer_email})`);

        try {
            // save customer_id to customer in supabase
            const { data: customer, error: customerError } = await supabase
                .from('customers')
                .select('id')
                .eq('email', customer_email.toLowerCase());

            if (customerError || !customer) {
                console.error("not found customer in database:", customerError);
                return res.status(400).json({ error: "Customer not found" });
            }

            // create order in status "paid" 
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    customer_id: customer[0].id,
                    status: 'paid'
                })
                .select('id')
                .single();
            
            if (orderError || !order) {
                throw new Error(`failed to create order: ${orderError.message}`);
            }

            // move items from metadata to order_items table ให้ตรงกับสคีมาฐานข้อมูล
            const orderItems = parsedCart.map(item => ({
                order_id: order.id,
                texture: item.texture,    // text
                flavor: item.flavor,      // text (รสชาติหลักรสเดี่ยว)
                toppings: item.toppings,  // _text (Array ของท็อปปิ้ง)
                quantity: item.quantity,  // int4
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) {
                throw new Error(`บันทึกสินค้าลง order_items ล้มเหลว: ${itemsError.message}`);
            }

            // remove items from cart_items table
            await supabase
                .from('cart_items')
                .delete()
                .eq('customer_id', customer[0].id);

            console.log("✅ บันทึก Order และสินค้าลงฐานข้อมูล Supabase เรียบร้อยแล้ว!");
        } catch (dbError) {
            console.error("❌ เกิดข้อผิดพลาดในการบันทึกข้อมูลลงฐานข้อมูล:", dbError);
            return res.status(500).json({ error: "Database internal error" });
        }
    }
    res.json({ received: true }); // respond to stripe that we received the webhook event
});

app.listen(3000, () => console.log("Server running on port 3000"))