
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
        <Text style={headingStyle} marginBottom="5rem">
          Featured Fragrances
        </Text>

        <Flex wrap="wrap">
          {!loadingProducts && products && products.map(prodList => {
            const filteredList = prodList.filter(prod => prod.isfeatured === true);
            const prod = filteredList?.[0];
            if (!prod){
              return null
            }
            return (<Card
              key={prod.id}
              variation="elevated"
              height="auto"
              width="18rem"
              margin="1rem"
              padding="2rem"
              backgroundColor="rgba(0, 0, 0, 0.75)"
              border="1px solid rgba(151, 33, 0, 0.72)"
              borderRadius="8px"
            >
              <Link 
                to={`/fragrances/${prod.parentid}`}
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
              padding="0.75rem 1.75rem"
              border="1px solid rgba(255,255,255,0.5)"
              borderRadius="25px"
              backgroundColor="rgba(0,0,0,0.5)"
            >
              <Text style={bodyStyle}>Shop All</Text>
            </View>
          </Link>
        </Flex>
      </View>
    </>
  );
}