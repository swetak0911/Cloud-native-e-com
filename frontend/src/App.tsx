import { useState, useEffect } from "react";
import "./App.css";

const API_GATEWAY = "http://localhost:8080";
const PAYMENT_API_BASE =
  import.meta.env.VITE_PAYMENT_API_BASE || "http://localhost:5004";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState("");
  const [productsList, setProductsList] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);

  const [orderId, setOrderId] = useState("507f191e810c19729de860ea");
  const [paymentUserId, setPaymentUserId] = useState("507f191e810c19729de860eb");
  const [amount, setAmount] = useState("499.99");
  const [currency, setCurrency] = useState("INR");
  const [idempotencyKey, setIdempotencyKey] = useState("idem-ui-001");

  const [paymentId, setPaymentId] = useState("");
  const [updatePaymentId, setUpdatePaymentId] = useState("");
  const [updateStatus, setUpdateStatus] = useState("SUCCESS");
  const [transactionId, setTransactionId] = useState("txn-ui-001");

  const [webhookPaymentId, setWebhookPaymentId] = useState("");
  const [webhookStatus, setWebhookStatus] = useState("SUCCESS");
  const [webhookTxnId, setWebhookTxnId] = useState("txn-wh-001");

  const [paymentResponse, setPaymentResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const setApiResult = async (res: Response) => {
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = { message: "No JSON response body" };
    }
    setPaymentResponse(data);
    setResult(`${res.status} ${res.statusText}`);
    return data;
  };

  const handleAuth = async (path: string) => {
    try {
      const res = await fetch(`${API_GATEWAY}/auth/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem("token", data.token);
        setResult("Success! Token saved.");
        fetchCart();
      } else {
        setResult(JSON.stringify(data, null, 2));
      }
    } catch (err) {
      setResult("Auth Error: " + err);
    }
  };

  const getProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_GATEWAY}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProductsList(Array.isArray(data) ? data : []);
      setResult(res.ok ? "Products loaded" : "Error loading products");
    } catch (err) {
      setResult("Products Error: " + err);
    }
  };

  const addToCart = async (product: any) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first!");
      return;
    }

    try {
      const response = await fetch(`${API_GATEWAY}/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product._id,
          productName: product.name,
          price: product.price,
          quantity: 1,
        }),
      });

      if (!response.ok) throw new Error("Failed to add to cart");
      setResult("Added to cart: " + product.name);
      fetchCart();
    } catch (err: any) {
      setResult("Cart Error: " + err.message);
    }
  };

  const fetchCart = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const response = await fetch(`${API_GATEWAY}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setCart(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Cart fetch error:", err);
    }
  };

  const clearCart = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      for (const item of cart) {
        await fetch(`${API_GATEWAY}/cart/${item._id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setCart([]);
      setResult("Cart cleared successfully!");
    } catch (err) {
      setResult("Error clearing cart: " + err);
    }
  };

  const handleCheckout = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_GATEWAY}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cartItems: cart }),
      });

      if (!response.ok) throw new Error("Failed to place order");

      alert("Order placed successfully!");
      clearCart();
    } catch (error) {
      console.error(error);
      alert("Failed to place order");
    }
  };

  const createPayment = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${PAYMENT_API_BASE}/payments/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "idempotency-key": idempotencyKey,
        },
        body: JSON.stringify({
          orderId,
          userId: paymentUserId,
          amount: Number(amount),
          currency,
        }),
      });
      const data = await setApiResult(res);
      if (data?.payment?._id) {
        setPaymentId(data.payment._id);
        setUpdatePaymentId(data.payment._id);
        setWebhookPaymentId(data.payment._id);
      }
    } catch (err: any) {
      setResult("Create payment error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentById = async () => {
    if (!paymentId) {
      setResult("Payment ID is required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${PAYMENT_API_BASE}/payments/${paymentId}`);
      await setApiResult(res);
    } catch (err: any) {
      setResult("Get payment error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updatePayment = async () => {
    if (!updatePaymentId) {
      setResult("Update payment ID is required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${PAYMENT_API_BASE}/payments/${updatePaymentId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: updateStatus,
            transactionId,
          }),
        }
      );
      await setApiResult(res);
    } catch (err: any) {
      setResult("Update payment error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const testWebhookInvalidSignature = async () => {
    if (!webhookPaymentId) {
      setResult("Webhook payment ID is required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${PAYMENT_API_BASE}/payments/webhook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-signature": "invalid-signature-from-ui",
        },
        body: JSON.stringify({
          paymentId: webhookPaymentId,
          status: webhookStatus,
          transactionId: webhookTxnId,
        }),
      });
      await setApiResult(res);
    } catch (err: any) {
      setResult("Webhook test error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <h1>🛒 E-Commerce Gateway + Payment Console</h1>

      <section className="card">
        <h2>Auth & Commerce</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="row">
          <button onClick={() => handleAuth("signup")}>Signup</button>
          <button onClick={() => handleAuth("login")}>Login</button>
          <button onClick={getProducts}>Get Products</button>
        </div>

        <p>Status: {result}</p>
      </section>

      <section className="card">
        <h3>Available Products</h3>
        <ul>
          {productsList.map((p) => (
            <li key={p._id}>
              {p.name} - ${p.price}
              <button onClick={() => addToCart(p)}>Add to Cart</button>
            </li>
          ))}
        </ul>

        <h3>Your Cart</h3>
        <div className="row">
          <button className="danger" onClick={clearCart}>
            Clear
          </button>
          <button className="success" onClick={handleCheckout}>
            Checkout
          </button>
        </div>
        <ul>
          {cart.map((item: any, index: number) => (
            <li key={index}>
              {item.productName} - Qty: {item.quantity}
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Payment Service Console</h2>
        <p className="muted">Base URL: {PAYMENT_API_BASE}</p>

        <h4>Create Payment</h4>
        <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="orderId" />
        <input
          value={paymentUserId}
          onChange={(e) => setPaymentUserId(e.target.value)}
          placeholder="userId"
        />
        <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="amount" />
        <input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="currency" />
        <input
          value={idempotencyKey}
          onChange={(e) => setIdempotencyKey(e.target.value)}
          placeholder="idempotency-key"
        />
        <button onClick={createPayment} disabled={loading}>
          {loading ? "Processing..." : "Create Payment"}
        </button>

        <h4>Get Payment By ID</h4>
        <input value={paymentId} onChange={(e) => setPaymentId(e.target.value)} placeholder="paymentId" />
        <button onClick={getPaymentById} disabled={loading}>
          {loading ? "Loading..." : "Fetch Payment"}
        </button>

        <h4>Update Payment Status</h4>
        <input
          value={updatePaymentId}
          onChange={(e) => setUpdatePaymentId(e.target.value)}
          placeholder="paymentId"
        />
        <select value={updateStatus} onChange={(e) => setUpdateStatus(e.target.value)}>
          <option value="PENDING">PENDING</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="FAILED">FAILED</option>
        </select>
        <input
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          placeholder="transactionId"
        />
        <button onClick={updatePayment} disabled={loading}>
          {loading ? "Updating..." : "Update Status"}
        </button>

        <h4>Webhook Test (Invalid Signature)</h4>
        <input
          value={webhookPaymentId}
          onChange={(e) => setWebhookPaymentId(e.target.value)}
          placeholder="paymentId"
        />
        <select value={webhookStatus} onChange={(e) => setWebhookStatus(e.target.value)}>
          <option value="PENDING">PENDING</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="FAILED">FAILED</option>
        </select>
        <input
          value={webhookTxnId}
          onChange={(e) => setWebhookTxnId(e.target.value)}
          placeholder="transactionId"
        />
        <button onClick={testWebhookInvalidSignature} disabled={loading}>
          {loading ? "Sending..." : "Send Invalid Webhook"}
        </button>

        <h4>Payment API Response</h4>
        <pre className="response-box">{JSON.stringify(paymentResponse, null, 2)}</pre>
      </section>
    </div>
  );
}

export default App;
