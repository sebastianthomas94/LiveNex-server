import Razorpay from "razorpay";
import User from "../models/userModel.js";

const razorpay = async (req, res) => {
  try {
    const instance = new Razorpay({
      key_id: process.env.RAZARPAY_KEY_ID,
      key_secret: process.env.RAZARPAY_KEY_SECRET,
    });
    const {plan, cost} = req.query;
    const options = {
      amount: cost * 100,
      currency: "INR",
      receipt: "receipt_order_74394",
    };

    const order = await instance.orders.create(options);

    if (!order) return res.status(500).send("Some error occured");

    res.json(order);
  } catch (err) {
    if (err) throw err;
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
};

const razorpaySuccess = async(req, res) => {
  try {
    const {
      orderCreationId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      email,
      plan
    } = req.body;
    const startDate = Date.now();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 28);
    const razorpayDetails = {
      endDate: endDate,
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
      success: true,
      startDate: Date.now(),
      plan,
    };

    try {
        const user = await User.findOneAndUpdate(
          {
            email: req.userEmail,
          },
          { $set: { razorpayDetails: razorpayDetails } }
        );
        
      } catch (err) {
        console.error(err.message);
        throw err;
      }


    res.json({
        msg: "success",
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
      });
  } catch (error) {}
};

export { razorpay, razorpaySuccess };
