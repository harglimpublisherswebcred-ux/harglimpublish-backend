const logger = require('../utils/logger');
const orderPaymentBridgeService = require('../services/orderPaymentBridgeService');
const orderService = require('../services/orderService');

// @desc    Create new order and return UPI QR code (Uses MongoDB Transactions)
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;

    const { order: createdOrder, payment } = await orderPaymentBridgeService.createOrderWithPaymentIntent({
      user: req.user,
      items,
      shippingAddress,
      paymentMethod
    });

    logger.info(`Order created successfully: ${createdOrder.orderNumber}`);
    

    res.status(201).json({
      success: true,
      data: {
        order: createdOrder,
        payment
      }
    });
  } catch (error) {
    logger.error(`Order creation failed: ${error.message}`);
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Get order detail
// @route   GET /api/orders/:id
// @access  Private
const getOrder = async (req, res) => {
  try {
    const order = await orderService.loadAuthorizedOrder(req.params.id, req.user);
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};
// @desc    Track Order
// @route   GET /api/orders/track/:orderNumber
// @access  Public
const trackOrder = async (req, res) => {
  try {
    const data = await orderService.trackOrder(req.params.orderNumber);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Payment (Submit UTR)
// @route   PUT /api/orders/:id/verify-payment
// @access  Private
const verifyPayment = async (req, res) => {
  try {
    const { utr } = req.body;
    
    if (!utr) {
      return res.status(400).json({ success: false, message: 'UTR (Transaction ID) is required' });
    }

    const order = await orderPaymentBridgeService.submitOrderUTR(req.params.id, utr, req.user);

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel Order
// @route   DELETE /api/orders/:id
// @access  Private
const cancelOrder = async (req, res) => {
  try {
    const order = await orderService.cancelOrder(req.params.id, req.user);
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createOrder,
  getOrder,
  trackOrder,
  verifyPayment,
  cancelOrder
};


