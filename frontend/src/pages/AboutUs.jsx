
// Imports for all data and commands
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { View, Card, Flex, Text } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { getProductsReq } from "../requests.js";
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
        const res = await getProductsReq();
        setProducts(res);
      } catch (err) {
        console.error(err);
        setMessage("Failed to load products.");
      } finally {
        setLoadingProducts(false);
      }
    }

    loadProducts();
  }, []);

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
        {/* ABOUT */}
        <Text style={headingStyle} marginBottom="2rem">
            About Us
        </Text>

        <Text fontSize="1.5rem" fontWeight="600" marginBottom="1rem">
            Our Philosophy
        </Text>

        <Text marginBottom=".5rem">
            Derived from the Arabic word ʿomr—meaning life—OMRY translates to my life.
        </Text>

        <Text marginBottom=".5rem">
            At OMRÉ, fragrance is not a final touch. It is the beginning. The first impression. The lasting presence. The unseen signature.
        </Text>

        <Text marginBottom=".5rem">
            Each creation is a quiet statement of elegance and intention.
        </Text>

        <Text marginBottom=".5rem">
            We design with purpose. Every blend is made using high concentrations of extrait de parfum oils, crafted to last, made to move with you.
        </Text>

        <Text marginBottom=".5rem">
            This is more than perfume.
        </Text>

        <Text marginBottom=".5rem">
            It's how you arrive.
        </Text>

        <Text marginBottom="2rem">
            It's what you leave behind.
        </Text>

        {/* STORY */}
        <Text fontSize="1.5rem" fontWeight="600" marginBottom="2rem">
            Our Story
        </Text>

        <Text fontStyle="italic" marginBottom=".5rem">
            A letter from the Founder
        </Text>

        <Text marginBottom=".5rem">
            Fragrance has always meant more to me than just scent. It's memory. It's presence. It's connection.
        </Text>

        <Text marginBottom=".5rem">
            For as long as I can remember, I've loved giving perfume as a gift...
        </Text>

        <Text marginBottom=".5rem">
            That's how OMRY began.
        </Text>

        <Text marginBottom=".5rem">
            In 2024, I started experimenting with blends I'd actually wear...
        </Text>

        <Text marginBottom=".5rem">
            The name naturally came to me, from the Arabic word ʿomr—life.
        </Text>

        <Text fontWeight="600" marginBottom=".5rem">
            OMRY means my life.
        </Text>

        <Text marginBottom=".5rem">
            And to this day, some scents still bring me back.
        </Text>

        <Text marginBottom=".5rem">
            I'm building OMRÉ into a house. One rooted in memory. Designed with intention. Made to last.
        </Text>

        <Text marginBottom=".5rem">
            Thank you for being part of it.
        </Text>

        <Text marginBottom=".5rem">
            With love,
        </Text>

        <Text fontWeight="600" marginBottom=".5rem">
            The House of OMRY
        </Text>

        {/* CLOSING */}
        <Text fontSize="1.5rem" fontWeight="600" textAlign="center">
            “You don't just wear OMRY— you live in it.”
        </Text>
      </View>
    </>
  );
}