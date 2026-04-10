// imports
import { View, Text } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import Navbar from "../components/Navbar";
import LuxuryBackground from "../assets/Luxury Background2.png";
// styling for texts and buttons
const headingStyle = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 800,
  fontSize: "2rem",
  letterSpacing: "0.5px",
  color: "#000000",
  textAlign: "left",
};

const bodyStyle = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 600,
  fontSize: "1.25rem",
  lineHeight: "1.8",
  letterSpacing: "0.3px",
  color: "#1a1a1a",
  textAlign: "left",
};

const dividerStyle = {
  border: "none",
  borderTop: "1px solid rgba(151, 33, 0, 0.4)",
  margin: "1.5rem 0",
};

export default function AboutUs() {
  // all the text is written in the code for About us, can not be changed by the admins
  return (
    <>
      <Navbar /> // navbar import
      <View
        width="100%"
        minHeight="100vh"
        paddingTop="3rem"
        paddingLeft="3rem"
        paddingRight="3rem"
        paddingBottom="4rem"
        style={{
          backgroundImage: `url(${LuxuryBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "repeat",
        }}
      >
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          {/* philosophy */}
          <Text style={headingStyle} marginBottom="1rem" marginTop="2rem">
            {" "}
            // header Our Philosophy
          </Text>
          <hr style={dividerStyle} />

          <Text style={bodyStyle} marginBottom="0.75rem">
            Derived from the Arabic word ʿomr—meaning life—OMRÉ translates to{" "}
            <em>my life</em>.
          </Text>

          <Text style={bodyStyle} marginBottom="0.75rem">
            At OMRÉ, fragrance is not a final touch. It is the beginning. The
            first impression. The lasting presence. The unseen signature.
          </Text>

          <Text style={bodyStyle} marginBottom="0.75rem">
            Each creation is a quiet statement of elegance and intention.
          </Text>

          <Text style={bodyStyle} marginBottom="0.75rem">
            We design with purpose. Every blend is made using high
            concentrations of extrait de parfum oils, crafted to last, made to
            move with you.
          </Text>

          <Text style={bodyStyle} marginBottom="0.25rem">
            This is more than perfume.
          </Text>

          <Text style={bodyStyle} marginBottom="0.25rem">
            It's how you arrive.
          </Text>

          <Text style={bodyStyle} marginBottom="0.75rem">
            It's what you leave behind.
          </Text>

          {/* story */}
          <Text style={headingStyle} marginBottom="1rem" marginTop="2.5rem">
            {" "}
            // story Our Story
          </Text>
          <hr style={dividerStyle} />

          <Text
            style={{ ...bodyStyle, fontStyle: "italic", color: "#555" }}
            marginBottom="1rem"
          >
            A letter from the Founder
          </Text>

          <Text style={bodyStyle} marginBottom="0.75rem">
            Fragrance has always meant more to me than just scent. It's memory.
            It's presence. It's connection.
          </Text>

          <Text style={bodyStyle} marginBottom="0.75rem">
            For as long as I can remember, I've loved giving perfume as a
            gift...
          </Text>

          <Text style={bodyStyle} marginBottom="0.75rem">
            That's how OMRÉ began.
          </Text>

          <Text style={bodyStyle} marginBottom="0.75rem">
            In 2024, I started experimenting with blends I'd actually wear...
          </Text>

          <Text style={bodyStyle} marginBottom="0.75rem">
            The name naturally came to me, from the Arabic word ʿomr—life.
          </Text>

          <Text
            style={{ ...bodyStyle, fontWeight: 700 }}
            marginBottom="0.75rem"
          >
            OMRÉ means my life.
          </Text>

          <Text style={bodyStyle} marginBottom="0.75rem">
            And to this day, some scents still bring me back.
          </Text>

          <Text style={bodyStyle} marginBottom="0.75rem">
            I'm building OMRÉ into a house. One rooted in memory. Designed with
            intention. Made to last.
          </Text>

          <Text style={bodyStyle} marginBottom="0.25rem">
            Thank you for being part of it.
          </Text>

          <Text style={bodyStyle} marginBottom="0.25rem">
            With love,
          </Text>

          <Text style={{ ...bodyStyle, fontWeight: 700 }} marginBottom="1.5rem">
            The House of OMRÉ
          </Text>

          {/* closing */}
          <hr style={dividerStyle} />

          <Text style={{ ...bodyStyle, fontStyle: "italic", color: "#444" }}>
            {" "}
            // closing remark "You don't just wear OMRÉ — you live in it."
          </Text>
        </div>
      </View>
    </>
  );
}
