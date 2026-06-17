import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { createClient } from "@supabase/supabase-js"
import generatePayload from 'promptpay-qr'
import QRCode from 'qrcode'
import multer from 'multer' // 🌟 แก้ไขตรงนี้เรียบร้อย

dotenv.config({ path: "../.env" })

const app = express()
app.use(cors())
app.use(express.json())

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
)

const upload = multer({ storage: multer.memoryStorage() });

// ── 1. API สร้าง QR Code ──
app.post("/create-payment-qr", async (req, res) => {
    try {
        const { cart, userInfo, grandTotal, shippingFee } = req.body;
        const targetPromptpay = process.env.SHOP_PROMPTPAY;

        if (!cart || !userInfo || grandTotal === undefined) {
            return res.status(400).json({ error: "Missing required data" })
        }
        if (!targetPromptpay) {
            return res.status(500).json({ error: "Shop PromptPay number is missing in .env" })
        }

        const { data: customer, error: customerError } = await supabase
            .from('customers')
            .select('id')
            .eq('email', userInfo.email.toLowerCase())
            .single();

        if (customerError || !customer) {
            console.error("Not found customer in database:", customerError);
            return res.status(400).json({ error: "Customer not found" });
        }

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                customer_id: customer.id,
                status: 'pending', 
                price_paid: Math.round(parseFloat(grandTotal)), 
                shipping_price: Math.round(parseFloat(shippingFee || 0)) 
            })
            .select('id')
            .single();
        
        if (orderError || !order) {
            throw new Error(`Failed to create order: ${orderError.message}`);
        }

        const orderItems = cart.map(item => {
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

        const payload = generatePayload(targetPromptpay, { amount: parseFloat(grandTotal) });
        
        const qrCodeDataUrl = await QRCode.toDataURL(payload, {
            errorCorrectionLevel: 'H',
            margin: 2,
            width: 300
        });

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

// ── 2. API รับสลิปและล้างตะกร้า (ยุบรวมอันเดียวแบบฉลาด) ──
app.post("/submit-slip", upload.single("slip"), async (req, res) => {
    try {
        const { orderId, customerEmail } = req.body;
        const file = req.file; 

        if (!orderId || !customerEmail) {
            return res.status(400).json({ success: false, error: "Missing required details" });
        }
        if (!file) {
            return res.status(400).json({ success: false, error: "No slip file uploaded" });
        }

        // สเต็ปที่ 1: อัปโหลดไฟล์สลิปขึ้น Supabase Storage
        const fileExtension = file.originalname.split('.').pop();
        const fileName = `slip_${orderId}_${Date.now()}.${fileExtension}`;

        const { data: storageData, error: storageError } = await supabase.storage
            .from('payment-slips')
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: true
            });

        if (storageError) {
            throw new Error(`Failed to upload slip image: ${storageError.message}`);
        }

        // สเต็ปที่ 2: ดึง Public URL มาเก็บไว้
        const { data: { publicUrl } } = supabase.storage
            .from('payment-slips')
            .getPublicUrl(fileName);

        // สเต็ปที่ 3: อัปเดตสถานะออเดอร์พร้อมบันทึกลิงก์สลิป
        const { error: updateOrderError } = await supabase
            .from('orders')
            .update({ 
                status: 'pending_verification', // เปลี่ยนเป็นรอแอดมินตรวจสลิป
                slip_url: publicUrl 
            })
            .eq('id', orderId);

        if (updateOrderError) {
            throw new Error(`Failed to update order status: ${updateOrderError.message}`);
        }

        // สเต็ปที่ 4: ค้นหา ID ลูกค้าเพื่อล้างตะกร้าสินค้าในระบบฐานข้อมูล
        const { data: customer } = await supabase
            .from('customers')
            .select('id')
            .eq('email', customerEmail.toLowerCase())
            .single();

        if (customer) {
            await supabase
                .from('cart_items')
                .delete()
                .eq('customer_id', customer.id);
        }

        console.log(`✅ Order ${orderId} submitted slip successfully by ${customerEmail}`);
        res.json({ success: true, message: "Slip uploaded, order updated and cart cleared successfully!" });

    } catch (error) {
        console.error("❌ Submit Slip Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(3000, () => console.log("Server running on port 3000"))