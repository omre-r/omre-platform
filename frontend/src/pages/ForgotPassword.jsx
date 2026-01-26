import React from 'react';

import Navbar from "../components/Navbar";
import LuxuryBackground from "../assets/Luxury Background.png";

import { Card, View, Flex, Link, Text, TextField, Button } from "@aws-amplify/ui-react";

// Custom styles for heading and body text to enhance the luxurious feel using a imported font from google 
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

const ForgotPassword = () => {
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
                        marginTop="-33rem"
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
                                Forgot Password?
                            </Text>
                            <Text 
                                style={luxuryBodyStyle} 
                                color="#F5F5F5"
                                textAlign="center"
                                marginBottom="2.5rem"
                                marginTop="-2.5rem"
                            >
                                We will send you an email to reset your password.
                            </Text>
                            <TextField 
                                color="#F5F5F5" 
                                style={luxuryBodyStyle}
                                label="Email"
                                type="email"
                                placeholder="Enter your email"
                                required
                                marginTop="-2rem"
                            />
                            <Button 
                                style={luxuryBodyStyle}
                                backgroundColor="rgba(82, 18, 0, 0.92)"
                                color="#F5F5F5"
                                borderColor="rgba(0,0,0,0.45)"
                                borderRadius="8px"
                                marginTop="2rem"
                                type="submit"
                            >
                                Send Reset Link
                            </Button>
                            {/* Link to navigate back to login page */} 
                            <Link 
                                href="/Auth" 
                                style={luxuryBodyStyle} color="#F5F5F5"
                                textAlign="center"
                                marginTop="1.5rem"
                                >
                                Need to login?
                            </Link>
                        </Flex>
                    </Card>
                </View>
        </>
    );
};

export default ForgotPassword;