import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { View, Card, Flex, Text } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import Navbar from "../components/Navbar";
import LuxuryBackground from "../assets/Luxury Background2.png";
import { 
  getCartReq, 
  deleteCartItemReq, 
  createOrderReq,
  clearCartReq,
  getRecommendationsReq,
} from "../requests.js";

// fonts //
const headingStyle = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 800,
  fontSize: "2.5rem",
  letterSpacing: "0.5px",
  color: "#000000",
};

const bodyStyle = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 400,
  fontSize: "1.3rem",
  letterSpacing: "0.5px",
  color: "#FFFFFF",
};

const bodyStyleBlack = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 400,
  fontSize: "1.3rem",
  letterSpacing: "0.5px",
  color: "#000000",
};

// functions //
export default function Cart({ customerid }) {
  const [cart, setCart] = useState([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [message, setMessage] = useState("");


  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);

  
  useEffect(() => {
    if (!cartLoaded) return;
    async function loadRecommendations() {
        try {
            const data = await getRecommendationsReq();
            setRecommendations(data?.data?.recommendations || []);
        } catch (err) {
            console.error(err);
        } finally {
            setTimeout(() => setLoadingRecommendations(false), 500);
        }
    }
    loadRecommendations();
}, [cartLoaded]);

  useEffect(() => {
    async function loadCart() {
      try {
        const data = await getCartReq(customerid);
        if (!data.success){
          throw new Error(data.message);
        }
        setCart(data.data.cart);
        setCart([
          {
            id: 1,
            quantity: 1,
            item: {
              id: 101,
              name: "Midnight Oud",
              price: 145,
              images: [
                "https://images.unsplash.com/photo-1615634260167-c8cdede054de"
              ]
            }
          },
          {
            id: 2,
            quantity: 2,
            item: {
              id: 102,
              name: "Velvet Amber",
              price: 120,
              images: [
                "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539"
              ]
            }
          },
          {
            id: 3,
            quantity: 1,
            item: {
              id: 103,
              name: "Noir Santal",
              price: 165,
              images: [
                "https://images.unsplash.com/photo-1585386959984-a4155224a1ad"
              ]
            }
          }
        ]);

setLoadingCart(false);
      } catch (err) {
        console.error(err);
        setMessage("Failed to load cart.");
      } finally {
        setLoadingCart(false);
        setCartLoaded(true);
      }
    }

    loadCart();
  }, [customerid]);

  async function removeItem(id) {
    try{
      const deleteData = await deleteCartItemReq(id);
      if (!deleteData.success){
        throw new Error(deleteData.message);
      }

      const cartData = await getCartReq(customerid);
      if (!cartData.success){
        throw new Error(cartData.message);
      }
      setCart(cartData.data.cart);
    }catch(err){
      console.error(err);
      setCart([])
    }
  }

  async function checkout() {
    try{
      const createData = await createOrderReq({ customerid });
      if (!createData.success){
        throw new Error(createData.message);
      }

      const clearData = await clearCartReq(customerid);
      if (!clearData.success){
        throw new Error(clearData.message);
      }
      setCart([])
      alert("Order placed successfully.");
    }catch(err){
      console.error(err);
    }
  }

  const total = cart.reduce(
    (sum, item) => sum + (item.item?.price || 0) * item.quantity,
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
        <Text style={headingStyle} marginTop="-2.5rem">
          Your Cart
        </Text>

        {loadingCart && (
          <Text style={bodyStyleBlack}>Loading cart...</Text>
        )}

        {!loadingCart && cart.length === 0 && (
          <>
            <Text style={bodyStyleBlack} marginBottom="2rem">
              Your cart is currently empty
            </Text>

            <Flex justifyContent="center">
              <Link to="/fragrances">
                <View
                  padding="0.75rem 1.75rem"
                  border="1px solid rgba(255,255,255,0.5)"
                  borderRadius="25px"
                  backgroundColor="rgba(0,0,0,0.5)"
                  style={{ cursor: "pointer" }}
                >
                  <Text style={bodyStyle}>Shop All</Text>
                </View>
              </Link>
            </Flex>
          </>
        )}

        {!loadingCart && cart.length > 0 && (
          <Flex alignItems="flex-start" gap="3rem">

            {/* Left side products window */}
            <View width="67%">
              {cart.map((cartItem) => (
                <Card
                  key={cartItem.id}
                  marginBottom="1.5rem"
                  backgroundColor="rgba(0,0,0,0.6)"
                  borderRadius="20px"
                  padding="1rem"
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

                      <View>
                        <Text style={bodyStyle}>
                          {cartItem.item?.name}
                        </Text>

                        <Text style={bodyStyle}>
                          Quantity: {cartItem.quantity}
                        </Text>

                        <Text style={bodyStyle}>
                          ${cartItem.item?.price}
                        </Text>
                      </View>
                    </Flex>

                    <View
                      as="button"
                      onClick={() => removeItem(cartItem.id)}
                      padding="0.75rem 1.75rem"
                      border="1px solid rgba(255,255,255,0.5)"
                      borderRadius="25px"
                      backgroundColor="rgba(0,0,0,0.5)"
                      style={{ cursor: "pointer" }}
                    >
                      <Text style={bodyStyle}>Remove</Text>
                    </View>
                  </Flex>
                </Card>
              ))}
            </View>

                {/* Right side order summary */}
              <View width="33%" paddingTop="1rem">

                <Text style={headingStyle} marginBottom="2rem">
                  Order Summary
                </Text>

                {/* item breakdown */}
                {cart.map((cartItem) => (
                  <Flex
                    key={cartItem.id}
                    justifyContent="space-between"
                    marginBottom="1rem"
                  >
                    <Text style={bodyStyleBlack}>
                      {cartItem.item?.name} × {cartItem.quantity}
                    </Text>

                    <Text style={bodyStyleBlack}>
                      ${(cartItem.item?.price * cartItem.quantity).toFixed(2)}
                    </Text>
                  </Flex>
                ))}

                <View
                  height="1px"
                  backgroundColor="rgba(0,0,0,0.2)"
                  marginTop="1.5rem"
                  marginBottom="1.5rem"
                />

                <Flex justifyContent="space-between" marginBottom="2rem">
                  <Text style={headingStyle}>Total</Text>
                  <Text style={headingStyle}>
                    ${total.toFixed(2)}
                  </Text>
                </Flex>

                <View
                  as="button"
                  onClick={checkout}
                  padding="0.75rem 1.75rem"
                  border="1px solid rgba(255,255,255,0.5)"
                  borderRadius="25px"
                  backgroundColor="rgba(0,0,0,0.5)"
                  style={{ cursor: "pointer" }}
                >
                  <Text style={bodyStyle}>
                      Checkout
                    </Text>
                </View>
              </View>
            </Flex>
      )}
      {loadingRecommendations && (
        <Text style={bodyStyleBlack}>Loading recommendations...</Text>
      )}
      {!loadingRecommendations && (
      <View>
        <Text style={headingStyle} marginBottom=".5rem">
          You May Also Like
        </Text>
          <Flex 
            wrap="wrap"
            justifyContent="center">
            {/* TODO: swap is featured to recommendations array */}
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
                  <Link to={`/fragrances/${prod.id}`}>
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
                    <Text style={{...bodyStyle, fontSize: ".95rem"}} textAlign="center">
                      {prod.name}
                    </Text>
                    <Text
                      style={{ ...bodyStyle, fontSize: ".95rem", fontWeight: 600 }}
                      textAlign="center"
                    >
                      ${prod.price}
                    </Text>
                  </Link>
                </Card>
              ))}
          </Flex>
      </View>
      )}
      </View>
    </>
  );
}