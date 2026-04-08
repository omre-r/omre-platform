// Imports for all data and commands
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { View, Card, Flex, Text } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { getActiveProductsReq, getOrdersReq } from "../requests.js";
import Navbar from "../components/Navbar";

// Current images from instagram -------------------------
import Insta1 from "../assets/insta1.jpg";
import Insta2 from "../assets/insta2.jpg";
import Insta3 from "../assets/insta3.jpg";
import Insta4 from "../assets/insta4.jpg";
import Insta5 from "../assets/insta5.jpg";
import Insta6 from "../assets/insta6.jpg";

import LuxuryBackground from "../assets/Luxury Background2.png";

import rating0 from "../assets/ratings/0.png";
import rating1 from "../assets/ratings/1.png";
import rating2 from "../assets/ratings/2.png";
import rating3 from "../assets/ratings/3.png";
import rating4 from "../assets/ratings/4.png";
import rating5 from "../assets/ratings/5.png";
import rating6 from "../assets/ratings/6.png";
import rating7 from "../assets/ratings/7.png";
import rating8 from "../assets/ratings/8.png";
import rating9 from "../assets/ratings/9.png";
import rating10 from "../assets/ratings/10.png";
const ratings = [
  rating0,
  rating1,
  rating2,
  rating3,
  rating4,
  rating5,
  rating6,
  rating7,
  rating8,
  rating9,
  rating10,
];

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
  fontWeight: 600,
  fontSize: "1.3rem",
  letterSpacing: "0.5px",
  color: "#FFFFFF",
};

// functions //
export default function Home() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [message, setMessage] = useState("");

  // Count how many of a product was sold from orders to get most popular
  const [soldItemsCount, setSoldItemsCount] = useState({});

  // Grabbing the newest products that have been added to the website -------------------------------
  const newestProducts = !loadingProducts
    ? products
        .map((prodList) => prodList[0])
        .filter(Boolean)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 4)
    : [];

  const instagramImages = [Insta1, Insta2, Insta3, Insta4, Insta6];

  // Calculate the number of sold items by product id -----------------------------------------------
  function calculateSoldItemsCount(orderList) {
    const counts = {};
    for (const order of orderList) {
      // Skip all cancelled orders
      if (order.status === "canceled") {
        continue;
      }

      const items = order.items;
      for (const entry of items) {
        // Only products no blends!
        if (entry.type !== "product") {
          continue;
        }
        const productId = entry.itemid;
        const quantity = Number(entry.quantity) || 0;

        if (!productId) {
          continue;
        }

        // Increment that product id's count
        counts[productId] = (counts[productId] || 0) + quantity;
      }
    }
    return counts;
  }

  const mostPopularProducts = !loadingProducts
    ? products
        .map((prodList) => prodList[0])
        .filter(Boolean)
        .sort(
          (a, b) => (soldItemsCount[b.id] || 0) - (soldItemsCount[a.id] || 0),
        )
        .slice(0, 4)
    : [];

  // make sure it loads //
  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await getActiveProductsReq();
        if (!data.success) {
          throw new Error(data.message);
        }
        setProducts(groupRelevantElements(data.data.products));
      } catch (err) {
        console.error(err);
        setMessage("Failed to load products.");
      } finally {
        setLoadingProducts(false);
      }
    }

    loadProducts();
  }, []);

  // Load user orders to count most popular products on the platform -------------------------------------------
  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await getOrdersReq();
        if (!data.success) {
          throw new Error(data.message);
        }
        const orders = data.data.orders;
        const counts = calculateSoldItemsCount(orders);
        setSoldItemsCount(counts);
      } catch (err) {
        console.error(err);
        setMessage("Failed to load orders.");
      }
    }
    loadOrders();
  }, []);

  function groupRelevantElements(productList) {
    const parents = {};
    for (const p of productList) {
      parents?.[p.parentid]
        ? parents[p.parentid].push(p)
        : (parents[p.parentid] = [p]);
    }
    // sort variations [50ml, 30ml, 70ml] => [30ml, 50ml, 70ml]
    const groups = Object.values(parents);
    for (const group of groups) {
      group.sort(
        (a, b) =>
          Number(a?.variation?.split("ml")?.[0]) -
          Number(b?.variation?.split("ml")?.[0]),
      );
    }
    return Object.values(parents);
  }

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
        <Flex alignItems="center" gap="1rem" width="100%" marginBottom="2rem">
          <View flex="1" height="1px" backgroundColor="#2b1e1a" />

          <Text style={headingStyle}>Featured Fragrances</Text>

          <View flex="1" height="1px" backgroundColor="#2b1e1a" />
        </Flex>

        <Flex
          wrap="wrap"
          justifyContent="center"
          alignItems="flex-start"
          gap="2rem"
          maxWidth="1400px"
          margin="0 auto"
        >
          {!loadingProducts &&
            products &&
            products.map((prodList) => {
              const filteredList = prodList.filter(
                (prod) => prod.isfeatured === true,
              );
              const prod = filteredList?.[0];
              if (!prod) {
                return null;
              }
              return (
                <Card
                  key={prod.id}
                  variation="elevated"
                  width="16rem"
                  padding="1.75rem"
                  minHeight="15rem"
                  border="1px solid rgba(190, 160, 150, 0.18)"
                  borderRadius="15px"
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
                    <Flex
                      direction="column"
                      justifyContent="space-between"
                      height="100%"
                    >
                      <View>
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
                        <View minHeight="4rem">
                          <Text style={bodyStyle} textAlign="center">
                            {prod.name}
                          </Text>
                        </View>
                      </View>
                      <View color={"white"}>
                        {prod.review_count !== 0 ? (
                          <Flex
                            gap={"12px"}
                            alignItems={"center"}
                            width={"90%"}
                          >
                            <img
                              style={{ width: "95%" }}
                              src={ratings[Math.round(prod.review_average * 2)]}
                              alt=""
                            />
                            <Text style={{ ...bodyStyle, flex: "1" }}>
                              {prod.review_count}
                            </Text>
                          </Flex>
                        ) : (
                          <Text style={{ ...bodyStyle, flex: "1" }}>
                            Be the first to review!
                          </Text>
                        )}
                      </View>
                      <Text
                        style={{ ...bodyStyle, fontWeight: 600 }}
                        textAlign="center"
                      >
                        ${prod.price}
                      </Text>
                    </Flex>
                  </Link>
                </Card>
              );
            })}
        </Flex>
        <Flex justifyContent="flex-end">
          <Link to="/fragrances" style={{ textDecoration: "none" }}>
            <View
              style={{
                padding: "0.9rem 2.2rem",
                border: "1px solid rgba(255,255,255,0.35)",
                borderRadius: "28px",
                background:
                  "linear-gradient(145deg,  #9a2424, rgba(20,20,20,0.9))",
                cursor: "pointer",
                boxShadow: "0 8px 18px rgba(0,0,0,0.35)",
                transition: "all 0.2s ease",
              }}
            >
              <Text style={bodyStyle}>Shop All</Text>
            </View>
          </Link>
        </Flex>
        <Flex
          alignItems="center"
          gap="1rem"
          width="100%"
          marginBottom="2rem"
          marginTop="3rem"
        >
          <View flex="1" height="1px" backgroundColor="#2b1e1a" />
          <Text style={headingStyle}>Top Sellers</Text>
          <View flex="1" height="1px" backgroundColor="#2b1e1a" />
        </Flex>
        <Flex
          wrap="wrap"
          justifyContent="center"
          alignItems="flex-start"
          gap="2rem"
          maxWidth="1400px"
          margin="0 auto"
        >
          {!loadingProducts &&
            mostPopularProducts.map((prod) => (
              <Card
                key={prod.id}
                variation="elevated"
                minHeight="15rem"
                width="16rem"
                padding="1.75rem"
                border="1px solid rgba(190, 160, 150, 0.18)"
                borderRadius="15px"
                boxShadow="0 14px 28px rgba(0,0,0,0.22)"
                style={{
                  background:
                    "linear-gradient(145deg,  #428cfa, rgba(20, 20, 20, 0.65))",
                }}
              >
                <Link
                  to={`/fragrances/${prod.parentid}?variation=${prod.variation}`}
                  style={{ textDecoration: "none" }}
                >
                  <Flex
                    direction="column"
                    justifyContent="space-between"
                    height="100%"
                  >
                    <View>
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
                      <View minHeight="4rem">
                        <Text style={bodyStyle} textAlign="center">
                          {prod.name}
                        </Text>
                      </View>
                    </View>
                    <View color={"white"}>
                      {prod.review_count !== 0 ? (
                        <Flex gap={"12px"} alignItems={"center"} width={"90%"}>
                          <img
                            style={{ width: "95%" }}
                            src={ratings[Math.round(prod.review_average * 2)]}
                            alt=""
                          />
                          <Text style={{ ...bodyStyle, flex: "1" }}>
                            {prod.review_count}
                          </Text>
                        </Flex>
                      ) : (
                        <Text style={{ ...bodyStyle, flex: "1" }}>
                          Be the first to review!
                        </Text>
                      )}
                    </View>
                    <Text
                      style={{ ...bodyStyle, fontWeight: 600 }}
                      textAlign="center"
                    >
                      ${prod.price} <br></br>
                      {soldItemsCount[prod.id] || 0} sold
                    </Text>
                  </Flex>
                </Link>
              </Card>
            ))}
        </Flex>
        <Flex
          alignItems="center"
          gap="1rem"
          width="100%"
          marginBottom="2rem"
          marginTop="3rem"
        >
          <View flex="1" height="1px" backgroundColor="#2b1e1a" />
          <Text style={headingStyle}>New Arrivals</Text>
          <View flex="1" height="1px" backgroundColor="#2b1e1a" />
        </Flex>
        <Flex
          wrap="wrap"
          justifyContent="center"
          alignItems="flex-start"
          gap="2rem"
          maxWidth="1400px"
          margin="0 auto"
        >
          {!loadingProducts &&
            newestProducts.map((prod) => (
              <Card
                key={prod.id}
                variation="elevated"
                minHeight="15rem"
                width="16rem"
                padding="1.75rem"
                border="1px solid rgba(190, 160, 150, 0.18)"
                borderRadius="15px"
                boxShadow="0 14px 28px rgba(0,0,0,0.22)"
                style={{
                  background:
                    "linear-gradient(145deg,  #3a094fe2, rgba(20, 20, 20, 0.65))",
                }}
              >
                <Link
                  to={`/fragrances/${prod.parentid}?variation=${prod.variation}`}
                  style={{ textDecoration: "none" }}
                >
                  <Flex
                    direction="column"
                    justifyContent="space-between"
                    height="100%"
                  >
                    <View>
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
                      <View minHeight="4rem">
                        <Text style={bodyStyle} textAlign="center">
                          {prod.name}
                        </Text>
                      </View>
                    </View>
                    <View color={"white"}>
                      {prod.review_count !== 0 ? (
                        <Flex gap={"12px"} alignItems={"center"} width={"90%"}>
                          <img
                            style={{ width: "95%" }}
                            src={ratings[Math.round(prod.review_average * 2)]}
                            alt=""
                          />
                          <Text style={{ ...bodyStyle, flex: "1" }}>
                            {prod.review_count}
                          </Text>
                        </Flex>
                      ) : (
                        <Text style={{ ...bodyStyle, flex: "1" }}>
                          Be the first to review!
                        </Text>
                      )}
                    </View>
                    <Text
                      style={{ ...bodyStyle, fontWeight: 600 }}
                      textAlign="center"
                    >
                      ${prod.price}
                    </Text>
                  </Flex>
                </Link>
              </Card>
            ))}
        </Flex>
        <Flex
          alignItems="center"
          gap="1rem"
          width="100%"
          marginBottom="2rem"
          marginTop="3rem"
        >
          <View flex="1" height="1px" backgroundColor="#2b1e1a" />
          <Text style={headingStyle}>Follow The OMRÉ Journey</Text>
          <View flex="1" height="1px" backgroundColor="#2b1e1a" />
        </Flex>
        <Flex
          direction="row"
          gap="1rem"
          overflow="auto"
          width="100%"
          paddingBottom="1rem"
          style={{
            scrollbarWidth: "none",
          }}
        >
          {instagramImages.map((image, index) => (
            <View
              key={index}
              style={{
                minWidth: "280px",
                height: "380px",
                borderRadius: "14px",
                overflow: "hidden",
              }}
            >
              <a
                href="https://www.instagram.com/omryfragrances"
                target="_blank" // opens link in new tab
                rel="noopener noreferrer"
                style={{ textDecoration: "none" }}
              >
                <img
                  src={image}
                  alt={`OMRY lifestyle ${index + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </a>
            </View>
          ))}
        </Flex>
      </View>
    </>
  );
}
