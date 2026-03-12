
import { View, Flex, Text } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
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
  fontWeight: 600,
  fontSize: "1.4rem",
  letterSpacing: "0.5px",
  color: "#000000",
};

const luxurySubheadingStyle = {
    fontFamily: "'Cormorant Garamond', serif",
    fontWeight: 600,
    fontSize: "1.6rem",   
    letterSpacing: "0.3px",
};
// functions //
export default function ContactUs() {
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
        <Text style={bodyStyle} fontSize="1.5rem" fontWeight="600" marginBottom="1rem" marginTop="3rem">
            Gmail: info@omrefragrances.com
        </Text>

        <Text style={bodyStyle} fontSize="1.5rem" fontWeight="600" marginBottom="1rem">
            Instagram: Omrefragrances
        </Text>
      </View>
    </>
  );
}