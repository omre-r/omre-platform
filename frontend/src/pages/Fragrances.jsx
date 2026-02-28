
// Imports for all data and commands
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { View, Card, Flex, Text, TextField, Button, Input, SwitchField, ToggleButtonGroup, ToggleButton } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { getActiveProductsReq, getFilteredProductsReq } from "../requests.js";
import Navbar from "../components/Navbar";

import LuxuryBackground from "../assets/Luxury Background2.png";
import OptionsIcon from "../assets/options_icon.png"
import SearchIcon from "../assets/search_icon.png"
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

const bodyStyle2 = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 400,
  fontSize: "1.3rem",
  letterSpacing: "0.5px",
  color: "#000000",
};
// functions //
export default function Home() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [message, setMessage] = useState("");

  // these states will be for saving filter information
  const [minimum, setMinimum] = useState("")
  const [maximum, setMaximum] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedSizes, setSelectedSizes] = useState([])
  const [selectedNotes, setSelectedNotes] = useState([])
  const [onlyFeatured, setOnlyFeatured] = useState(false)
  const [includeSearch, setIncludeSearch] = useState(false)

  const [priceErrorMsg, setPriceErrorMsg] = useState("")
  const priceErrorTimer = useRef(null)

  const [search, setSearch] = useState("")
  
  const fragranceOptions =  ["Vanilla", "Cinnamon", "Marshmallow", "Ice Cream", "Brown Sugar", "Jasmine", "Amber", "Saffron"]



// make sure it loads //
  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const data = await getActiveProductsReq();
      if (!data.success){
        throw Error(data.message || "Error getting active products");
      }
      
      //By default, sorts by featured
      const featured = [];
      const others = [];
      for (const prod of data.data.products){
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

  async function filterProducts(filters){
      try {
        const data = await getFilteredProductsReq(filters);
        if (!data.success){
          throw Error(data.message || "Error getting filtered products");
        }
        
        setProducts(data.data.products);
      } catch (err) {
        console.error(err);
        setMessage("Failed to get filtered products.");
      } finally {
        setLoadingProducts(false);
      }
  }

  function handleFilterSubmit(){
    const filters = {}
    if (minimum !== "" || maximum !== "") {
      if (minimum !== "" && maximum !== "" && Number(minimum) > Number(maximum)){
        setPriceErrorMsg("Minimum can't be greater than Maximum.")
        clearTimeout(priceErrorTimer.current)
        priceErrorTimer.current = setTimeout(() => {
          setPriceErrorMsg("")
        }, 4000)
        return
      }
      if (minimum < 0){
        setPriceErrorMsg("Negative numbers are not allowed.")
        clearTimeout(priceErrorTimer.current)
        priceErrorTimer.current = setTimeout(() => {
          setPriceErrorMsg("")
        }, 4000)
        return
      }
      filters.price = [minimum || null, maximum || null]
    }
    if (selectedSizes.length !== 0) filters.variation = selectedSizes;
    if (onlyFeatured) filters.isfeatured = true;
    if (includeSearch) filters.name = search;
    if (selectedNotes.length !== 0) filters.notes = selectedNotes;
    if (Object.keys(filters).length === 0){
      loadProducts()
      return
    }
    filterProducts(filters)
  }


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
            ...bodyStyle2,
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
        <View
        position={"relative"}>
          <TextField
            value={search}
            onChange={e => setSearch(e.target.value)}
            labelHidden
            type="text"
            placeholder="Find products..."
            textAlign={"left"}
            width={"300px"}
            style={{borderRadius:"10px", ...bodyStyle2}}
            onKeyDown={e => e.key === "Enter" && filterProducts({name: e.target.value})}
          />
          <section 
          style={{
            display: "flex",
            width:"30px", 
            paddingRight: "5px",
            overflow:"hidden",
            position:"absolute",
            right:"0",
            top: "50%",
            transform: "translateY(-50%)"}}
            onClick={e => {filterProducts({name: search})}}>
            <img src={SearchIcon} alt="search" style={{width: "100%"}} />
          </section>
        </View>

        <View 
        position={"relative"}
        padding={"2px"}
        backgroundColor={"white"}
        borderRadius={"10px"}
        style={{width: "40px"}}
        onClick={e => {e.currentTarget.blur(); setShowFilters(prev=>!prev);}}
        >
          <img src={OptionsIcon} alt="options" style={{width:"100%", display:"block"}}/>
          {showFilters && 
          <Card

          position={"absolute"}
          top={"110%"}
          left={"50%"}
          transform={"translateX(-50%)"}
          border={"1px solid"}
          borderRadius={"10px"}
          onClick={e => e.stopPropagation()}
          >
            <Flex 
            direction={"column"}
            gap={0}>
              {priceErrorMsg && 
              <Text
              color={"red"}
              lineHeight={"17px"}
              marginBottom={"5px"}>{priceErrorMsg}</Text>}
              {/* price container */}
              <Flex
              alignItems={"center"}>
                <Text
                marginRight={"auto"}>Price: </Text>
                <Input 
                min={0} 
                max={200} 
                type={"number"} 
                placeholder="Minimum"
                padding={0}
                width={"100px"}
                value={minimum}
                style={{outline: maximum !== "" && Number(minimum) > Number(maximum) ? "2px solid red" : "none"}}
                onChange={e => setMinimum(e.target.value)}></Input>
                <Input
                  min={0} 
                  max={200} 
                  type={"number"} 
                  placeholder="Maximum"
                  padding={0}
                  width={"100px"}
                  value={maximum}
                  style={{outline: maximum !== "" && Number(minimum) > Number(maximum) ? "2px solid red" : "none"}}
                  onChange={e => setMaximum(e.target.value)}>
                </Input>
              </Flex>
              <hr style={{width: "100%", marginBlock: "10px"}}/>

              {/* size container */}
              <Flex
              alignItems={"center"}>
                <Text
                marginRight={"auto"}>Size:</Text>
                <ToggleButtonGroup
                value={selectedSizes}
                onChange={v => setSelectedSizes(v)}
                isExclusive={false}
                gap={"5px"}
                >
                  <ToggleButton 
                  padding={"6px"} value="30ml">30 ml</ToggleButton>
                  <ToggleButton 
                  padding={"6px"} value="50ml">50 ml</ToggleButton>
                </ToggleButtonGroup>
              </Flex>
              <hr style={{width: "100%", marginBlock: "10px"}}/>

              {/* featured container */}
              <Flex
              alignItems={"center"}>
                <Text
                marginRight={"auto"}>Only Featured:</Text>
                <SwitchField 
                isChecked={onlyFeatured}
                onChange={e => setOnlyFeatured(e.target.checked)}>
                </SwitchField>
              </Flex>
              <hr style={{width: "100%", marginBlock: "10px"}}/>

              {/* "include search" container */}
              <Flex
              direction={"column"}
              gap={"3px"}
              alignItems={"center"}>
                <Flex
                width={"100%"}>
                  <Text
                  marginRight={"auto"}>
                    Include Search:
                  </Text>
                  <SwitchField 
                  isChecked={includeSearch}
                  onChange={e => setIncludeSearch(e.target.checked)}>
                  </SwitchField>
                </Flex>
                {includeSearch && <Text style={{fontSize: ".8rem"}}>"{search}"</Text>}
              </Flex>
              <hr style={{width: "100%", marginBlock: "10px"}}/>

              {/* notes container */}
              <Flex
              direction={'column'}>
               <Flex
                alignItems={"center"}>
                  <Text
                  marginRight={"auto"}>Notes:</Text>
                  <select 
                  name="notes" 
                  id="notes"
                  style={{
                    padding: "4px",
                    height:"100%",
                    justifySelf: "flex-start",
                    fontWeight: "bold",
                    borderRadius: "10px",
                    textAlign: "center"}} 
                  onChange={e => setSelectedNotes(prev => !prev.includes(e.target.value) && e.target.value ? [...prev, e.target.value] : prev)}
                  >
                    <option value="">Notes</option>
                    {fragranceOptions.map(f => <option key={f} disabled={selectedNotes.includes(f)} value={f}>{f}</option>)}



                  </select>
                </Flex>  
                <Flex 
                wrap={"wrap"}
                gap={0}>
                  {selectedNotes.map(note => {
                    return (
                    <Button
                    key={note}
                    padding={"3px"}
                    fontSize={".7rem"}
                    onClick={e => setSelectedNotes(prev => prev.filter(n => note !== n))}
                    >
                      {note}
                    </Button>)
                  })}
                </Flex>    
              </Flex>
              <hr style={{width: "100%", marginBlock: "10px"}}/>
              <Button 
              onClick={handleFilterSubmit}>
                Filter
              </Button>
            </Flex>
          </Card>
          }
        </View>

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