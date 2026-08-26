import API from '../api/client';

/**
 * Dynamically load the Razorpay Checkout SDK script
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Trigger complete Razorpay payment flow:
 * 1. Create order on backend (server calculates price based on user eligibility)
 * 2. Launch Razorpay Checkout modal
 * 3. Verify payment signature on backend
 * 4. Return result
 */
export const initiateRazorpayPayment = async ({
  programId,
  planId,
  programType,
  user,
  onSuccess,
  onFailure,
  onCancel,
}) => {
  try {
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      alert('Razorpay SDK failed to load. Please check your internet connection.');
      onFailure?.(new Error('Razorpay SDK load error'));
      return;
    }

    // Step 1: Request backend order creation
    const orderRes = await API.post('/api/payments/create-order', {
      programId,
      planId,
      programType,
    });

    const { orderId, amount, currency, key, planName } = orderRes.data;

    // Helper for test/mock execution if Razorpay SDK isn't available or running mock order
    const isMockOrder = orderId?.startsWith('order_mock_') || key === 'rzp_test_mock_key';

    if (isMockOrder) {
      // In mock mode (e.g. key/SDK sandbox fallback), directly trigger server-side verification with mock ID
      const verifyRes = await API.post('/api/payments/verify', {
        razorpay_order_id: orderId,
        razorpay_payment_id: `pay_mock_${Date.now()}`,
        razorpay_signature: 'mock_signature',
        mock_success: true,
      });

      if (verifyRes.data?.success) {
        onSuccess?.(verifyRes.data);
      } else {
        onFailure?.(new Error(verifyRes.data?.message || 'Payment verification failed'));
      }
      return;
    }

    // Step 2: Configure Razorpay Checkout options
    const options = {
      key,
      amount: amount * 100, // paise
      currency,
      name: 'TechLearn',
      description: `${planName || 'Program Access'} — No refunds or cancellations after purchase`,
      order_id: orderId,
      prefill: {
        name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.name || '',
        email: user?.email || '',
        contact: user?.phone || '',
      },
      theme: {
        color: '#3c83f6',
      },
      handler: async function (response) {
        try {
          // Step 3: Verify payment server-side
          const verifyRes = await API.post('/api/payments/verify', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });

          if (verifyRes.data?.success) {
            onSuccess?.(verifyRes.data);
          } else {
            onFailure?.(new Error(verifyRes.data?.message || 'Server verification failed'));
          }
        } catch (err) {
          console.error('Payment verification failed:', err);
          onFailure?.(err);
        }
      },
      modal: {
        ondismiss: function () {
          console.log('Razorpay Checkout closed by user');
          onCancel?.();
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response) {
      console.error('Razorpay payment failed:', response.error);
      onFailure?.(response.error);
    });

    rzp.open();
  } catch (err) {
    console.error('initiateRazorpayPayment error:', err);
    onFailure?.(err);
  }
};
