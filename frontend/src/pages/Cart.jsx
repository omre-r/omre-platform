import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { View, Card, Flex, Text } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { fetchAuthSession } from "aws-amplify/auth";
import Navbar from "../components/Navbar";
import LuxuryBackground from "../assets/Luxury Background2.png";
import {
  getCartReq,
  deleteCartItemReq,
  createOrderReq,
  clearCartReq,
  getProductReq,
  getBlendByIdReq,
  updateCartReq,
  createCartItemReq,
  getRecommendationsReq,
  getIDToken,
} from "../requests.js";

// custom styles
const luxuryHeadingStyle = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 800,
  fontSize: "2.5rem",
  letterSpacing: "0.5px",
};

const luxuryBodyStyle = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 500,
  fontSize: "1.2rem",
  letterSpacing: "0.2px",
  color: "white",
};

const luxuryBodyStyleBlack = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 500,
  fontSize: "1.2rem",
  letterSpacing: "0.2px",
  color: "black",
};

const buttonViewStyle = {
  padding: "0.9rem 2.2rem",
  border: "1px solid rgba(255,255,255,0.35)",
  borderRadius: "28px",
  // navbar color for later reference :  #300a0a
  background: "linear-gradient(145deg,  #480e0e, rgba(20,20,20,0.9))",
  cursor: "pointer",
  boxShadow: "0 8px 18px rgba(0,0,0,0.35)",
  transition: "all 0.2s ease",
};

// components
export default function Cart() {
  const [cart, setCart] = useState([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [message, setMessage] = useState("");
  const [loadingRecommendations, setLoadingRecommendations] = useState(true); 
  const [recommendations, setRecommendations] = useState([]);

  async function getCustomerId() {
    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();
      if (!idToken) return null;

      const payload = JSON.parse(atob(idToken.split(".")[1]));
      return payload.sub;
    } catch {
      return null;
    }
  }

async function loadCart() {
  const customerid = await getCustomerId();
    if (!customerid) {
      setLoadingCart(false);
      return;
   }
    try {
      const response = await getCartReq(customerid);
      const cartRows = response?.data?.cart || [];
      if (!Array.isArray(cartRows) || cartRows.length === 0) {
        setCart([]);
      return;
    }

const fullCart = await Promise.all(
  cartRows.map(async (row) => {
    let item;

    if (row.type === "blend") {
      const blendRes = await getBlendByIdReq(row.itemid);
      const blend = blendRes?.data?.data?.blend || blendRes?.data?.blend;
      if (!blend) {
        await deleteCartItemReq(row.id);
        return null;
      }
      let price = 0;
      if (blend.size_ml === 30) price = 50;
      if (blend.size_ml === 50) price = 75;
      const frag1Res = await getProductReq(blend.frag1_productid);
      const frag2Res = await getProductReq(blend.frag2_productid);
      const frag1 = frag1Res?.data?.data?.product || frag1Res?.data?.product;
      const frag2 = frag2Res?.data?.data?.product || frag2Res?.data?.product;
      let frag3 = null;
      if (blend.frag3_productid) {
        const frag3Res = await getProductReq(blend.frag3_productid);
        frag3 = frag3Res?.data?.data?.product || frag3Res?.data?.product;
      }
      if (
        !frag1 ||
        !frag2 ||
        frag1.ishidden ||
        frag2.ishidden ||
        (frag3 && frag3.ishidden)
      ) {
        await deleteCartItemReq(row.id);
        return null;
      }
      const imageArray = frag1?.images || [];
      const name = `${frag1?.name || "Unknown"} ${blend.frag1_pct}% /
                    ${frag2?.name || "Unknown"} ${blend.frag2_pct}%${
                      frag3 ? ` / ${frag3.name} ${blend.frag3_pct}%` : ""
                    } Blend`
        .replace(/\s+/g, " ")
        .trim();
      item = {
        name,
        price,
        images: imageArray,
        size_ml: blend.size_ml,
      };

    } else {
      const productRes = await getProductReq(row.itemid);
      item = productRes?.data?.data?.product || productRes?.data?.product;
      if (!item || item.ishidden) {
        await deleteCartItemReq(row.id);
        return null;
      }
    }

    return { ...row, item };
  })
);

setCart(fullCart.filter(Boolean));
  } catch (err) {
    console.error(err);
    setMessage("Failed to load cart.");
  } finally {
    setLoadingCart(false);
  }
}
  useEffect(() => {
    loadCart();
  }, []);

async function loadRecommendations() {
        const idToken = getIDToken();
        if (!idToken || !idToken?.sub){
            setLoadingRecommendations(false);
            return;
        }
        setLoadingRecommendations(true);
        const data = await getRecommendationsReq(idToken.sub);
        setLoadingRecommendations(false);
        setRecommendations(data?.data?.recommendations || []);
    }

  useEffect(() => {
    loadRecommendations();
  }, []);

  async function removeItem(id) {
    try {
      await deleteCartItemReq(id);
      await loadCart();
    } catch (err) {
      console.error(err);
      setMessage("Failed to remove item.");
    }
  }
  async function increaseQuantity(id) {
    const customerid = await getCustomerId();
    if (!customerid) return;
    const targetItem = cart.find(item => item.id === id);
    if (targetItem.quantity >= 10) {
      setMessage("Maximum quantity per item is 10.");
      return;
    }
    const updatedCart = cart.map(item =>
      item.id === id
        ? { ...item, quantity: item.quantity + 1 }
        : item
    );
    setCart(updatedCart);
    await updateCartReq(
      customerid,
      updatedCart.map(item => ({
        itemid: item.itemid,
        quantity: item.quantity,
        type: item.type
      }))
    );
  }

  async function decreaseQuantity(id) {
  const customerid = await getCustomerId();
  if (!customerid) return;

  const updatedCart = cart
    .map(item =>
      item.id === id
        ? { ...item, quantity: item.quantity - 1 }
        : item
    )
    .filter(item => item.quantity > 0);
  setCart(updatedCart);
  await updateCartReq(
    customerid,
    updatedCart.map(item => ({
    itemid: item.itemid,
    quantity: item.quantity,
    type: item.type
  }))
  );
}

async function checkout() {
  const customerid = await getCustomerId();
  if (!customerid) return;

  if (cart.length === 0) {
    setMessage("Your cart is empty.");
    return;
  }

  try {
    const response = await createOrderReq({ customerid });
    if (!response?.success) {
      const backendMessage = response?.message || "";
      if (backendMessage.includes("Failed to decrease product stock")) {
        setMessage("Product out of stock.");
      } 
      else {
        setMessage(backendMessage || "Checkout failed.");
      }
      return;
    }
    await clearCartReq(customerid);

    setCart([]);
    setMessage("Order placed successfully!");
  } catch (err) {
    console.error(err);
    setMessage("Checkout failed.");
  }
}

  const total = cart.reduce(
    (sum, item) => sum + ((item.item?.price || 0) * item.quantity),
    0
  );

  return (
    <>
      <Navbar />

      <View
        width="100%"
        minHeight="100vh"
        paddingTop="3rem"
        paddingLeft="3rem"
        paddingRight="3rem"
        paddingBottom="3rem"
        style={{
          backgroundImage: `url(${LuxuryBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "repeat",
        }}
      >
        <Text style={luxuryHeadingStyle} marginBottom="2rem">
          Your Cart
        </Text>

        {loadingCart && (
          <Text style={luxuryBodyStyleBlack}>Loading cart...</Text>
        )}

        {!loadingCart && cart.length === 0 && (
          <Flex direction="column" alignItems="center" gap="1rem">
            <Text style={luxuryBodyStyleBlack}>Your cart is empty.</Text>
            <Link to="/fragrances" style={{ textDecoration: "none" }}>
              <View style={buttonViewStyle}>
                <Text style={luxuryBodyStyle}>Shop All</Text>
              </View>
            </Link>
          </Flex>
        )}

        {!loadingCart && cart.length > 0 && (
          <Flex alignItems="flex-start" gap="3rem">

            {/* LEFT 67% */}
            <View width="67%">
              {cart.map((cartItem) => (
                // BUG: Weird background issues when using backgroundColor on a card like this.
                //  Had to set the background to nearly transparent and change the styling background
                <Card
                  key={cartItem.id}
                  marginBottom="1.5rem"
                  borderRadius="24px"
                  padding="1.6rem"
                  border="1px solid rgba(255,255,255,0.18)"
                  boxShadow="0 12px 28px rgba(0,0,0,0.18)"
                  backgroundColor="rgba(255, 255, 255, 0.1)"
                  style={{
                    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.35), rgba(187, 187, 187, 0.05))"
                  }}
                >
                  <Flex justifyContent="space-between" alignItems="center">
                    <Flex alignItems="center" gap="1.5rem">
                      {cartItem.item?.images?.[0] && (
                        <img
                          src={cartItem.item.images[0]}
                          alt={cartItem.item.name}
                          style={{
                            width: "120px",
                            height: "120px",
                            objectFit: "cover",
                            borderRadius: "20px",
                            background: "linear-gradient(145deg, rgba(45,20,20,0.95), rgba(15,15,15,0.95))",
                            padding: "2px",
                            boxShadow: "0 6px 14px rgba(0,0,0,0.22)",
                            border: "1px solid rgba(255,255,255,0.08)",
                          }}
                        />
                      )}

                    <View textAlign={"left"}>
                        <Text style={{...luxuryBodyStyle, color: "black"}}>
                        {cartItem.item?.name}{" "}
                        {cartItem.item?.variation 
                          ? `(${cartItem.item.variation})` 
                          : cartItem.item?.size_ml 
                          ? `(${cartItem.item.size_ml}ml)` 
                          : ""}
                      </Text>
                      <Text style={{...luxuryBodyStyle, color: "black"}}>
                        Quantity: {cartItem.quantity}
                      </Text>
                      <Text style={{...luxuryBodyStyle, color: "black"}}>
                     ${cartItem.item?.price}
                     </Text>
                    </View>
                    </Flex>
                    <Flex gap="3rem">
                      <View
                        style={buttonViewStyle}
                        onClick={() => decreaseQuantity(cartItem.id)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform="translateY(-5px)";
                          e.currentTarget.style.boxShadow="0 12px 24px rgba(0,0,0,0.45)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform="translateY(0px)";
                          e.currentTarget.style.boxShadow="0 8px 18px rgba(0,0,0,0.35)";
                        }} 
                      >
                        <Text style={{...luxuryBodyStyle, fontWeight: 200, fontSize: "1.5rem", fontFamily: "Arial, sans-serif",}}>−</Text>
                      </View>

                      <View
                        style={{
                          ...buttonViewStyle,
                          opacity: cartItem.quantity >= 10 ? 0.4 : 1,
                          cursor: cartItem.quantity >= 10 ? "not-allowed" : "pointer"
                        }}
                        onClick={() => {
                          if (cartItem.quantity < 10) {
                            increaseQuantity(cartItem.id);
                          }
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform="translateY(-5px)";
                          e.currentTarget.style.boxShadow="0 12px 24px rgba(0,0,0,0.45)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform="translateY(0px)";
                          e.currentTarget.style.boxShadow="0 8px 18px rgba(0,0,0,0.35)";
                        }} 
                      >
                        <Text style={{...luxuryBodyStyle, fontWeight: 200, fontSize: "1.5rem", fontFamily: "Arial, sans-serif",}}>+</Text>
                      </View>

                    </Flex>
                  </Flex>
                </Card>
              ))}
            </View>

            {/* RIGHT 33% */}
            <View 
              width="33%" 
              backgroundColor="rgba(255,255,255,0.18)"
              border="1px solid rgba(60, 20, 20, 0.15)"
              borderRadius="24px"
              padding="2rem"
              boxShadow="0 10px 30px rgba(0,0,0,0.10)"
              backdropFilter="blur(2px)">
              <Text style={luxuryHeadingStyle} marginBottom="2rem">
                Order Summary
              </Text>

              {/* Each item mapped above the total -------------------------------------- */}
              {cart.map((cartItem) => (
                <Flex
                  key={cartItem.id}
                  background="linear-gradient(135deg, rgba(40,40,40,0.78), rgba(85,85,85,0.68))"
                  borderRadius="24px"
                  padding="1.75rem"
                  border="1px solid rgba(255,255,255,0.10)"
                  boxShadow="0 12px 28px rgba(0,0,0,0.20)"
                  justifyContent="space-between"
                  marginBottom="1rem"
                >
                  <Text style={{...luxuryBodyStyleBlack, textAlign: "left",}}>
                    {cartItem.item?.name}{" "}
                    {cartItem.item?.variation 
                      ? `(${cartItem.item.variation})` 
                      : cartItem.item?.size_ml 
                      ? `(${cartItem.item.size_ml}ml)` 
                      : ""} × {cartItem.quantity}
                  </Text>
                  <Text style={{...luxuryBodyStyleBlack, fontWeight:"800", fontSize:"1.5rem"}}>
                    ${((cartItem.item?.price || 0) * cartItem.quantity).toFixed(2)}
                  </Text>
                </Flex>
              ))}
              {/* Line above the total */}
              <View
                marginTop="3rem"
                marginBottom="-2rem"
                style={{
                  width: "100%",
                  height: "2px",
                  background: "linear-gradient(to right, rgba(60,20,20,0.05), rgba(60,20,20,0.22), rgba(60,20,20,0.05))",
                  borderRadius: "999px"
                }}
              />
              <Flex 
                justifyContent="space-between"
                alignItems="center"
                marginTop="2rem"
                paddingTop="1.5rem"
                borderTop="2px solid rgba(60, 20, 20, 0.18)">
                <Text style={luxuryHeadingStyle}>Total</Text>
                <Text style={luxuryHeadingStyle}>
                  ${total.toFixed(2)}
                </Text>
              </Flex>

              <Flex justifyContent="center" marginTop="2rem">
                <View 
                    style={buttonViewStyle}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform="translateY(-5px)";
                      e.currentTarget.style.boxShadow="0 12px 24px rgba(0,0,0,0.45)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform="translateY(0px)";
                      e.currentTarget.style.boxShadow="0 8px 18px rgba(0,0,0,0.35)";
                    }} 
                    onClick={checkout}>
                  <Text style={luxuryBodyStyle}>Checkout</Text>
                </View>
              </Flex>
            </View>

          </Flex>
        )}
        {message && (
          <Text
              style={{
                  ...luxuryBodyStyle,
                  color: message === "Order placed successfully!" ? "#2d6a2d" : "#8B0000",
                  textAlign: "center",
                  marginTop: "2.3rem",
                  fontSize: "1.6rem"
              }}>
              {message}
          </Text>
        )}
        <View
          marginTop="4rem"
          padding="2.5rem 2rem"
          borderRadius="28px"
          backgroundColor="rgba(255,255,255,0.10)"
          border="1px solid rgba(80, 50, 40, 0.10)"
          boxShadow="0 10px 28px rgba(0,0,0,0.08)"
          backdropFilter="blur(2px)">
            <Text style={luxuryHeadingStyle} marginBottom=".5rem">
            You May Also Like
            </Text>
            <Flex 
                wrap="wrap"
                justifyContent="center">
                {recommendations.map((prod) => (
                    <Card
                      key={prod.id}
                      variation="elevated"
                      width="13.5rem"
                      padding="1rem"
                      backgroundColor="rgba(35, 22, 22, 0.88)"
                      border="1px solid rgba(190, 160, 150, 0.18)"
                      borderRadius="20px"
                      boxShadow="0 14px 28px rgba(0,0,0,0.22)"
                      style={{
                        background: "linear-gradient(145deg,  #480e0ee2, rgba(20, 20, 20, 0.65))",
                      }}>
                    <Link 
                      to={`/fragrances/${prod.parentid}?variation=${prod.variation}`}
                      style={{ textDecoration: "none" }}
                    >
                        <img
                            src={prod.images?.[0]}
                            alt={prod.name}
                            style={{
                                width: "100%",
                                objectFit: "cover",
                                borderRadius: "10px",
                                display: "block",
                                alignContent: "center",
                            }}
                        />
                        <Text style={{...luxuryBodyStyle, fontSize: ".95rem"}} textAlign="center">
                        {prod.name}
                        </Text>
                        <Text
                        style={{ ...luxuryBodyStyle, fontSize: ".95rem", fontWeight: 600 }}
                        textAlign="center"
                        >
                        ${prod.price}
                        </Text>
                    </Link>
                    </Card>
                ))}
            </Flex>
        </View>
      </View>
    </>
  );
}