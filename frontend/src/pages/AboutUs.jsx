
import { View, Text } from "@aws-amplify/ui-react";
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
export default function AboutUs() {
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
        <Text style={bodyStyle} fontSize="1.8rem" fontWeight="600" marginBottom="1rem" marginTop="3rem">
            Our Philosophy
        </Text>

        <Text style={bodyStyle}  marginBottom=".5rem">
            Derived from the Arabic word ʿomr—meaning life—OMRÉ translates to my life.
        </Text>

        <Text style={bodyStyle} marginBottom=".5rem">
            At OMRÉ, fragrance is not a final touch. It is the beginning. The first impression. The lasting presence. The unseen signature.
        </Text>

        <Text style={bodyStyle} marginBottom=".5rem">
            Each creation is a quiet statement of elegance and intention.
        </Text>

        <Text style={bodyStyle} marginBottom=".5rem">
            We design with purpose. Every blend is made using high concentrations of extrait de parfum oils, crafted to last, made to move with you.
        </Text>

        <Text style={bodyStyle} marginBottom=".5rem">
            This is more than perfume.
        </Text>

        <Text style={bodyStyle} marginBottom=".5rem">
            It's how you arrive.
        </Text>

        <Text style={bodyStyle} marginBottom="2rem">
            It's what you leave behind.
        </Text>

        {/* STORY */}
        <Text style={bodyStyle} fontSize="1.5rem" fontWeight="600" marginBottom="2rem">
            Our Story
        </Text>

        <Text style={bodyStyle} fontStyle="italic" marginBottom=".5rem" marginTop="-1.5rem">
            A letter from the Founder
        </Text>

        <Text style={bodyStyle} marginBottom=".5rem">
            Fragrance has always meant more to me than just scent. It's memory. It's presence. It's connection.
        </Text>

        <Text style={bodyStyle} marginBottom=".5rem">
            For as long as I can remember, I've loved giving perfume as a gift...
        </Text>

        <Text style={bodyStyle} marginBottom=".5rem">
            That's how OMRÉ began.
        </Text>

        <Text style={bodyStyle} marginBottom=".5rem">
            In 2024, I started experimenting with blends I'd actually wear...
        </Text>

        <Text style={bodyStyle} marginBottom=".5rem">
            The name naturally came to me, from the Arabic word ʿomr—life.
        </Text>

        <Text style={bodyStyle}  fontWeight="600" marginBottom=".5rem">
            OMRÉ means my life.
        </Text>

        <Text style={bodyStyle}  marginBottom=".5rem">
            And to this day, some scents still bring me back.
        </Text>

        <Text style={bodyStyle}  marginBottom=".5rem">
            I'm building OMRÉ into a house. One rooted in memory. Designed with intention. Made to last.
        </Text>

        <Text style={bodyStyle} marginBottom=".5rem">
            Thank you for being part of it.
        </Text>

        <Text style={bodyStyle}  marginBottom=".5rem">
            With love,
        </Text>

        <Text style={bodyStyle}  fontWeight="600" marginBottom=".5rem">
            The House of OMRÉ
        </Text>

        {/* CLOSING */}
        <Text style={bodyStyle} fontSize="1.5rem" fontWeight="600" textAlign="center">
            “You don't just wear OMRÉ— you live in it.”
        </Text>

      </View>
    </>
  );
}