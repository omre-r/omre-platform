
// Imports for all data and commands
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { View, Card, Flex, Text, TextField, Button } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { getActiveProductsReq, getProductsReq } from "../requests.js";
import Navbar from "../components/Navbar";

import LuxuryBackground from "../assets/Luxury Background2.png";
import OptionsIcon from "../assets/options_icon.png"
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
  fontWeight: 400,
  fontSize: "1.3rem",
  letterSpacing: "0.5px",
  color: "#FFFFFF",
};

// functions //
export default function Home() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [message, setMessage] = useState("");
// make sure it loads //
  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await getActiveProductsReq();
        if (!res){
          throw Error("Error in getActiveProductsReq");
        }
        
        //default sorts by featured
        const featured = [];
        const others = [];
        for (const prod of res){
          prod.isfeatured ? featured.push(prod) : others.push(prod);
        }
        setProducts([...featured, ...others]);
      } catch (err) {
        console.error(err);
        setMessage("Failed to load products.");
      } finally {
        setLoadingProducts(false);
      }
    }

    loadProducts();
  }, []);

  return (
    <>
      <Navbar />
      <Flex  
      padding={"5px"}    
      alignItems={"center"}
      justifyContent={"center"}
      gap={"3px"}
      >
        <View
        height={"40px"}
        margin={"5px"}
        >
          <select 
          name="simple-filter" 
          id="simple-filter"
          style={{
            height:"100%",
            justifySelf: "flex-start",
            fontWeight: "bold",
            borderRadius: "10px",
            textAlign: "center"
          }}
          onChange={e => {
            switch (e.target.value){
              case "featured":{
                setProducts(prev => {
                  const featured = []
                  const others = []
                  for (const prod of prev){
                    prod.isfeatured ? featured.push(prod) : others.push(prod)
                  }
                  return [...featured, ...others]
                 })
                break
              }
              case "pricehighlow":{
                setProducts(prev => {
                  const newProducts = [...prev]
                  console.log(newProducts)
                  newProducts.sort((a, b) => Number(b.price) - Number(a.price))
                  return newProducts
                })
                break
              }
              case "pricelowhigh":{
                setProducts(prev => {
                  const newProducts = [...prev]
                  console.log(newProducts)
                  newProducts.sort((a, b) => Number(a.price) - Number(b.price))
                  return newProducts
                })
                break
              }
            }
          }}  
          >
            <option value="featured">Featured</option>
            <option value="pricehighlow">Price: High to Low</option>
            <option value="pricelowhigh">Price: Low to High</option>
          </select>
        </View>
        <TextField
          labelHidden
          type="text"
          placeholder="Find products..."
          textAlign={"left"}
          width={"300px"}
          style={{borderRadius:"10px"}}
        />
        <Button 
        padding={0}
        style={{width: "40px"}}
        >
          <img src={OptionsIcon} alt="options" style={{width:"100%", display:"block"}}/>
        </Button>
      </Flex>
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
        <Text style={headingStyle} marginBottom="5rem">
          All Fragrances
        </Text>

        <Flex wrap="wrap">
          {!loadingProducts && products.filter((prod) => prod.ishidden !== true).map((prod) => (
            <Card
              key={prod.id}
              variation="elevated"
              height="auto"
              width="18rem"
              margin="1rem"
              padding="2rem"
              backgroundColor="rgba(0, 0, 0, 0.75)"
              border="1px solid rgba(151, 33, 0, 0.72)"
              borderRadius="8px"
            >
              <Link to={`/fragrances/${prod.id}`}>
                <img
                    src={prod.images?.[0]}
                    alt={prod.name}
                    style={{
                        width: "100%",
                        height: "200px",
                        objectFit: "cover",
                        borderRadius: "10px",
                        display: "block",
                    }}
                />
                <Text style={bodyStyle} textAlign="center">
                  {prod.name}
                </Text>
                <Text
                  style={{ ...bodyStyle, fontWeight: 600 }}
                  textAlign="center"
                >
                  {prod.price}
                </Text>
              </Link>
            </Card>
          ))}
    </Flex>

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