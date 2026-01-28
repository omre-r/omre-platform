// This import is for navigation links
import { Link } from "react-router-dom"; 

// Importing UI components from AWS Amplify UI React library
import { View, Card, Flex, Text } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

// importing the Navbar component for consistent navigation across pages
import Navbar from "../components/Navbar";

import LuxuryBackground from "../assets/Luxury Background.png";

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
                        // Setting the luxury background image with proper sizing and positioning
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
                        height="auto" // Height will adjust for the sign up mode
                        width="30rem"
                        margin="1rem auto"
                        padding="2rem"
                        marginTop="-50rem"
                        backgroundColor="rgba(0, 0, 0, 0.75)"
                        // Subtle border to make the card stand out against the background
                        border="1px solid rgba(151, 33, 0, 0.72)"
                        borderRadius="8px"
                        >   
                        <Flex direction="column">
                            <Text 
                                style={luxuryHeadingStyle} 
                                color="#F5F5F5"
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