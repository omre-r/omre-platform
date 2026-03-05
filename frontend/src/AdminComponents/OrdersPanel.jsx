import { useEffect, useState } from "react";
import { Card, Flex, Text, Button, View, SelectField } from "@aws-amplify/ui-react";
import { fetchAuthSession } from "aws-amplify/auth";
import {
  getOrdersReq,
  getOrderReq,
  cancelOrderReq,
  updateOrderStatusReq
} from "../requests";

// Custom Styling 
const luxuryHeadingStyle = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 800,
  fontSize: "2.5rem",
  letterSpacing: "0.5px",
};

const luxuryBodyStyle = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 400,
  fontSize: "1.3rem",
  letterSpacing: "0.3px",
};

// Orders Panel 
export default function OrdersPanel() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [status, setStatus] = useState("");
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [msg, setMessage] = useState("");

  async function getToken() {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.accessToken?.toString();
    } catch (err) {
      console.error("Failed to get session:", err);
      return null;
    }
  }

// load orders
  async function loadOrders() {
    setMessage("");
    setLoadingOrders(true);

    try {
      const token = await getToken();
      if (!token) throw new Error("User not authenticated.");

      const data = await getOrdersReq();
      setOrders(data?.data?.orders || []);
    } catch (error) {
      setMessage(error.message || "Error loading orders.");
    } finally {
      setLoadingOrders(false);
    }
  }


// View Single Order 
async function viewOrder(orderId) {
  setMessage("");
  setLoadingOrder(true);
  setSelectedOrder(null);

  try {
    const token = await getToken();
    const data = await getOrderReq(orderId, token);
    let order = data?.data?.order;

    if (order && typeof order.items === "string") {
      order.items = JSON.parse(order.items);
    }

    setSelectedOrder(order);
    setStatus(order?.status || "");
  } catch (error) {
    setMessage(error.message || "Error viewing order.");
  } finally {
    setLoadingOrder(false);
  }
}

// Update Order 
  async function updateStatus() {
    if (!selectedOrder) return;

    try {
      const token = await getToken();
      await updateOrderStatusReq(selectedOrder.id, status, token);
      await viewOrder(selectedOrder.id);
      await loadOrders();
    } catch (error) {
      setMessage(error.message || "Error updating status.");
    }
  }

// Cancel Order 
  async function cancelOrder(orderId) {
    const reason = prompt("Enter cancellation reason:");
    if (!reason) return;

    try {
      const token = await getToken();
      await cancelOrderReq(orderId, reason, token);
      await loadOrders();
      setSelectedOrder(null);
    } catch (error) {
      setMessage(error.message || "Error cancelling order.");
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  if (loadingOrders) {
    return <Text style={luxuryBodyStyle}>Loading orders...</Text>;
  }

  return (
    <Flex direction="row" gap="1rem" height="100%">

      
      {/* left side card */}
      <Card flex="1.2" height="100%" padding="1rem" backgroundColor="whitesmoke">
        <Flex direction="column" height="100%">
          <Flex justifyContent="space-between" alignItems="center">
            <Text style={luxuryHeadingStyle}>Orders</Text>
            <Button style={luxuryBodyStyle} onClick={loadOrders}>
              Refresh
            </Button>
          </Flex>

          {msg && <Text color="Black" style={luxuryBodyStyle} marginTop="0.5rem">{msg}</Text>}

          <View overflow="auto" height="20rem" marginTop="1rem">
            {orders.length === 0 && <Text style={luxuryBodyStyle}>No orders found.</Text>}

            {orders.map((order) => (
              <Button
                key={order.id}
                variation="link"
                marginBottom=".5rem"
                border=".5px solid #111"
                borderRadius="6px"
                onClick={() => viewOrder(order.id)}
                justifyContent="flex-start"
                width="100%"
              >
                Order #{order.id.slice(0, 8)} — {order.status}
              </Button>
            ))}
          </View>
        </Flex>
      </Card>

      {/* Right side Card  */}
      <Card
        flex="1.0"
        height="100%"
        padding="1rem"
        backgroundColor="whitesmoke"
      >
        <Flex direction="column" height="100%">
          <Text width="100%" textAlign="center" style={luxuryHeadingStyle}>
            Order Information
          </Text>

          <View
            flex="1"
            overflow="auto"
            marginTop="1rem"
            paddingRight="0.5rem"
          >
            {!loadingOrder && !selectedOrder && (
              <Text style={luxuryBodyStyle}>Please select an order</Text>
            )}
            {loadingOrder && (
              <Text style={luxuryBodyStyle}>Loading order information...</Text>
            )}

            {!loadingOrder && selectedOrder && (
              <Flex direction="column" gap=".4rem">
                <Text>Status: {selectedOrder.status}</Text>
                <Text>Total: ${Number(selectedOrder.total).toFixed(2)}</Text>
                {selectedOrder.created && (
                  <Text>
                    Created: {new Date(selectedOrder.created).toLocaleString()}
                  </Text>
                )}
                {selectedOrder.cancelreason && (
                  <Text>Cancel Reason: {selectedOrder.cancelreason}</Text>
                )}

                <Text marginTop="1rem" fontWeight="bold">
                  Items
                  </Text>
                  {selectedOrder.items?.map((item, i) => (
                  <Text key={i}>
                      {item.item?.name || item.type} x{item.quantity}
                    </Text>
                  ))}

                  {selectedOrder.status !== "canceled" && (
                    <>
                      <SelectField
                        label="Update Status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="mixing">Mixing</option>
                        <option value="ready">Ready</option>
                        <option value="fulfilled">Fulfilled</option>
                      </SelectField>

                      <Button style={luxuryBodyStyle} onClick={updateStatus}>
                        Update Status
                      </Button>
                      <Button
                        style={luxuryBodyStyle}
                        onClick={() => cancelOrder(selectedOrder.id)}
                      >
                        Cancel Order
                      </Button>
                    </>
                  )}

                  <Button
                    style={luxuryBodyStyle}
                    onClick={() => setSelectedOrder(null)}
                  >
                    Close Info
                  </Button>
                </Flex>
              )}
            </View>
          </Flex>
        </Card>
    </Flex>
  );
}