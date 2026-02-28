import { useEffect, useState } from "react";
import { Card, Flex, Text, Button, View } from "@aws-amplify/ui-react";
import { getUserOrdersReq } from "../requests";

// Custom Styling for fonts and amplify ui --------------------------------------
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

// API URL to reach user information -----------------------------------------------
const API_URL = 'https://6180u0u9xf.execute-api.us-east-1.amazonaws.com/prod';


// Orders panel, a component used in admin dashboard --------------------------------------
export default function OrdersPanel() {
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [loadingOrder, setLoadingOrder] = useState(false);
    const [msg, setMessage] = useState("");

  // Load users ------------------------------------------------------------------
  async function loadOrders() {
      setMessage("");
      setLoadingOrders(true);

      const data = (await getUserOrdersReq())?.data?.orders;

      if (!data) {
          setMessage("Error loading orders.");
          setOrders([]);
      } else {
          setOrders(data);
      }

      setLoadingOrders(false);
  }

  // View single order
  async function viewOrder(orderId) {
      setMessage("");
      setLoadingOrder(true);
      setSelectedOrder(null);

      const data = (await getOrderReq(orderId))?.data?.order;

      if (!data) {
          setMessage("Error loading order.");
      } else {
          setSelectedOrder(data);
      }

      setLoadingOrder(false);
  }

    useEffect(() => {
      loadOrders();
    }, []);

    if (loadingOrders) {
        return (
        <Text 
            style={luxuryBodyStyle}>
            Loading orders...
        </Text>);
    }

    // View Orders ------------------------------------------------------
    // After user information is loaded one can click on an order and show deeper information on card to the right

    return (
      <Flex direction="row" gap="1rem" height="100%">

      {/* LEFT PANEL — ORDER LIST */}
      <Card flex="1.2" padding="1rem" backgroundColor="whitesmoke">
        <Flex direction="column" height="100%">

          <Flex justifyContent="space-between" alignItems="center">
                <Text style={luxuryHeadingStyle}>
                    Orders
                </Text>
                <Button style={luxuryBodyStyle} onClick={loadOrders}>
                    Refresh
                </Button>
          </Flex>

          {msg && (<Text color="black" style={luxuryBodyStyle} marginTop="0.5rem">
              {msg}
              </Text>
          )}

          <View overflow="auto" height="20rem" marginTop="1rem">

            {/* No Orders Message */}
              {orders.length === 0 && (
                  <Text style={luxuryBodyStyle} textAlign="center" marginTop="2rem">
                      No orders found.
                  </Text>
             )}

            {/* Orders List */}
            {orders.length > 0 && orders.map((order) => (
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
                      Order #{order.id} — ${order.total}
                </Button>
              ))}

          </View>

        </Flex>
      </Card>

      {/* RIGHT PANEL — ORDER DETAILS */}
      <Card flex="1.0" padding="1rem" backgroundColor="whitesmoke">

          <Text
              width="100%"
              textAlign="center"
              style={luxuryHeadingStyle}
            >
                Order Information
          </Text>

        {!loadingOrder && !selectedOrder && (
            <Text style={luxuryBodyStyle}>
                Please select an order
            </Text>
        )}

        {loadingOrder && (
            <Text style={luxuryBodyStyle}>
                Loading order information...
            </Text>
        )}

        {!loadingOrder && selectedOrder && (
            <Flex direction="column" gap=".5rem" marginTop="1rem">

            <Text>
                Order ID: {selectedOrder.id}
            </Text>
            <Text>
                User ID: {selectedOrder.customer_id}
            </Text>
            <Text>
                Status: {selectedOrder.status}
            </Text>
            <Text>
                Total: ${selectedOrder.total}
            </Text>
            <Text>
                Created: {new Date(selectedOrder.created_at).toLocaleString()}
            </Text>

            <Text marginTop="1rem" fontWeight="600">
                Items:
            </Text>

            {selectedOrder.items && selectedOrder.items.length === 0 && (
                <Text>
                    No items in this order.
                </Text>
            )}

            {selectedOrder.items?.map((item, index) => (
                <Text key={index}>
                  • {item.name} — {item.quantity}x — ${item.price}
                </Text>
            ))}

            <Button
              style={luxuryBodyStyle}
              marginTop="1rem"
              onClick={() => setSelectedOrder(null)}
            >
              Close Info
            </Button>

          </Flex>
        )}

      </Card>

    </Flex>
  );
}