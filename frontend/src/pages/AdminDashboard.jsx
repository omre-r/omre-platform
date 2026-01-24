// This import is for navigation links
import { Link } from "react-router-dom"; 

// Importing UI components from AWS Amplify UI React library
import { View } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

// importing the Navbar component for consistent navigation across pages
import Navbar from "../components/Navbar";


export default function AdminDashboard() {
  return (
    <>
    {/* Navbar component that provides navigation across the website */}
    <Navbar />

    {/* View container for the main content area of home page */}
    {/* Nothing important here yet just a placeholder */}
    <View
        as="div"
        ariaLabel="View example"
        backgroundColor="var(--amplify-colors-white)"
        borderRadius="8px"
        border="1px solid var(--amplify-colors-black)"
        boxShadow="3px 3px 5px 6px var(--amplify-colors-neutral-60)"
        color="var(--amplify-colors-blue-60)"
        height="4rem"
        maxWidth="100%"
        padding="1rem"
        width="100%"
    >
    Omre Dashboard
    </View>
    </>
  );
}
