// This file is kept for backward compatibility
// It now uses Razorpay instead of Link Financial SDK
import { initiatePayment, verifyPayment } from './razorpay';

// This function is deprecated and will be removed in future versions
// Please use the initiatePayment function directly
export const initiateLinkPayment = async (amount: number, orderId: string) => {
  console.warn('initiateLinkPayment is deprecated. Please use initiatePayment function instead.');
  
  try {
    // Convert to Razorpay format
    const paymentSession = await initiatePayment({
      amount,
      orderId,
      currency: 'INR', // Changed from PKR to INR for Razorpay
    });

    return paymentSession;
  } catch (error) {
    console.error('Payment Error:', error);
    throw new Error('Payment initiation failed');
  }
};

// This function is deprecated and will be removed in future versions
// Please use the verifyPayment function directly
export const verifyLinkPayment = async (sessionId: string) => {
  console.warn('verifyLinkPayment is deprecated. Please use verifyPayment function instead.');
  
  try {
    // For backward compatibility, we're assuming sessionId contains the necessary info
    // In a real implementation, you would need to parse this or change your code
    const [paymentId, orderId, signature] = sessionId.split('|');
    
    const status = await verifyPayment(paymentId, orderId, signature);
    return status;
  } catch (error) {
    console.error('Payment Verification Error:', error);
    throw new Error('Payment verification failed');
  }
};