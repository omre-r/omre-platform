import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { View, Card, Flex, Text } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { getProductsReq } from "../requests.js";
import Navbar from "../components/Navbar";
import LuxuryBackground from "../assets/Luxury Background2.png";

/*
Custom Styles ------------------------------------------------------------------------------------------------
- Custom heading and body style using downloaded font
- Will be used through out to edit aspects of cards
*/
const HeadingStyle = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 800,
  fontSize: "2.5rem",
  letterSpacing: "0.5px",
};
const BodyStyle = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 400,
  fontSize: "1.3rem",   
  letterSpacing: "0.3px",
};


export default function Mixology() {
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
            }}>
            <Text 
                style={HeadingStyle} 
                marginBottom="5rem">
                Mixology
            </Text>

        </View>
    </>
  );
}