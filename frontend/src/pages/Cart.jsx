// Imported functions
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  View,
  Card,
  Flex,
  Text,
  Button,
  SwitchField,
} from "@aws-amplify/ui-react";
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
  getSavedItemsReq,
  deleteSavedItemReq,
  createSavedItemReq,
  addStoreCreditReq,
} from "../requests.js";

import { useToast } from "../components/ToastContext";
import { useAuth } from "../context/AuthContext";

// custom styles for text/buttons
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
  background: "linear-gradient(145deg,  #9a2424, rgba(20,20,20,0.9))",
  cursor: "pointer",
  boxShadow: "0 8px 18px rgba(0,0,0,0.35)",
  transition: "all 0.2s ease",
};

// components
export default function Cart() {
  const { userInfo, setUserInfo, refreshAuth } = useAuth();
  const [cart, setCart] = useState([]);
  const [loadingCart, setLoadingCart] = useState(true);

  const [savedItems, setSavedItems] = useState([]);
  const [loadingSavedItems, setLoadingSavedItems] = useState(true);

  const { toast } = useToast();
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [recommendations, setRecommendations] = useState([]);

  const [isHovered, setIsHovered] = useState(false);
  const [usingStoreCredit, setUsingStoreCredit] = useState(true);

  useEffect(() => {
    loadCart();
    loadSavedItems();
    loadRecommendations();
  }, []);
  // to get the customers cart
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
  // to load the items into the cart
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
            if (blend.size_ml === 30) price = 50; // general price
            if (blend.size_ml === 50) price = 75; // general price
            const frag1Res = await getProductReq(blend.frag1_productid);
            const frag2Res = await getProductReq(blend.frag2_productid);
            const frag1 =
              frag1Res?.data?.data?.product || frag1Res?.data?.product;
            const frag2 =
              frag2Res?.data?.data?.product || frag2Res?.data?.product;
            let frag3 = null;
            if (blend.frag3_productid) {
              // Only if third fragrance selected
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
        }),
      );

      setCart(fullCart.filter(Boolean));
    } catch (err) {
      console.error(err);
      toast("Failed to load cart.", "error");
    } finally {
      setLoadingCart(false);
    }
  }
  // Loads items saved for later
  async function loadSavedItems() {
    const customerid = await getCustomerId();
    if (!customerid) {
      setLoadingSavedItems(false);
      return;
    }
    try {
      const response = await getSavedItemsReq(customerid);
      const savedItemRows = response?.data?.savedItems || [];
      if (!Array.isArray(savedItemRows) || savedItemRows.length === 0) {
        setSavedItems([]);
        return;
      }

      const fullSavedItems = await Promise.all(
        savedItemRows.map(async (row) => {
          let item;

          if (row.type === "blend") {
            const blendRes = await getBlendByIdReq(row.itemid);
            const blend = blendRes?.data?.data?.blend || blendRes?.data?.blend;
            if (!blend) {
              await deleteSavedItemReq(row.id);
              return null;
            }
            let price = 0;
            if (blend.size_ml === 30) price = 50;
            if (blend.size_ml === 50) price = 75;
            const frag1Res = await getProductReq(blend.frag1_productid);
            const frag2Res = await getProductReq(blend.frag2_productid);
            const frag1 = frag1Res?.data?.product;
            const frag2 = frag2Res?.data?.product;
            let frag3 = null;
            if (blend.frag3_productid) {
              const frag3Res = await getProductReq(blend.frag3_productid);
              frag3 = frag3Res?.data?.product;
            }
            if (
              !frag1 ||
              !frag2 ||
              frag1.ishidden ||
              frag2.ishidden ||
              (frag3 && frag3.ishidden)
            ) {
              await deleteSavedItemReq(row.id);
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
            item = productRes?.data?.product;
            if (!item || item.ishidden) {
              await deleteSavedItemReq(row.id);
              return null;
            }
          }

          return { ...row, item };
        }),
      );

      setSavedItems(fullSavedItems.filter(Boolean));
    } catch (err) {
      console.error(err);
      toast("Failed to load saved items.", "error");
    } finally {
      setLoadingSavedItems(false);
    }
  }
  // loads recommended products based on user info
  async function loadRecommendations() {
    const idToken = getIDToken();
    if (!idToken || !idToken?.sub) {
      setLoadingRecommendations(false);
      return;
    }
    setLoadingRecommendations(true);
    const data = await getRecommendationsReq(idToken.sub);
    setLoadingRecommendations(false);
    setRecommendations(data?.data?.recommendations || []);
  }
  // moves items into saved for later on click
  async function moveToSaved(cartitem) {
    const savedItem = await createSavedItemReq({
      customerid: cartitem.customerid,
      itemid: cartitem.itemid,
      type: cartitem.type,
    });
    if (!savedItem.success || savedItem?.data?.exists) {
      toast(savedItem.message || "Could not move to saved.", "error");
      return;
    }
    const cartItemRemoved = await updateCartReq(
      cartitem.customerid,
      cart.filter((item) => item.id !== cartitem.id),
    );
    if (!cartItemRemoved.success) {
      toast(cartItemRemoved.message || "Failed to update cart.", "error");
      return;
    }

    loadCart();
    loadSavedItems();
  }
  // moves saved for later items back into the cart
  async function addToCart(savedItem) {
    const newCartItem = await createCartItemReq({
      customerid: savedItem.customerid,
      itemid: savedItem.itemid,
      type: savedItem.type,
    });
    if (!newCartItem.success) {
      toast(newCartItem.message || "Failed to add to cart.", "error");
      return;
    }
    loadCart();
  }
  // deletes the saved for later item from the saved for later database
  async function removeSavedItem(savedItem) {
    const deletedItem = await deleteSavedItemReq(savedItem.id);
    if (!deletedItem.success) {
      toast(deletedItem.message || "Failed to remove item.", "error");
      return;
    }
    loadSavedItems();
  }
  // removes item from cart
  async function removeItem(id) {
    try {
      await deleteCartItemReq(id);
      await loadCart();
    } catch (err) {
      console.error(err);
      toast("Failed to remove item.", "error");
    }
  }
  // increases item quantity, limit of 10
  async function increaseQuantity(id) {
    const customerid = await getCustomerId();
    if (!customerid) return;
    const targetItem = cart.find((item) => item.id === id);
    if (targetItem.quantity >= 10) {
      toast("Maximum quantity per item is 10.", "info");
      return;
    }
    const updatedCart = cart.map((item) =>
      item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
    );
    setCart(updatedCart);
    await updateCartReq(
      customerid,
      updatedCart.map((item) => ({
        itemid: item.itemid,
        quantity: item.quantity,
        type: item.type,
      })),
    );
  }
  // decreases item quantity
  async function decreaseQuantity(id) {
    const customerid = await getCustomerId();
    if (!customerid) return;

    const updatedCart = cart
      .map((item) =>
        item.id === id ? { ...item, quantity: item.quantity - 1 } : item,
      )
      .filter((item) => item.quantity > 0);
    setCart(updatedCart);
    await updateCartReq(
      customerid,
      updatedCart.map((item) => ({
        itemid: item.itemid,
        quantity: item.quantity,
        type: item.type,
      })),
    );
  }
  // items are purchased and sent to the orders database
  async function checkout() {
    const customerid = await getCustomerId();
    if (!customerid) return;

    if (cart.length === 0) {
      toast("Your cart is empty.", "info");
      return;
    }

    try {
      const response = await createOrderReq({
        customerid,
        storeCredit:
          usingStoreCredit && userInfo?.store_credit
            ? userInfo?.store_credit
            : 0,
      });
      if (!response?.success) {
        const backendMessage = response?.message || "";
        if (backendMessage.includes("Failed to decrease product stock")) {
          toast("Product out of stock.", "error");
        } else {
          toast(backendMessage || "Checkout failed.", "error");
        }
        return;
      }
      await clearCartReq(customerid);

      setCart([]);
      toast("Order placed successfully!", "success");
      refreshAuth();
    } catch (err) {
      console.error(err);
      toast("Checkout failed.", "error");
    }
  }

  const total = cart.reduce(
    (sum, item) => sum + (item.item?.price || 0) * item.quantity,
    0,
  );

  return (
    <>
      <Navbar /> // imports and places the nav bar
      <View
        width="100%"
        minHeight="100vh"
        paddingTop="3rem"
        paddingLeft="3rem"
        style={{
          boxSizing: "border-box",
          paddingLeft: "clamp(1rem, 4vw, 3rem)",
          paddingRight: "clamp(1rem, 4vw, 3rem)",
          backgroundImage: `url(${LuxuryBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "repeat",
          overflowX: "hidden",
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
          <View
            width="100%"
            style={{
              overflowX: "auto",
              overflowY: "hidden",
            }}
          >
            <Flex
              alignItems="flex-start"
              gap="2rem"
              style={{ minWidth: "1050px" }}
            >
              {/* LEFT 67% of the card, order information including item, quantity, price, and picture, also increase and decrease buttons */}
              <Flex width="67%" direction={"column"}>
                <View>
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
                        background:
                          "linear-gradient(135deg, rgba(255, 255, 255, 0.35), rgba(187, 187, 187, 0.05))",
                      }}
                    >
                      <Flex direction={"column"}>
                        <Flex
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Flex alignItems="center" gap="1.5rem">
                            {" "}
                            // Cart items
                            {cartItem.item?.images?.[0] && (
                              <img
                                src={cartItem.item.images[0]}
                                alt={cartItem.item.name}
                                style={{
                                  width: "120px",
                                  height: "120px",
                                  objectFit: "cover",
                                  borderRadius: "20px",
                                  background:
                                    "linear-gradient(145deg, rgba(45,20,20,0.95), rgba(15,15,15,0.95))",
                                  padding: "2px",
                                  boxShadow: "0 6px 14px rgba(0,0,0,0.22)",
                                  border: "1px solid rgba(255,255,255,0.08)",
                                }}
                              />
                            )}
                            <View textAlign={"left"}>
                              {" "}
                              // cart items information
                              <Text
                                style={{
                                  ...luxuryBodyStyle,
                                  color: "black",
                                  fontSize: "1.35rem",
                                }}
                              >
                                {cartItem.item?.name}{" "}
                                {cartItem.item?.variation
                                  ? `(${cartItem.item.variation})`
                                  : cartItem.item?.size_ml
                                    ? `(${cartItem.item.size_ml}ml)`
                                    : ""}
                                <br></br>
                                Quantity: {cartItem.quantity} <br></br>$
                                {cartItem.item?.price}
                              </Text>
                            </View>
                          </Flex>
                          <Flex gap="3rem">
                            <View
                              style={{
                                ...buttonViewStyle,
                                border: "1px solid rgba(0, 0, 0, 1)",
                                borderRadius: "10px",
                              }}
                              onClick={() => decreaseQuantity(cartItem.id)}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform =
                                  "translateY(-5px)";
                                e.currentTarget.style.boxShadow =
                                  "0 12px 24px rgba(0,0,0,0.45)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform =
                                  "translateY(0px)";
                                e.currentTarget.style.boxShadow =
                                  "0 8px 18px rgba(0,0,0,0.35)";
                              }}
                            >
                              <Text
                                style={{
                                  ...luxuryBodyStyle,
                                  fontWeight: 200,
                                  fontSize: "1.5rem",
                                  fontFamily: "Arial, sans-serif",
                                }}
                              >
                                −
                              </Text>
                            </View>

                            <View // cart item quantity
                              style={{
                                ...buttonViewStyle,
                                borderRadius: "10px",
                                opacity: cartItem.quantity >= 10 ? 0.4 : 1,
                                cursor:
                                  cartItem.quantity >= 10
                                    ? "not-allowed"
                                    : "pointer",
                                border: "1px solid rgba(0, 0, 0, 1)",
                              }}
                              onClick={() => {
                                if (cartItem.quantity >= 10) {
                                  toast(
                                    "Maximum quantity per item is 10.",
                                    "info",
                                  );
                                  return;
                                }
                                increaseQuantity(cartItem.id);
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform =
                                  "translateY(-5px)";
                                e.currentTarget.style.boxShadow =
                                  "0 12px 24px rgba(0,0,0,0.45)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform =
                                  "translateY(0px)";
                                e.currentTarget.style.boxShadow =
                                  "0 8px 18px rgba(0,0,0,0.35)";
                              }}
                            >
                              <Text
                                style={{
                                  ...luxuryBodyStyle,
                                  fontWeight: 200,
                                  fontSize: "1.5rem",
                                  fontFamily: "Arial, sans-serif",
                                }}
                              >
                                +
                              </Text>
                            </View>
                          </Flex>
                        </Flex>
                        <View>
                          {" "}
                          // save for later button
                          <View width={"fit-content"} marginLeft={"auto"}>
                            {savedItems.some(
                              (saved) => cartItem.itemid === saved.itemid,
                            ) ? (
                              <button
                                style={{
                                  ...buttonViewStyle,
                                  color: "white",
                                  borderRadius: "10px",
                                  width: "fit-content",
                                  padding: "10px",
                                  fontSize: "1.2em",
                                  fontWeight: "bold",
                                  border: "1px solid rgb(0, 0, 0)",
                                }}
                                disabled
                              >
                                <Text style={luxuryBodyStyle}>
                                  Save for later
                                </Text>
                              </button>
                            ) : (
                              <button
                                onClick={() => moveToSaved(cartItem)}
                                style={{
                                  ...buttonViewStyle,
                                  color: "white",
                                  borderRadius: "10px",
                                  width: "fit-content",
                                  padding: "10px",
                                  fontSize: "1.2em",
                                  fontWeight: "bold",
                                  border: "1px solid rgb(0, 0, 0)",
                                }}
                              >
                                <Text style={luxuryBodyStyle}>
                                  Save for later
                                </Text>
                              </button>
                            )}
                          </View>
                        </View>
                      </Flex>
                    </Card>
                  ))}
                </View>
              </Flex>

              {/* RIGHT 33% including checkout, total, items list. */}
              <View
                width="33%"
                backgroundColor="rgba(255,255,255,0.18)"
                border="1px solid rgba(60, 20, 20, 0.15)"
                borderRadius="24px"
                padding="2rem"
                boxShadow="0 10px 30px rgba(0,0,0,0.10)"
                backdropFilter="blur(2px)"
              >
                <Text style={luxuryHeadingStyle} marginBottom="2rem">
                  Order Summary
                </Text>

                {/* Each item organized above the total */}
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
                    <Text
                      style={{ ...luxuryBodyStyleBlack, textAlign: "left" }}
                    >
                      {cartItem.item?.name}{" "}
                      {cartItem.item?.variation
                        ? `(${cartItem.item.variation})`
                        : cartItem.item?.size_ml
                          ? `(${cartItem.item.size_ml}ml)`
                          : ""}{" "}
                      × {cartItem.quantity}
                    </Text>
                    <Text
                      style={{
                        ...luxuryBodyStyleBlack,
                        fontWeight: "800",
                        fontSize: "1.5rem",
                      }}
                    >
                      $
                      {(
                        (cartItem.item?.price || 0) * cartItem.quantity
                      ).toFixed(2)}
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
                    background:
                      "linear-gradient(to right, rgba(60,20,20,0.05), rgba(60,20,20,0.22), rgba(60,20,20,0.05))",
                    borderRadius: "999px",
                  }}
                />
                <Flex
                  justifyContent={"space-between"}
                  fontFamily="Cormorant Garamond, serif"
                  fontWeight="bold"
                  fontSize={"1.2em"}
                >
                  <Text>Use store credit?</Text>
                  <SwitchField
                    isChecked={usingStoreCredit}
                    onChange={(e) => setUsingStoreCredit(e.target.checked)}
                  ></SwitchField>
                </Flex>

                <Flex
                  justifyContent="space-between"
                  alignItems="center"
                  marginTop="2rem"
                  paddingTop="1.5rem"
                  borderTop="2px solid rgba(60, 20, 20, 0.18)"
                >
                  <Text style={luxuryHeadingStyle}>Total</Text>
                  <Text style={luxuryHeadingStyle}>
                    {usingStoreCredit && userInfo?.store_credit
                      ? Math.max(
                          total - Number(userInfo.store_credit),
                          0.0,
                        ).toFixed(2)
                      : total.toFixed(2)}
                  </Text>
                </Flex>
                {usingStoreCredit && (
                  <Flex
                    justifyContent={"space-between"}
                    alignItems={"center"}
                    fontFamily="Cormorant Garamond, serif"
                    fontWeight="bold"
                    fontSize={"1.3em"}
                    fontStyle={"italic"}
                    color={"green"}
                  >
                    <section>Store Credit</section>
                    <section>
                      -{" "}
                      {Math.min(
                        Number(userInfo?.store_credit),
                        total.toFixed(2),
                      ).toFixed(2)}
                    </section>
                  </Flex>
                )}
                <Flex justifyContent="center" marginTop="2rem">
                  <Button
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    style={{
                      ...buttonViewStyle,
                      background: isHovered
                        ? "linear-gradient(145deg,  #c23434, rgba(20,20,20,0.9))"
                        : "linear-gradient(145deg,  #9a2424, rgba(20,20,20,0.9))",
                      transform: isHovered
                        ? "translateY(-5px)"
                        : "translateY(0px)",
                      transition: "all 1s ease",
                    }}
                    onClick={checkout}
                  >
                    <Text style={luxuryBodyStyle}>Checkout</Text>
                  </Button>
                </Flex>
              </View>
            </Flex>
          </View>
        )}

        <View minWidth={"500px"} maxWidth={"67%"} margin={"auto"}>
          {" "}
          // saved for later items
          <Text
            style={{
              ...luxuryHeadingStyle,
              marginBottom: "0",
              marginTop: "20px",
            }}
            marginBottom="2rem"
          >
            Saved for Later
          </Text>
          {savedItems.length === 0 && (
            <Text
              style={{
                ...luxuryHeadingStyle,
                marginBottom: "0",
                marginTop: "20px",
                fontSize: "2rem",
                opacity: ".8",
              }}
              marginBottom="2rem"
            >
              No items saved
            </Text>
          )}
          {savedItems.map((savedItem) => (
            <Card
              key={savedItem.id}
              marginBottom="1.5rem"
              borderRadius="24px"
              padding="1.6rem"
              border="1px solid rgba(255,255,255,0.18)"
              boxShadow="0 12px 28px rgba(0,0,0,0.18)"
              backgroundColor="rgba(255, 255, 255, 0.1)"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255, 255, 255, 0.35), rgba(187, 187, 187, 0.05))",
              }}
            >
              <Flex direction={"column"}>
                <Flex justifyContent="space-between" alignItems="center">
                  <Flex alignItems="center" gap="1.5rem">
                    {savedItem.item?.images?.[0] && (
                      <img
                        src={savedItem.item.images[0]}
                        alt={savedItem.item.name}
                        style={{
                          width: "120px",
                          height: "120px",
                          objectFit: "cover",
                          borderRadius: "20px",
                          background:
                            "linear-gradient(145deg, rgba(45,20,20,0.95), rgba(15,15,15,0.95))",
                          padding: "2px",
                          boxShadow: "0 6px 14px rgba(0,0,0,0.22)",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      />
                    )}

                    <View textAlign={"left"}>
                      <Text
                        style={{
                          ...luxuryBodyStyle,
                          color: "black",
                          fontSize: "1.35rem",
                        }}
                      >
                        {savedItem.item?.name}{" "}
                        {savedItem.item?.variation
                          ? `(${savedItem.item.variation})`
                          : savedItem.item?.size_ml
                            ? `(${savedItem.item.size_ml}ml)`
                            : ""}
                        <br></br>${savedItem.item?.price}
                      </Text>
                    </View>
                  </Flex>
                </Flex>
                <View>
                  <View width={"fit-content"} marginLeft={"auto"}>
                    <Flex>
                      <Button
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-5px)";
                          e.currentTarget.style.boxShadow =
                            "0 12px 24px rgba(0,0,0,0.45)";
                          e.currentTarget.style.opacity = "1";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0px)";
                          e.currentTarget.style.boxShadow =
                            "0 8px 18px rgba(0,0,0,0.35)";
                          e.currentTarget.style.opacity = ".8";
                        }}
                        style={{
                          ...buttonViewStyle,
                          opacity: ".8",
                          color: "white",
                          borderRadius: "10px",
                          width: "fit-content",
                          padding: "15x",
                          fontSize: "1.2em",
                          fontWeight: "bold",
                        }}
                        onClick={() => removeSavedItem(savedItem)}
                      >
                        <Text style={luxuryBodyStyle}>Remove saved item</Text>{" "}
                        // remove saved for later
                      </Button>
                      <Button
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-5px)";
                          e.currentTarget.style.boxShadow =
                            "0 12px 24px rgba(0,0,0,0.45)";
                          e.currentTarget.style.opacity = "1";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0px)";
                          e.currentTarget.style.boxShadow =
                            "0 8px 18px rgba(0,0,0,0.35)";
                          e.currentTarget.style.opacity = ".8";
                        }}
                        style={{
                          ...buttonViewStyle,
                          opacity: ".8",
                          color: "white",
                          borderRadius: "10px",
                          width: "fit-content",
                          padding: "15x",
                          fontSize: "1.2em",
                          fontWeight: "bold",
                        }}
                        onClick={() => addToCart(savedItem)}
                      >
                        <Text style={luxuryBodyStyle}>Add to cart</Text> // add
                        back to cart
                      </Button>
                    </Flex>
                  </View>
                </View>
              </Flex>
            </Card>
          ))}
        </View>
        <View
          marginTop="4rem"
          padding="2.5rem 2rem"
          borderRadius="28px"
          backgroundColor="rgba(255,255,255,0.10)"
          border="1px solid rgba(80, 50, 40, 0.10)"
          boxShadow="0 10px 28px rgba(0,0,0,0.08)"
          backdropFilter="blur(2px)"
        >
          <Text style={luxuryHeadingStyle} marginBottom=".5rem">
            You May Also Like
          </Text>
          <Flex wrap="wrap" justifyContent="center">
            {" "}
            // recommended products
            {recommendations.map((prod) => (
              <Card
                key={prod.id}
                className="product-card-hover"
                variation="elevated"
                width="13.5rem"
                padding="1rem"
                border="1px solid rgba(190, 160, 150, 0.18)"
                borderRadius="20px"
                boxShadow="0 14px 28px rgba(0,0,0,0.22)"
                style={{
                  background:
                    "linear-gradient(145deg,  #9a2424, rgba(20,20,20,0.9))",
                }}
              >
                <Link
                  to={`/fragrances/${prod.parentid}?variation=${prod.variation}`}
                  style={{ textDecoration: "none" }}
                >
                  <img
                    src={prod.images?.[0]}
                    alt={prod.name}
                    style={{
                      width: "100%",
                      height: "200px",
                      objectFit: "cover",
                      borderRadius: "10px",
                      display: "block",
                      marginBottom: "1rem",
                    }}
                  />
                  <View minHeight="7.5rem">
                    <Text
                      style={{ ...luxuryBodyStyle, fontSize: "1.2rem" }}
                      textAlign="center"
                    >
                      {prod.name}
                    </Text>
                  </View>
                  <Text
                    style={{ ...luxuryBodyStyle, fontWeight: 600 }}
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
