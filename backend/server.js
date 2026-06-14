import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { createClient } from "@supabase/supabase-js"
import generatePayload from 'promptpay-qr'
import QRCode from 'qrcode'

dotenv.config({ path: "../.env" })

const app = express()
app.use(cors())
app.use(express.json())

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
)

app.post("/create-payment-qr", async (req, res) => {
    try {
        // get data from frontend
        const { cart, userInfo, grandTotal, shippingFee } = req.body;
        const targetPromptpay = process.env.SHOP_PROMPTPAY;

        if (!cart || !userInfo || grandTotal === undefined) {
            return res.status(400).json({ error: "Missing required data" })
        }
        if (!targetPromptpay) {
            return res.status(500).json({ error: "Shop PromptPay number is missing in .env" })
        }

        // use email to find customer_id 
        const { data: customer, error: customerError } = await supabase
            .from('customers')
            .select('id')
            .eq('email', userInfo.email.toLowerCase())
            .single();

        if (customerError || !customer) {
            console.error("Not found customer in database:", customerError);
            return res.status(400).json({ error: "Customer not found" });
        }

        // create order in orders table and get order_id
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                customer_id: customer.id,
                status: 'pending', 
                price_paid: Math.round(parseFloat(grandTotal)), // บันทึกเข้าคอลัมน์ price_paid 
                shipping_price: Math.round(parseFloat(shippingFee || 0)) // บันทึกเข้าคอลัมน์ shipping_price 
            })
            .select('id')
            .single();
        
        if (orderError || !order) {
            throw new Error(`Failed to create order: ${orderError.message}`);
        }

        // save order items in order_items table with order_id as foreign key
        const orderItems = cart.map(item => {
            // แปลงรสชาติให้อยู่ในรูปแบบ Array เสมอตาม Type _text ในฐานข้อมูล
            let flavorArray = [];
            if (Array.isArray(item.flavors) && item.flavors.length > 0) {
                flavorArray = item.flavors;
            } else if (item.flavor) {
                flavorArray = [item.flavor];
            }

            return {
                order_id: order.id,
                name: item.name || "Custom Cookie", 
                texture: item.texture ?? null,     
                flavor: flavorArray,               
                toppings: item.toppings ?? [],     
                quantity: parseInt(item.quantity), 
                price: Math.round(item.price),     
                custom_message: item.custom_message ?? null 
            };
        });

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) {
            throw new Error(`Failed to save order items: ${itemsError.message}`);
        }

        // gen PromptPay QR Code Payload
        const payload = generatePayload(targetPromptpay, { amount: parseFloat(grandTotal) });
        
        // แปลง Payload เป็น Base64 รูปภาพ
        const qrCodeDataUrl = await QRCode.toDataURL(payload, {
            errorCorrectionLevel: 'H',
            margin: 2,
            width: 300
        });

        // ส่งค่ากลับไปหา Frontend
        res.json({ 
            success: true,
            orderId: order.id,
            qrCodeUrl: qrCodeDataUrl,
            grandTotal: grandTotal
        });

    } catch (error) {
        console.error("❌ Create QR Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// update order status to 'paid' when customer submit slip and clear cart items in Supabase DB
app.post("/submit-slip", async (req, res) => {
    try {
        const { orderId, customerEmail } = req.body;

        if (!orderId || !customerEmail) {
            return res.status(400).json({ error: "Missing required details" });
        }

        // update order status to 'paid'
        const { error: updateOrderError } = await supabase
            .from('orders')
            .update({ status: 'paid' })
            .eq('id', orderId);

        if (updateOrderError) {
            throw new Error(`Failed to update order status: ${updateOrderError.message}`);
        }

        // find customer_id by email to clear cart items
        const { data: customer } = await supabase
            .from('customers')
            .select('id')
            .eq('email', customerEmail.toLowerCase())
            .single();

        // clear cart items in Supabase DB for the customer
        if (customer) {
            await supabase
                .from('cart_items')
                .delete()
                .eq('customer_id', customer.id);
        }

        console.log(`✅ order number${orderId} submitted slip successfully!!! ${customerEmail}`);
        res.json({ success: true, message: "Order payment updated successfully" });

    } catch (error) {
        console.error("❌ Submit Slip Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => console.log("Server running on port 3000"))