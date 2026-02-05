import { Link } from "react-router-dom"; 
import { View, Card, Flex, Text } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import Navbar from "../components/Navbar";

import LuxuryBackground from "../assets/Luxury Background2.png";

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
};


export default function Home() {
  return (
        <>
        <Navbar />
        <View
            height="150vh"
            width="100%"
            padding="1rem"
            style={{
                backgroundImage: `url(${LuxuryBackground})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
            display="flex"
            justifyContent="center"
            alignItems="center"
        >   
            <Card
                variation="elevated"
                height="auto"
                width="30rem"
                margin="1rem auto"
                padding="2rem"
                marginTop="-50rem"
                backgroundColor="#f6f1ecbc"
                border="none"
                box-shadow="0 14px 36px rgba(75, 15, 15, 0.15)"
            >   
                <Flex direction="column">
                    <Text 
                        style={luxuryHeadingStyle} 
                        color="#2B1E1A"
                        textAlign="center"
                        marginBottom="1.5rem"
                    >
                        Home page
                    </Text>
                </Flex>
            </Card>
        </View>
        </>
    );
};