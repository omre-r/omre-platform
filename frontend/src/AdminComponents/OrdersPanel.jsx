import { useEffect, useState } from "react";
import { Card, Flex, Text, Button, View, SelectField, TextField } from "@aws-amplify/ui-react";
import { fetchAuthSession } from "aws-amplify/auth";
import { getOrdersReq, getOrderReq, cancelOrderReq, getFilteredOrdersReq, updateOrderStatusReq } from "../requests";

import SearchIcon from "../assets/search_icon.png";

// ---------------- STYLES ----------------
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

const buttonStyling = {
    ...luxuryBodyStyle, 
    fontSize: "1.2rem",
    padding: "0.5rem 1.2rem",
    border: "2px solid rgba(0, 0, 0)",
    borderRadius: "28px",
    background: "linear-gradient(145deg, rgba(90, 20, 20, 0.92), rgba(40, 35, 35, 0.82))",
    color: "#FFFFFF",
    cursor: "pointer",
    boxShadow: "0 6px 14px rgba(0,0,0,0.22)",
    transition: "all 0.2s ease",
}

const getStatusColor = (status) => {
  if (status === "fulfilled") return "#00ff91";
  if (status === "pending") return "#ffd000";
  if (status === "canceled") return "#ff4d4d";
  return "#ffffff";
};

// ---------------- COMPONENT ----------------
export default function OrdersPanel() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [status, setStatus] = useState("");
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [msg, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cancelReason, setCancelReason] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);

  const [emailSearch, setEmailSearch] = useState("");

  async function getToken() {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.accessToken?.toString();
    } catch {
      return null;
    }
  }

  async function loadOrders() {
    setLoadingOrders(true);
    try {
      const data = await getOrdersReq();
      setOrders(data?.data?.orders || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoadingOrders(false);
    }
  }

  async function viewOrder(orderId) {
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
      setMessage(error.message);
    } finally {
      setLoadingOrder(false);
    }
  }

  async function updateStatus() {
    if (!selectedOrder) return;
    const token = await getToken();
    await updateOrderStatusReq(selectedOrder.id, status, token);
    await viewOrder(selectedOrder.id);
    await loadOrders();
  }

  async function cancelOrder(orderId) {
    if (!cancelReason) {
      setMessage("Please enter a cancellation reason.");
      return;
    }

    const token = await getToken();
    await cancelOrderReq(orderId, cancelReason, token);
    setSelectedOrder(null);
    setCancelReason("");
    loadOrders();
  }

  useEffect(() => {
    loadOrders();
  }, []);

  if (loadingOrders) {
    return <Text style={{ ...luxuryBodyStyle, color: "white" }}>Loading orders...</Text>;
  }

  return (
    <Flex direction="column" height="100%">
      <Flex direction="row" gap="1rem" flex="1">

        {/* LEFT CARD */}
        <Card
          flex="1.2"
          padding="1rem"
          style={{
            background: "linear-gradient(145deg, rgba(255, 240, 235, 0.35), rgba(245, 225, 218, 0.28))",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(120, 80, 70, 0.18)",
            borderRadius: "22px",
          }}
        >
          <Flex direction="column">

            {/* HEADER */}
            <Flex justifyContent="space-between" alignItems="center">
              <Text style={{
                padding: ".5rem",
                border: "2px solid black",
                borderRadius: "10px",
                background: "linear-gradient(145deg, #480e0e, rgba(20,20,20,0.9))",
              }}>
                <Text style={{ ...luxuryBodyStyle, fontSize: "2rem", color: "#fff" }}>
                  Orders
                </Text>
              </Text>

              <Flex gap="10px" alignItems="center">

                {/* SEARCH */}
                <Flex  
                  padding={"10px"}    
                  alignItems={"center"}
                  justifyContent={"center"}
                  gap={"6px"}
                  style={{ zIndex: "1000", background: "#ffffff00" }}
                >

                  <View position={"relative"}>
                    <input
                      type="text"
                      value={emailSearch}
                      onChange={e => setEmailSearch(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key !== "Enter") return;
                        const res = await getFilteredOrdersReq({ email: emailSearch });
                        setOrders(res.data.orders);
                      }}
                      style={{
                        width: "300px",
                        height: "50px",
                        paddingLeft: "18px",
                        paddingRight: "42px",
                        borderRadius: "8px",
                        border: "2px solid rgba(0, 0, 0)",
                        background: "linear-gradient(145deg, rgba(90, 20, 20, 0.92), rgba(40, 35, 35, 0.82))",
                        color: "#FFFFFF",
                        caretColor: "#FFFFFF",
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: "1.3rem",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />

                    {/* Fake placeholder (same as ProductsPanel) */}
                    {!emailSearch && (
                      <Text
                        style={{
                          position: "absolute",
                          left: "18px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "white",
                          pointerEvents: "none",
                          fontFamily: "'Cormorant Garamond', serif",
                          fontSize: "1.3rem",
                        }}
                      >
                        Find orders by email...
                      </Text>
                    )}

                    {/* Search icon */}
                    <section
                      style={{
                        display: "flex",
                        width: "30px",
                        paddingRight: "5px",
                        overflow: "hidden",
                        position: "absolute",
                        right: "0",
                        top: "50%",
                        transform: "translateY(-50%)",
                        cursor: "pointer",
                      }}
                      onClick={async () => {
                        const res = await getFilteredOrdersReq({ email: emailSearch });
                        setOrders(res.data.orders);
                      }}
                    >
                      <img
                        src={SearchIcon}
                        alt="search"
                        style={{
                          width: "20px",
                          height: "20px",
                          filter: "brightness(0) invert(1)",
                        }}
                      />
                    </section>
                  </View>

                </Flex>

                <SelectField value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="mixing">Mixing</option>
                  <option value="ready">Ready</option>
                  <option value="fulfilled">Fulfilled</option>
                  <option value="canceled">Canceled</option>
                </SelectField>

                <Button style={buttonStyling} onClick={loadOrders} >
                  <Text style={{...luxuryBodyStyle, color:"#FFFFFF"}}>
                    Refresh
                  </Text>
                </Button>
              </Flex>
            </Flex>

            {msg && <Text>{msg}</Text>}

            {/* LIST */}
            <View style={{ overflowY: "auto", marginTop: "1rem", height: "25rem" }}>
              {orders
                .filter(o => statusFilter === "all" || o.status === statusFilter)
                .map(order => (
                  <Button
                    key={order.id}
                    style={buttonStyling}
                    onClick={() => viewOrder(order.id)}
                    width="100%"
                    justifyContent="flex-start"
                    marginBottom=".6rem"
                  >
                    <Text style={{
                      ...luxuryBodyStyle,
                      color: getStatusColor(order.status),
                      fontWeight: "600"
                    }}>
                      Order #{order.id.slice(0, 8)} — {order.status}
                    </Text>
                  </Button>
                ))}
            </View>
          </Flex>
        </Card>

        {/* RIGHT CARD */}
        <Card
          flex="1"
          padding="1rem"
          style={{
            background: "linear-gradient(145deg, rgba(255, 240, 235, 0.35), rgba(245, 225, 218, 0.28))",
            backdropFilter: "blur(6px)",
            borderRadius: "22px",
          }}
        >
          <Flex direction="column">

            <Flex justifyContent="center">
              <Flex
                alignItems="center"
                justifyContent="center"
                style={{
                  padding: ".5rem .5rem",
                  border: "2px solid rgba(0, 0, 0)",
                  borderRadius: "10px",
                  background: "linear-gradient(145deg, rgba(90, 20, 20, 0.92), rgba(40, 35, 35, 0.82))",
                  width: "fit-content",
                  margin: "0 auto",
                }}
              >
                <Text style={{ ...luxuryHeadingStyle, fontSize: "2.2rem", color: "#FFFFFF" }}>
                  Order Information
                </Text>
              </Flex>
            </Flex>

            {!selectedOrder && !loadingOrder && (
  <View
    style={{
      borderRadius: "24px",
      background: "linear-gradient(145deg, rgba(90, 20, 20, 0.92), rgba(40, 35, 35, 0.82))",
      padding: "0.5rem 0.5rem",
      border: "2px solid rgba(0,0,0,0.5)",
      width: "fit-content",
      margin: "1rem auto",
    }}
  >
    <Text style={{ ...luxuryBodyStyle, color: "white" }}>Please select an order</Text>
  </View>
)}

{loadingOrder && (
  <View
    style={{
      borderRadius: "24px",
      background: "linear-gradient(145deg, rgba(90, 20, 20, 0.92), rgba(40, 35, 35, 0.82))",
      padding: "0.5rem 0.5rem",
      border: "2px solid rgba(0,0,0,0.5)",
      width: "fit-content",
      margin: "1rem auto",
    }}
  >
    <Text style={{ ...luxuryBodyStyle, color: "white" }}>Loading order information...</Text>
  </View>
)}

            {selectedOrder && (
              <Flex direction="column" gap="0.5rem" marginTop="1rem">

                <View style={{
                  background: "linear-gradient(145deg, rgba(90,20,20,0.92), rgba(40,35,35,0.82))",
                  padding: "10px",
                  borderRadius: "20px",
                  border: "2px solid black"
                }}>
                  <Text style={{...luxuryBodyStyle, color:"#FFFFFF"}}>Email: {selectedOrder.email}</Text>
                  <Text style={{...luxuryBodyStyle, color:"#FFFFFF"}}>Status: {selectedOrder.status}</Text>
                  <Text style={{...luxuryBodyStyle, color:"#FFFFFF"}}>Total: ${selectedOrder.total}</Text>
                </View>

                {/* UPDATE */}
                <SelectField value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="mixing">Mixing</option>
                  <option value="ready">Ready</option>
                  <option value="fulfilled">Fulfilled</option>
                </SelectField>

                <Button style={buttonStyling} onClick={updateStatus}>
                  <Text style={{...luxuryBodyStyle, color:"#FFFFFF"}}>
                    Update Status
                  </Text>
                </Button>

                {/* CANCEL */}
                <TextField
                  placeholder="Cancel reason..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />

                <View
                  position={"relative"}
                  padding="9.5px"
                  borderRadius={"10px"}
                  onClick={() => {
                    if (!selectedOrder || selectedOrder.status === "canceled") return;
                    setConfirmCancel(true);
                  }}
                  style={{
                    ...buttonStyling,
                    color: selectedOrder && selectedOrder.status !== "canceled" ? "#ff2600" : "#999",
                    WebkitTextFillColor: selectedOrder && selectedOrder.status !== "canceled" ? "#ff2600" : "#999",
                    border: "2px solid rgba(0, 0, 0)",
                    background:
                      selectedOrder && selectedOrder.status !== "canceled"
                        ? "linear-gradient(145deg, rgba(90, 20, 20, 0.92), rgba(40, 35, 35, 0.82))"
                        : "linear-gradient(145deg, #888, #555)",
                    cursor:
                      selectedOrder && selectedOrder.status !== "canceled"
                        ? "pointer"
                        : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  Cancel Order
                </View>

                {confirmCancel && (
                  <Card>
                    <Text>Are you sure?</Text>
                    <Button onClick={() => cancelOrder(selectedOrder.id)}>Yes</Button>
                    <Button onClick={() => setConfirmCancel(false)}>No</Button>
                  </Card>
                )}

                <Button style={buttonStyling} onClick={() => setSelectedOrder(null)}>
                  <Text style={{...luxuryBodyStyle, color:"#FFFFFF"}}>
                    Close Info
                  </Text>
                </Button>

              </Flex>
            )}
          </Flex>
        </Card>

      </Flex>
    </Flex>
  );
}