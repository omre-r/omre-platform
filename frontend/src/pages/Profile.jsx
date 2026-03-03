import Navbar from "../components/Navbar";
import { View, Card, Flex, Text, Grid, Heading, ToggleButton } from "@aws-amplify/ui-react";
import LuxuryBackground from "../assets/Luxury Background2.png";
import { useEffect, useState } from "react";

// Fonts ----------------------------------------------
const luxuryHeadingStyle = {
    fontFamily: "'Cormorant Garamond', serif",
    fontWeight: 800,
    fontSize: "2.5rem",
    letterSpacing: "0.5px",
};
const luxurySubheadingStyle = {
    fontFamily: "'Cormorant Garamond', serif",
    fontWeight: 600,
    fontSize: "1.6rem",   
    letterSpacing: "0.3px",
};
const luxuryBodyStyle = {
    fontFamily: "'Cormorant Garamond', serif",
    fontWeight: 500,
    fontSize: "1.1rem",   
    letterSpacing: "0.2px",
};

export default function Profile() {
    const [message, setMessage] = useState("");
    const [firstName, setfirstName] = useState("");
    const [activeTab, setActiveTab] = useState("overview");    
    const [selectedNotes, setSelectedNotes] = useState([]); 

    // Toggle Note -----------------------------------------------------------
    // Once note is toggled you take that note and add/remove it from selectedNotes array
    // Can toggle multiple notes
    // Toggles a note in selectedNotes
    const toggleNote = (note) => {
        setSelectedNotes((prev) => {
            if (prev.includes(note)) 
                return prev.filter((n) => n !== note);
            return [...prev, note];
        });
    };


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
                {/* TODO: Implementation of showing the users first name will be here
                    Make sure that I implement where if user name doesnt load properly 
                    just make it show different message that doesnt require name
                    */}
                <Text 
                    style={luxuryHeadingStyle}
                    marginTop="1rem">
                    Welcome "FIRSTNAME"!
                </Text>
                <Flex
                    direction="row"
                    justifyContent="center"
                    gap="5rem"
                    marginTop="2rem"
                    >
                    {[
                    { key: "overview", label: "Overview" },
                    { key: "orders", label: "Orders" },
                    { key: "mixes", label: "Saved Mixes" },
                    { key: "preferences", label: "Preferred Fragrances" },].map((tab) => (
                    <Text
                        key={tab.key}
                        style={{
                            ...luxurySubheadingStyle,
                            borderBottom: activeTab === tab.key ? "2px solid black" : "2px solid transparent",
                            paddingBottom: "0.25rem",
                        }}
                        onClick={() => setActiveTab(tab.key)}>
                    {tab.label}
                    </Text>
                ))}
                </Flex>
                <View
                    marginTop="3rem"
                    padding="2rem"
                    maxWidth="1200px"
                    marginLeft="auto"
                    marginRight="auto"
                    style={{
                        backgroundColor: "#300a0a38",
                        borderRadius: "16px",
                        minHeight: "500px",
                    }}
                    >
                    {activeTab === "overview" && (
                        <Text style={luxuryBodyStyle}>
                            Overview
                        </Text>
                    )}

                    {activeTab === "orders" && (
                        <Text style={luxuryBodyStyle}>
                            Orders
                        </Text>
                    )}

                    {activeTab === "mixes" && (
                        <Text style={luxuryBodyStyle}>
                            Saved mixes
                        </Text>
                    )}

                    {activeTab === "preferences" && (
                        <View>
                            <Heading level={3} 
                                color="#2B1E1A" 
                                style={luxuryBodyStyle}
                                >
                                {"Which notes are you drawn to?"}
                            </Heading>

                            <Grid
                                templateColumns="repeat(2, 1fr)"
                                gap="0.5rem"
                                marginBottom="1rem">
                                <ToggleButton isPressed={selectedNotes.includes("Vanilla")} onClick={() => toggleNote("Vanilla")}>Vanilla</ToggleButton>
                                <ToggleButton isPressed={selectedNotes.includes("Rose")} onClick={() => toggleNote("Rose")}>Rose</ToggleButton>
                                <ToggleButton isPressed={selectedNotes.includes("Oud")} onClick={() => toggleNote("Oud")}>Oud</ToggleButton>
                                <ToggleButton isPressed={selectedNotes.includes("Bergamot")} onClick={() => toggleNote("Bergamot")}>Bergamot</ToggleButton>
                                <ToggleButton isPressed={selectedNotes.includes("Sandalwood")} onClick={() => toggleNote("Sandalwood")}>Sandalwood</ToggleButton>
                                <ToggleButton isPressed={selectedNotes.includes("Jasmine")} onClick={() => toggleNote("Jasmine")}>Jasmine</ToggleButton>
                                <ToggleButton isPressed={selectedNotes.includes("Cedarwood")} onClick={() => toggleNote("Cedarwood")}>Cedarwood</ToggleButton>
                                <ToggleButton isPressed={selectedNotes.includes("Amber")} onClick={() => toggleNote("Amber")}>Amber</ToggleButton>
                            </Grid>
                        </View>
                    )}
                </View>
            </View>
        </>
    );
}