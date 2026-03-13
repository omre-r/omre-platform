
// Imports for all data and commands
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { View, Card, Flex, Text } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { getActiveProductsReq } from "../requests.js";
import Navbar from "../components/Navbar";

import LuxuryBackground from "../assets/Luxury Background2.png";

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

// functions //
export default function Home() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [message, setMessage] = useState("");
// make sure it loads //
  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await getActiveProductsReq();
        if (!data.success){
          throw new Error(data.message)
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

  function groupRelevantElements(productList){
    const parents = {};
    for (const p of productList){
        parents?.[p.parentid] ? parents[p.parentid].push(p) : parents[p.parentid] = [p];
    }
    // sort variations [50ml, 30ml, 70ml] => [30ml, 50ml, 70ml]
    const groups = Object.values(parents);
    for (const group of groups){
        group.sort((a, b) => Number(a?.variation?.split("ml")?.[0]) - Number(b?.variation?.split("ml")?.[0]))
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
        <Text style={headingStyle} marginBottom="2rem">
          Featured Fragrances
        </Text>

        <Flex 
          wrap="wrap"
          justifyContent="center"
          alignItems="flex-start"
          gap="2rem"
          maxWidth="1400px"
          margin="0 auto">
          {!loadingProducts && products && products.map(prodList => {
            const filteredList = prodList.filter(prod => prod.isfeatured === true);
            const prod = filteredList?.[0];
            if (!prod){
              return null
            }
            return (
            <Card
              key={prod.id}
              variation="elevated"
              width="16rem"
              padding="1.75rem"
              backgroundColor="rgba(35, 22, 22, 0.88)"
              border="1px solid rgba(190, 160, 150, 0.18)"
              borderRadius="15px"
              boxShadow="0 14px 28px rgba(0,0,0,0.22)"
              style={{
                background: "linear-gradient(145deg,  #480e0e, rgba(20,20,20,0.9))",
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
                    }}
                />
                <Text style={bodyStyle} textAlign="center">
                  {prod.name}
                </Text>
                <Text
                  style={{ ...bodyStyle, fontWeight: 600 }}
                  textAlign="center"
                >
                  ${prod.price}
                </Text>
              </Link>
            </Card>)
          })}
    </Flex>

        <Flex justifyContent="flex-end">
          <Link to="/fragrances"
          style={{ textDecoration: "none" }}>
            <View
              style={{
                padding: "0.9rem 2.2rem",
                border: "1px solid rgba(255,255,255,0.35)",
                borderRadius: "28px",
                background: "linear-gradient(145deg,  #480e0e, rgba(20,20,20,0.9))",
                cursor: "pointer",
                boxShadow: "0 8px 18px rgba(0,0,0,0.35)",
                transition: "all 0.2s ease",
              }}>
              <Text style={bodyStyle}>Shop All</Text>
            </View>
          </Link>
        </Flex>
      </View>
    </>
  );
}