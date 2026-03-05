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
  padding: "0.75rem 1.75rem",
  border: "1px solid rgba(255,255,255,0.5)",
  borderRadius: "25px",
  backgroundColor: "rgba(0,0,0,0.5)",
  cursor: "pointer",
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
      if (!blend) return { ...row, item: null };

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

      const imageArray = frag1?.images || [];
      const name = `${frag1?.name || "Unknown"} ${blend.frag1_pct}% / 
                    ${frag2?.name || "Unknown"} ${blend.frag2_pct}%${
                      frag3 ? ` / ${frag3.name} ${blend.frag3_pct}%` : ""
                    } Blend`.replace(/\s+/g, " ").trim();

      item = {
        name,
        price,
        images: imageArray,
        size_ml: blend.size_ml,
      };
    } else {
      const productRes = await getProductReq(row.itemid);
      item = productRes?.data?.data?.product || productRes?.data?.product;
    }

    return { ...row, item };
  })
);

    setCart(fullCart);
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
      setMessage("Checkout failed.");
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
          <Flex justifyContent="center">
            <Link to="/fragrances">
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
                <Card
                  key={cartItem.id}
                  marginBottom="1.5rem"
                  backgroundColor="rgba(0,0,0,0.6)"
                  borderRadius="20px"
                  padding="1.5rem"
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
                            borderRadius: "10px",
                          }}
                        />
                      )}

                    <View textAlign={"left"}>
                        <Text style={luxuryBodyStyle}>
                        {cartItem.item?.name}{" "}
                        {cartItem.item?.variation 
                          ? `(${cartItem.item.variation})` 
                          : cartItem.item?.size_ml 
                          ? `(${cartItem.item.size_ml}ml)` 
                          : ""}
                      </Text>
                      <Text style={luxuryBodyStyle}>
                        Quantity: {cartItem.quantity}
                      </Text>
                      <Text style={luxuryBodyStyle}>
                     ${cartItem.item?.price}
                     </Text>
                    </View>
                    </Flex>

                    <Flex gap="1rem">
                      <View
                        style={buttonViewStyle}
                        onClick={() => decreaseQuantity(cartItem.id)}
                      >
                        <Text style={luxuryBodyStyle}>-</Text>
                      </View>

                      <View
                        style={buttonViewStyle}
                        onClick={() => increaseQuantity(cartItem.id)}
                      >
                        <Text style={luxuryBodyStyle}>+</Text>
                      </View>
                    </Flex>
                  </Flex>
                </Card>
              ))}
            </View>

            {/* RIGHT 33% */}
            <View width="33%">
              <Text style={luxuryHeadingStyle} marginBottom="2rem">
                Order Summary
              </Text>

              {cart.map((cartItem) => (
                <Flex
                  key={cartItem.id}
                  justifyContent="space-between"
                  marginBottom="1rem"
                >
                  <Text style={luxuryBodyStyleBlack}>
                    {cartItem.item?.name}{" "}
                    {cartItem.item?.variation 
                      ? `(${cartItem.item.variation})` 
                      : cartItem.item?.size_ml 
                      ? `(${cartItem.item.size_ml}ml)` 
                      : ""} × {cartItem.quantity}
                  </Text>
                  <Text style={luxuryBodyStyleBlack}>
                    ${((cartItem.item?.price || 0) * cartItem.quantity).toFixed(2)}
                  </Text>
                </Flex>
              ))}

              <Flex justifyContent="space-between" marginTop="2rem">
                <Text style={luxuryHeadingStyle}>Total</Text>
                <Text style={luxuryHeadingStyle}>
                  ${total.toFixed(2)}
                </Text>
              </Flex>

              <Flex justifyContent="center" marginTop="2rem">
                <View style={buttonViewStyle} onClick={checkout}>
                  <Text style={luxuryBodyStyle}>Checkout</Text>
                </View>
              </Flex>
            </View>

          </Flex>
        )}
        {message && (
          <Text
            style={{
              ...luxuryBodyStyleBlack,
              marginTop: "1.5rem"
            }}
          >
            {message}
          </Text>
        )}
        <View>
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
                    width="12rem"
                    margin="1rem"
                    padding="1.25rem"
                    backgroundColor="rgba(0, 0, 0, 0.75)"
                    border="1px solid rgba(151, 33, 0, 0.72)"
                    borderRadius="8px"
                    >
                    <Link to={`/fragrances/${prod.parentid}`}>
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