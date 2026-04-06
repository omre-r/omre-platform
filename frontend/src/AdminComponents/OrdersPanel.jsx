import { useEffect, useState } from "react";
import { Card, Flex, Text, Button, View, SelectField, TextField } from "@aws-amplify/ui-react";
import { fetchAuthSession } from "aws-amplify/auth";
import { getOrdersReq, getOrderReq, cancelOrderReq, getFilteredOrdersReq, updateOrderStatusReq } from "../requests";
import { RefreshCw } from "lucide-react";

import SearchIcon from "../assets/search_icon.png";
import { useToast } from "../components/ToastContext";

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
  color: "#FFFFFF"
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

const statusStyles = {
  pending: "#ff6117",
  mixing: "#d3006d",
  ready: "#028fb2",
  fulfilled: "#009e59",
  canceled: "#e22424",
};

// ---------------- COMPONENT ----------------
export default function OrdersPanel() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [status, setStatus] = useState("");
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const { toast } = useToast();
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
      toast(error.message || "Error loading orders.", "error");
    } finally {
      setLoadingOrders(false);
    }
  }

  async function viewOrder(orderId) {
    setLoadingOrder(true);
    setSelectedOrder(null);
    
    setCancelReason("");
    setConfirmCancel(false);

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
      toast(error.message || "Error loading order.", "error");
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
      toast("Please enter a cancellation reason.", "error");
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
            overflow: "visible", 
            zIndex: 20,  
          }}
        >
          <Flex direction="column">

            {/* HEADER */}
            <Flex justifyContent="space-between" alignItems="center">
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

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    ...luxuryBodyStyle,
                    fontSize: "1.2rem",
                    padding: "0.7rem 1.2rem",
                    border: "2px solid rgba(0, 0, 0)",
                    borderRadius: "10px",
                    background: "linear-gradient(145deg, rgba(90, 20, 20, 0.92), rgba(40, 35, 35, 0.82))",
                    color: "#FFFFFF",
                    cursor: "pointer",
                    boxShadow: "0 6px 14px rgba(0,0,0,0.22)",
                    outline: "none",
                  }}
                >
                  {["all","pending","mixing","ready","fulfilled","canceled"].map(val => (
                    <option
                      key={val}
                      value={val}
                      style={{ backgroundColor: "#2b1a1a", color: "#FFFFFF" }}
                    >
                      {val.charAt(0).toUpperCase() + val.slice(1)}
                    </option>
                  ))}
              </select>

                <View
                  onClick={loadOrders}
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "10px",
                    border: "2px solid black",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    background: "linear-gradient(145deg, rgba(90, 20, 20, 0.92), rgba(40, 35, 35, 0.82))",
                  }}
                >
                  <RefreshCw color="white" size={22} />
                </View>
              </Flex>
            </Flex>
            {/* LIST */}
            <View
              className="orders-scroll"
              style={{
                overflowY: "auto",
                marginTop: "1rem",
                height: "37rem",
                paddingLeft: "0.6rem",  
                paddingRight: "0.6rem",
                paddingTop: "0.2rem",
                paddingBottom: "0.6rem",
              }}
            >
              <Flex wrap="wrap" gap="0.6rem">
                {orders
                  .filter(o => statusFilter === "all" || o.status === statusFilter)
                  .map(order => (
                    <View key={order.id} style={{ flex: "0 0 48%" }}>
                      <Button
                        onClick={() => viewOrder(order.id)}
                        style={{
                          ...buttonStyling,
                          width: "100%",  
                          height: "60px",
                          justifyContent: "flex-start",
                          borderRadius: "10px",
                          border: selectedOrder?.id === order.id
                            ? "2px solid gold"
                            : "2px solid black",
                          boxShadow: selectedOrder?.id === order.id
                            ? "0 0 12px gold"
                            : buttonStyling.boxShadow,
                          transform: selectedOrder?.id === order.id
                            ? "scale(1.02)"
                            : "scale(1)",
                          background: `linear-gradient(145deg, ${
                            statusStyles[order.status?.toLowerCase()] || "#444"
                          }, rgba(20,20,20,0.92))`,
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          paddingLeft: "12px",
                          paddingRight: "12px",
                        }}
                      >
                        <Text
                          style={{
                            ...luxuryBodyStyle,
                            color: "#ffffff",
                            fontWeight: 600,
                            flex: 1,  
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                          }}
                        >
                          Order #{order.id.slice(0, 8)} — {order.status}
                        </Text>
                      </Button>
                    </View>
                  ))}
              </Flex>
            </View>
          </Flex>
        </Card>

        {/* RIGHT CARD */}
        <Card
          flex="1.0" 
          height="100%" 
          padding="1rem" 
          position={"relative"}
          style={{
              background: "linear-gradient(145deg, rgba(255, 240, 235, 0.35), rgba(245, 225, 218, 0.28))",
              backdropFilter: "blur(6px)",
              border: "1px solid rgba(120, 80, 70, 0.18)",
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
              <Flex direction="column" gap="0.5rem" marginTop="1rem" >

                <View style={{
                  background: `linear-gradient(145deg, ${
                    statusStyles[selectedOrder.status?.toLowerCase()] || "#444"
                  }, rgba(20,20,20,0.9))`,
                  padding: "10px",
                  borderRadius: "20px",
                  border: "2px solid black",
                  textAlign: "left"
                }}>
                  <Text style={{...luxuryBodyStyle, color:"#FFFFFF"}}>Email: {selectedOrder.email}</Text>
                  <Text style={{...luxuryBodyStyle, color:"#FFFFFF"}}>Status: {selectedOrder.status}</Text>
                  <Text style={{...luxuryBodyStyle, color:"#FFFFFF"}}>Total: ${selectedOrder.total}</Text>
                </View>
                {/* ITEMS SECTION */}
                <View
                  style={{
                    background: "linear-gradient(145deg, rgba(90, 20, 20, 0.92), rgba(40, 35, 35, 0.82))",
                    padding: "12px",
                    borderRadius: "20px",
                    border: "2px solid black",
                    textAlign: "left"
                  }}
                >
                  <Text
                    style={{
                      ...luxuryBodyStyle,
                      color: "#FFFFFF",
                      fontWeight: "700",
                      marginBottom: "6px"
                    }}
                  >
                    Items
                  </Text>
                  <View
                    style={{
                      maxHeight: "200px",   
                      overflowY: "auto",
                      paddingRight: "6px"   
                    }}
                  >
                    {selectedOrder.items?.map((orderItem, i) => {
                      if (orderItem.type === "product") {
                        return (
                          <Text key={i} style={{ ...luxuryBodyStyle, color: "#FFFFFF" }}>
                            {orderItem.item?.name} x{orderItem.quantity}
                          </Text>
                        );
                      }

                      if (orderItem.type === "blend") {
                        const blend = orderItem.item;

                        return (
                          <View key={i} style={{ marginTop: "6px" }}>
                            <Text style={{ ...luxuryBodyStyle, color: "#FFFFFF" }}>
                              Custom Blend – {blend.size_ml}ml x{orderItem.quantity}
                            </Text>

                            {blend.frag1_productid && (
                              <Text style={{ ...luxuryBodyStyle, color: "#FFFFFF", marginLeft: "10px" }}>
                                • {blend.frag1_pct}% {blend.frag1_name || "Unknown Fragrance"}
                              </Text>
                            )}

                            {blend.frag2_productid && (
                              <Text style={{ ...luxuryBodyStyle, color: "#FFFFFF", marginLeft: "10px" }}>
                                • {blend.frag2_pct}% {blend.frag2_name || "Unknown Fragrance"}
                              </Text>
                            )}

                            {blend.frag3_productid && (
                              <Text style={{ ...luxuryBodyStyle, color: "#FFFFFF", marginLeft: "10px" }}>
                                • {blend.frag3_pct}% {blend.frag3_name || "Unknown Fragrance"}
                              </Text>
                            )}
                          </View>
                        );
                      }

                      return null;
                    })}
                  </View>
                </View>

                {/*STATUS*/}
                <Flex
                  direction="row"
                  alignItems="center"
                  gap="0.5rem"
                  width="100%"
                  marginTop="0.5rem"
                >
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={{
                      ...luxuryBodyStyle,
                      fontSize: "1.2rem",
                      padding: "0 1.2rem",        
                      border: "2px solid rgba(0, 0, 0)",
                      borderRadius: "10px",
                      background: "linear-gradient(145deg, rgba(90, 20, 20, 0.92), rgba(40, 35, 35, 0.82))",
                      color: "#FFFFFF",
                      cursor: "pointer",
                      boxShadow: "0 6px 14px rgba(0,0,0,0.22)",
                      outline: "none",
                      height: "45px",
                      lineHeight: "45px",     
                      flex: "1"
                    }}
                  >
                    {["pending","mixing","ready","fulfilled"].map(val => (
                      <option
                        key={val}
                        value={val}
                        style={{ backgroundColor: "#2b1a1a", color: "#FFFFFF" }}
                      >
                        {val.charAt(0).toUpperCase() + val.slice(1)}
                      </option>
                    ))}
                  </select>

                  <Button
                    onClick={updateStatus}
                    style={{
                      ...buttonStyling,
                      marginTop: "1px",
                      height: "45px",
                      minWidth: "150px",
                      borderRadius: "10px",
                      border: "2px solid black",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ ...luxuryBodyStyle, color: "#FFFFFF" }}>
                      Update
                    </Text>
                  </Button>
                </Flex>


                {/*CANCEL*/}
                <Flex
                  direction="row"
                  alignItems="center"
                  gap="0.5rem"
                  width="100%"
                  marginTop="0.5rem"
                  marginBottom="0.5rem"
                >
                  <TextField
                    placeholder="Cancel reason..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    flex="1"
                    style={{ height: "45px" }}
                  />

                  <View
                    onClick={() => {
                      if (!selectedOrder || selectedOrder.status === "canceled") return;
                      setConfirmCancel(true);
                    }}
                    style={{
                      ...buttonStyling,
                      marginTop: "8px",
                      height: "45px",
                      minWidth: "150px",
                      borderRadius: "10px",

                      color: selectedOrder && selectedOrder.status !== "canceled" ? "#ffffff" : "#999",

                      border: selectedOrder && selectedOrder.status !== "canceled"
                        ? "2px solid #8f0000"
                        : "2px solid #808080",

                      background: selectedOrder && selectedOrder.status !== "canceled"
                        ? "linear-gradient(145deg, #e22424, rgba(20,20,20,0.92))"
                        : "linear-gradient(145deg, #9f9f9f, rgba(20,20,20,0.92))",

                      cursor: selectedOrder && selectedOrder.status !== "canceled"
                        ? "pointer"
                        : "not-allowed",

                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Cancel
                  </View>
                </Flex>

                {confirmCancel && (
                  <Card
                    style={{
                      marginTop: "1rem",
                      background: "linear-gradient(145deg, rgba(90,20,20,0.92), rgba(40,35,35,0.82))",
                      border: "2px solid black",
                      borderRadius: "20px"
                    }}
                  >
                    <Text style={{ ...luxuryBodyStyle, color: "#fff" }}>
                      Are you sure you want to cancel this order?
                    </Text>

                    <Flex gap="0.75rem" marginTop="0.75rem" justifyContent="center">
                      <Button style={buttonStyling} onClick={() => cancelOrder(selectedOrder.id)}>
                        <Text style={{ color: "#fff" }}>Yes</Text>
                      </Button>

                      <Button style={buttonStyling} onClick={() => {
                        setConfirmCancel(false);
                        
                      }}>
                        <Text style={{ color: "#fff" }}>No</Text>
                      </Button>
                    </Flex>
                  </Card>
                )}

                <Button style={buttonStyling} onClick={() => {setSelectedOrder(null); setConfirmCancel(false);}}>
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