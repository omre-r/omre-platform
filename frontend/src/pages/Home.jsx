// Database dev

import { Link } from "react-router-dom";
import { View, Card, Flex, Text } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import Navbar from "../components/Navbar";

import LuxuryBackground from "../assets/Luxury Background.png";

// fonts //
const headingStyle = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 800,
  fontSize: "2.5rem",
  letterSpacing: "0.5px",
  color: "#FFFFFF",
};

const bodyStyle = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 400,
  fontSize: "1.3rem",
  letterSpacing: "0.5px",
  color: "#FFFFFF",
};

export default function Home() {
  return (
    <>
    {/* navigation bar */}
      <Navbar />

      {/* here is the background setup details */}
      <View
        width="100%"
        height="100vh"
        paddingTop="3rem" 
        paddingLeft="3rem"
        paddingRight="3rem"
        paddingBottom="3rem"
        style={{
          backgroundImage: `url(${LuxuryBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* The fragrance heading at the top pf the page */}
        <Text style={headingStyle} marginBottom="5rem">
          Featured Fragrances
        </Text>

        {/* individual product cardsfor featured products */}
        <Flex>
          <Card
            variation="elevated"
            height="auto"
            width="18rem"
            margin="1rem"
            padding="2rem"
            marginTop="0rem"
            backgroundColor="rgba(0, 0, 0, 0.75)"
            border="1px solid rgba(151, 33, 0, 0.72)"
            borderRadius="8px"
          >
            <Link to="/fragrances/latte">
            <View
              height="200px"
              backgroundColor="rgba(255,255,255,0.15)"
              borderRadius="10px"
            />
            <Text style={bodyStyle} textAlign="center">
              Latte - Inspired by Bianco
            </Text>
            <Text style={{ ...bodyStyle, fontWeight: 600 }} textAlign="center">
              $35
            </Text>
            </Link>
          </Card>

          <Card
            variation="elevated"
            height="auto"
            width="18rem"
            margin="1rem"
            padding="2rem"
            marginTop="0rem"
            backgroundColor="rgba(0, 0, 0, 0.75)"
            border="1px solid rgba(151, 33, 0, 0.72)"
            borderRadius="8px"
          >
            <Link to="/fragrances/latte">
           <View
              height="200px"
              backgroundColor="rgba(255,255,255,0.15)"
              borderRadius="10px"
            />
            <Text style={bodyStyle} textAlign="center">
              Latte - Inspired by Bianco
            </Text>
            <Text style={{ ...bodyStyle, fontWeight: 600 }} textAlign="center">
              $35
            </Text>
            </Link>
          </Card>

          <Card
            variation="elevated"
            height="auto"
            width="18rem"
            margin="1rem"
            padding="2rem"
            marginTop="0rem"
            backgroundColor="rgba(0, 0, 0, 0.75)"
            border="1px solid rgba(151, 33, 0, 0.72)"
            borderRadius="8px"
          >
            <Link to="/fragrances/latte">
            <View
              height="200px"
              backgroundColor="rgba(255,255,255,0.15)"
              borderRadius="10px"
            />
            <Text style={bodyStyle} textAlign="center">
              Latte - Inspired by Bianco
            </Text>
            <Text style={{ ...bodyStyle, fontWeight: 600 }} textAlign="center">
              $35
            </Text>
            </Link>
          </Card>

          <Card
            variation="elevated"
            height="auto"
            width="18rem"
            margin="1rem"
            padding="2rem"
            marginTop="0rem"
            backgroundColor="rgba(0, 0, 0, 0.75)"
            border="1px solid rgba(151, 33, 0, 0.72)"
            borderRadius="8px"
          >
            <Link to="/fragrances/latte">
            <View
              height="200px"
              backgroundColor="rgba(255,255,255,0.15)"
              borderRadius="10px"
            />
            <Text style={bodyStyle} textAlign="center">
              Latte - Inspired by Bianco
            </Text>
            <Text style={{ ...bodyStyle, fontWeight: 600 }} textAlign="center">
              $35
            </Text>
            </Link>
          </Card>

          <Card
            variation="elevated"
            height="auto"
            width="18rem"
            margin="1rem"
            padding="2rem"
            marginTop="0rem"
            backgroundColor="rgba(0, 0, 0, 0.75)"
            border="1px solid rgba(151, 33, 0, 0.72)"
            borderRadius="8px"
          >
            <Link to="/fragrances/latte">
            <View
              height="200px"
              backgroundColor="rgba(255,255,255,0.15)"
              borderRadius="10px"
            />
            <Text style={bodyStyle} textAlign="center">
              Latte - Inspired by Bianco
            </Text>
            <Text style={{ ...bodyStyle, fontWeight: 600 }} textAlign="center">
              $35
            </Text>
            </Link>
          </Card>
        </Flex>
        

        {/* link to get to the shop all section */}
        <Flex justifyContent="flex-end">
          <Link to="/fragrances">
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
