const axios = require('axios');

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
const BASE_URL = 'https://api.sandbox.paypal.com'; // Switch to live in production

// Step 1: Get Access Token
const getAccessToken = async () => {
  const response = await axios({
    url: `${BASE_URL}/v1/oauth2/token`,
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    auth: {
      username: PAYPAL_CLIENT_ID,
      password: PAYPAL_SECRET,
    },
    data: 'grant_type=client_credentials',
  });

  return response.data.access_token;
};

// Step 2: Create PayPal Order
const createOrder = async (amount) => {
  const accessToken = await getAccessToken();

  const response = await axios.post(
    `${BASE_URL}/v2/checkout/orders`,
    {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: amount,
          },
        },
      ],
      application_context: {
        return_url: 'https://sesmpv1a96.execute-api.us-east-1.amazonaws.com/paypal-success',
        cancel_url: 'https://sesmpv1a96.execute-api.us-east-1.amazonaws.com/paypal-cancel',
      },
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return response.data;
};

// Step 3: Capture Payment
const capturePayment = async (token) => {
  const accessToken = await getAccessToken();

  const response = await axios.post(
    `${BASE_URL}/v2/checkout/orders/${token}/capture`,
    {},
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return response.data;
};

// ✅ CREATE PAYMENT (Lambda-style)
module.exports.createPayment = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const rawAmount = body.amount;

    if (!rawAmount || isNaN(rawAmount)) {
      throw new Error('Invalid or missing amount');
    }

    const amount = parseFloat(rawAmount).toFixed(2);
    const paymentResponse = await createOrder(amount);

    return {
      statusCode: 200,
      body: JSON.stringify({
        paymentUrl: paymentResponse.links.find(link => link.rel === 'approve')?.href,
      }),
    };
  } catch (error) {
    console.error('PayPal API Error:', error.response?.data || error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

// ✅ REDIRECTED HERE AFTER SUCCESS
module.exports.paypalSuccess = async (event) => {
  const { token } = event.queryStringParameters;

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Redirect successful',
      token,
      instruction: 'Now send this token to /verify-payment to capture the payment.',
    }),
  };
};

// ✅ ACTUAL PAYMENT VERIFICATION ENDPOINT
module.exports.verifyPayment = async (event) => {
  const { token } = JSON.parse(event.body); // ✅ fix here

  try {
    const captureResponse = await capturePayment(token);

    if (captureResponse.status === 'COMPLETED') {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Payment successful!', captureResponse }),
      };
    } else {
      throw new Error('Payment not completed');
    }
  } catch (error) {
    console.error('Verify payment error:', error.response?.data || error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

// ✅ HANDLE CANCEL
module.exports.paypalCancel = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Payment was canceled!' }),
  };
};
