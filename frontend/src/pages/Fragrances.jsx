// Imports for all data and commands
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  View,
  Card,
  Flex,
  Text,
  TextField,
  Button,
  Input,
  SwitchField,
  ToggleButtonGroup,
  ToggleButton,
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { getActiveProductsReq, getFilteredProductsReq } from "../requests.js";
import Navbar from "../components/Navbar";

import LuxuryBackground from "../assets/Luxury Background2.png";
import OptionsIcon from "../assets/options_icon.png";
import SearchIcon from "../assets/search_icon.png";

import rating0 from "../assets/ratings/0.png";
import rating1 from "../assets/ratings/1.png";
import rating2 from "../assets/ratings/2.png";
import rating3 from "../assets/ratings/3.png";
import rating4 from "../assets/ratings/4.png";
import rating5 from "../assets/ratings/5.png";
import rating6 from "../assets/ratings/6.png";
import rating7 from "../assets/ratings/7.png";
import rating8 from "../assets/ratings/8.png";
import rating9 from "../assets/ratings/9.png";
import rating10 from "../assets/ratings/10.png";
const ratings = [
  rating0,
  rating1,
  rating2,
  rating3,
  rating4,
  rating5,
  rating6,
  rating7,
  rating8,
  rating9,
  rating10,
];

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

const tabStyles = {
  // border: "1px solid",
  padding: "10px 5px",
  background: "linear-gradient(rgba(0,0,0,0), white)",
  textDecoration: "underline",
  // borderRadius: "10px",
  margin: "5px",
};
// functions //
export default function Home() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [message, setMessage] = useState("");

  // Can be All, Men's Cologne, or Women's Perfume
  const [tab, setTab] = useState("All");

  // these states will be for saving filter information
  const [minimum, setMinimum] = useState("");
  const [maximum, setMaximum] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [includeSearch, setIncludeSearch] = useState(false);
  const [simpleFilter, setSimpleFilter] = useState("featured");

  const [priceErrorMsg, setPriceErrorMsg] = useState("");
  const priceErrorTimer = useRef(null);

  const [search, setSearch] = useState("");

  const fragranceOptions = [
    "Vanilla",
    "Cinnamon",
    "Marshmallow",
    "Ice Cream",
    "Brown Sugar",
    "Jasmine",
    "Amber",
    "Saffron",
  ];

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const data = await getActiveProductsReq();
      if (!data.success) {
        throw Error(data.message || "Error getting active products");
      }
      setProducts(data.data.products);
    } catch (err) {
      console.error(err);
      setMessage("Failed to load products.");
    } finally {
      setLoadingProducts(false);
    }
  }

  async function filterProducts(filters) {
    try {
      setLoadingProducts(true);
      const data = await getFilteredProductsReq(filters);
      if (!data.success) {
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

  function getFilteredParents(listOfProducts) {
    // group products into related products
    const parents = {};
    for (const p of listOfProducts) {
      parents?.[p.parentid]
        ? parents[p.parentid].push(p)
        : (parents[p.parentid] = [p]);
    }

    // sort variations [50ml, 30ml, 70ml] => [30ml, 50ml, 70ml]
    const groups = Object.values(parents);
    for (const group of groups) {
      group.sort(
        (a, b) =>
          Number(a?.variation?.split("ml")?.[0]) -
          Number(b?.variation?.split("ml")?.[0]),
      );
    }
    let newProducts = Object.values(parents);
    // Apply simple filter 1
    switch (simpleFilter) {
      case "featured": {
        newProducts = newProducts.map((prodList) => [
          ...prodList.filter((prod) => prod.isfeatured),
          ...prodList.filter((prod) => !prod.isfeatured),
        ]);
        break;
      }
      case "pricehighlow": {
        newProducts.sort(
          (a, b) => Number(b?.[0]?.price) - Number(a?.[0]?.price),
        );
        break;
      }
      case "pricelowhigh": {
        newProducts.sort(
          (a, b) => Number(a?.[0]?.price) - Number(b?.[0]?.price),
        );
        break;
      }
    }

    // Apply simple filter 2
    if (tab === "All") {
      return newProducts;
    }
    return newProducts.map((prodList) =>
      prodList.filter((prod) => prod.type === tab),
    );
  }

  function handleFilterSubmit() {
    const filters = {};

    if (minimum !== "" || maximum !== "") {
      if (
        minimum !== "" &&
        maximum !== "" &&
        Number(minimum) > Number(maximum)
      ) {
        setPriceErrorMsg("Minimum can't be greater than Maximum.");
        clearTimeout(priceErrorTimer.current);
        priceErrorTimer.current = setTimeout(() => {
          setPriceErrorMsg("");
        }, 4000);
        return;
      }
      if (minimum < 0) {
        setPriceErrorMsg("Negative numbers are not allowed.");
        clearTimeout(priceErrorTimer.current);
        priceErrorTimer.current = setTimeout(() => {
          setPriceErrorMsg("");
        }, 4000);
        return;
      }
      filters.price = [minimum || null, maximum || null];
    }
    if (selectedSizes.length !== 0) filters.variation = selectedSizes;
    if (onlyFeatured) filters.isfeatured = true;
    if (includeSearch) filters.name = search;
    if (selectedNotes.length !== 0) filters.notes = selectedNotes;
    if (Object.keys(filters).length === 0) {
      loadProducts();
      return;
    }
    filterProducts(filters);
  }

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
        <Flex
          wrap="wrap"
          padding="1rem 1.5rem"
          alignItems="center"
          justifyContent="center"
          gap="0.9rem"
          margin="1rem auto 0 auto"
          maxWidth="980px"
          borderRadius="22px"
          marginBottom="0.5rem"
          marginTop="-2rem"
          style={{
            width: "100%",
            boxSizing: "border-box",
            background:
              "linear-gradient(145deg,  #480e0e76, rgba(20, 20, 20, 0.05))",
          }}
        >
          <View height={"40px"} margin={"5px"}>
            <select
              name="type-filter"
              id="type-filter"
              style={{
                ...bodyStyle2,
                height: "120%",
                minWidth: "190px",
                padding: "0.75rem 1rem",
                fontWeight: "600",
                borderRadius: "16px",
                textAlign: "center",
                border: "1px solid rgba(255,255,255,0.18)",
                background:
                  "linear-gradient(145deg,  #9a2424, rgba(20,20,20,0.9))",
                color: "#F8F4F0",
                boxShadow: "0 8px 18px rgba(0,0,0,0.22)",
                cursor: "pointer",
              }}
              onChange={(e) => setTab(e.target.value)}
            >
              <option style={{ color: "black" }} value="All">
                All
              </option>
              <option style={{ color: "black" }} value="Men's Cologne">
                Men's Cologne
              </option>
              <option style={{ color: "black" }} value="Women's Perfume">
                Women's Perfume
              </option>
            </select>
          </View>
          <View height={"40px"} margin={"5px"}>
            <select
              name="simple-filter"
              id="simple-filter"
              style={{
                ...bodyStyle2,
                height: "120%",
                minWidth: "190px",
                padding: "0.75rem 1rem",
                fontWeight: "600",
                borderRadius: "16px",
                textAlign: "center",
                border: "1px solid rgba(255,255,255,0.18)",
                background:
                  "linear-gradient(145deg,  #9a2424, rgba(20,20,20,0.9))",
                color: "#F8F4F0",
                boxShadow: "0 8px 18px rgba(0,0,0,0.22)",
              }}
              value={simpleFilter}
              onChange={(e) => setSimpleFilter(e.target.value)}
            >
              <option style={{ color: "black" }} value="featured">
                Featured
              </option>
              <option style={{ color: "black" }} value="pricehighlow">
                Price: High to Low
              </option>
              <option style={{ color: "black" }} value="pricelowhigh">
                Price: Low to High
              </option>
            </select>
          </View>
          <View
            position="relative"
            width="360px"
            padding="0.35rem"
            borderRadius="18px"
            style={{
              background:
                "linear-gradient(145deg,  #9a2424, rgba(20,20,20,0.9))",
              boxShadow: "0 8px 18px rgba(0,0,0,0.25)",
              border: "1px solid rgba(255,255,255,0.16)",
            }}
          >
            <TextField
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              labelHidden
              type="text"
              placeholder="Find products..."
              textAlign={"left"}
              width={"300px"}
              style={{
                width: "100%",
                height: "48px",
                padding: "0 3.2rem 0 1rem",
                borderRadius: "14px",
                border: "none",
                outline: "none",
                background: "rgba(255,248,244,0.96)",
                color: "#2B1E1A",
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 500,
                fontSize: "1.35rem",
                letterSpacing: "0.4px",
                boxSizing: "border-box",
              }}
              onKeyDown={(e) =>
                e.key === "Enter" && filterProducts({ name: e.target.value })
              }
            />
            <section
              style={{
                display: "flex",
                width: "30px",
                paddingRight: "5px",
                overflow: "hidden",
                position: "absolute",
                right: "0",
                top: "50%",
                transform: "translateY(-50%)",
              }}
              onClick={(e) => {
                filterProducts({ name: search });
              }}
            >
              <img
                src={SearchIcon}
                alt="search"
                style={{ width: "100%", filter: "brightness(0) invert(1)" }}
              />
            </section>
          </View>

          <View
            position="relative"
            width="58px"
            height="58px"
            borderRadius="16px"
            style={{
              background:
                "linear-gradient(145deg,  #9a2424, rgba(20,20,20,0.9))",
              boxShadow: "0 8px 18px rgba(0,0,0,0.25)",
              border: "1px solid rgba(255,255,255,0.16)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
            onClick={(e) => {
              e.currentTarget.blur();
              setShowFilters((prev) => !prev);
            }}
          >
            <img
              src={OptionsIcon}
              alt="options"
              style={{
                width: "30px",
                height: "30px",
                display: "block",
                filter: "brightness(0) invert(1)",
              }}
            />
            {showFilters && (
              <Card
                position={"absolute"}
                top={"110%"}
                left={"50%"}
                transform={"translateX(-50%)"}
                border={"1px solid"}
                borderRadius={"10px"}
                onClick={(e) => e.stopPropagation()}
              >
                <Flex direction={"column"} gap={0}>
                  {priceErrorMsg && (
                    <Text
                      color={"red"}
                      lineHeight={"17px"}
                      marginBottom={"5px"}
                    >
                      {priceErrorMsg}
                    </Text>
                  )}
                  {/* price container */}
                  <Flex alignItems={"center"}>
                    <Text marginRight={"auto"}>Price: </Text>
                    <Input
                      min={0}
                      max={200}
                      type={"number"}
                      placeholder="Minimum"
                      padding={0}
                      width={"100px"}
                      value={minimum}
                      style={{
                        outline:
                          maximum !== "" && Number(minimum) > Number(maximum)
                            ? "2px solid red"
                            : "none",
                      }}
                      onChange={(e) => setMinimum(e.target.value)}
                    ></Input>
                    <Input
                      min={0}
                      max={200}
                      type={"number"}
                      placeholder="Maximum"
                      padding={0}
                      width={"100px"}
                      value={maximum}
                      style={{
                        outline:
                          maximum !== "" && Number(minimum) > Number(maximum)
                            ? "2px solid red"
                            : "none",
                      }}
                      onChange={(e) => setMaximum(e.target.value)}
                    ></Input>
                  </Flex>
                  <hr style={{ width: "100%", marginBlock: "10px" }} />

                  {/* size container */}
                  <Flex alignItems={"center"}>
                    <Text marginRight={"auto"}>Size:</Text>
                    <ToggleButtonGroup
                      value={selectedSizes}
                      onChange={(v) => setSelectedSizes(v)}
                      isExclusive={false}
                      gap={"5px"}
                    >
                      <ToggleButton padding={"6px"} value="30ml">
                        30 ml
                      </ToggleButton>
                      <ToggleButton padding={"6px"} value="50ml">
                        50 ml
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Flex>
                  <hr style={{ width: "100%", marginBlock: "10px" }} />

                  {/* featured container */}
                  <Flex alignItems={"center"}>
                    <Text marginRight={"auto"}>Only Featured:</Text>
                    <SwitchField
                      isChecked={onlyFeatured}
                      onChange={(e) => setOnlyFeatured(e.target.checked)}
                    ></SwitchField>
                  </Flex>
                  <hr style={{ width: "100%", marginBlock: "10px" }} />

                  {/* "include search" container */}
                  <Flex direction={"column"} gap={"3px"} alignItems={"center"}>
                    <Flex width={"100%"}>
                      <Text marginRight={"auto"}>Include Search:</Text>
                      <SwitchField
                        isChecked={includeSearch}
                        onChange={(e) => setIncludeSearch(e.target.checked)}
                      ></SwitchField>
                    </Flex>
                    {includeSearch && (
                      <Text style={{ fontSize: ".8rem" }}>"{search}"</Text>
                    )}
                  </Flex>
                  <hr style={{ width: "100%", marginBlock: "10px" }} />

                  {/* notes container */}
                  <Flex direction={"column"}>
                    <Flex alignItems={"center"}>
                      <Text marginRight={"auto"}>Notes:</Text>
                      <select
                        name="notes"
                        id="notes"
                        style={{
                          padding: "4px",
                          height: "100%",
                          justifySelf: "flex-start",
                          fontWeight: "bold",
                          borderRadius: "10px",
                          textAlign: "center",
                        }}
                        onChange={(e) =>
                          setSelectedNotes((prev) =>
                            !prev.includes(e.target.value) && e.target.value
                              ? [...prev, e.target.value]
                              : prev,
                          )
                        }
                      >
                        <option value="">Notes</option>
                        {fragranceOptions.map((f) => (
                          <option
                            key={f}
                            disabled={selectedNotes.includes(f)}
                            value={f}
                          >
                            {f}
                          </option>
                        ))}
                      </select>
                    </Flex>
                    <Flex wrap={"wrap"} gap={0}>
                      {selectedNotes.map((note) => {
                        return (
                          <Button
                            key={note}
                            padding={"3px"}
                            fontSize={".7rem"}
                            onClick={(e) =>
                              setSelectedNotes((prev) =>
                                prev.filter((n) => note !== n),
                              )
                            }
                          >
                            {note}
                          </Button>
                        );
                      })}
                    </Flex>
                  </Flex>
                  <hr style={{ width: "100%", marginBlock: "10px" }} />
                  <Button onClick={handleFilterSubmit}>Filter</Button>
                </Flex>
              </Card>
            )}
          </View>
        </Flex>
        <Text style={headingStyle} marginBottom="2rem">
          All Fragrances
        </Text>

        <Flex
          wrap="wrap"
          justifyContent="center"
          alignItems="flex-start"
          gap="2rem"
          maxWidth="1400px"
          margin="0 auto"
        >
          {!loadingProducts &&
            getFilteredParents(products).map((prodList) => {
              if (prodList.length === 0) return null;
              const prod = prodList?.[0];
              if (!prod) {
                return null;
              }
              return (
                <Card
                  key={prod.id}
                  variation="elevated"
                  width="16rem"
                  minHeight="26rem"
                  padding="1.75rem"
                  border="1px solid rgba(190, 160, 150, 0.18)"
                  borderRadius="15px"
                  boxShadow="0 14px 28px rgba(0,0,0,0.22)"
                  style={{
                    background:
                      "linear-gradient(145deg,  #9a2424, rgba(20,20,20,0.9))",
                  }}
                >
                  <Link
                    to={`/fragrances/${prod.parentid}?variation=${prod.variation}`}
                    style={{ textDecoration: "none", height: "100%" }}
                  >
                    <Flex
                      direction="column"
                      justifyContent="space-between"
                      height="100%"
                    >
                      <View>
                        <img
                          src={prod.images?.[0]}
                          alt={prod.name}
                          style={{
                            width: "100%",
                            objectFit: "cover",
                            borderRadius: "10px",
                            display: "block",
                            marginBottom: "1rem",
                          }}
                        />
                        <View>
                          <Text style={bodyStyle} textAlign="center">
                            {prod.name}
                          </Text>
                        </View>
                      </View>
                      <View color={"white"}>
                        {prod.review_count !== 0 ? (
                          <Flex
                            gap={"12px"}
                            alignItems={"center"}
                            width={"90%"}
                          >
                            <img
                              style={{ width: "100%" }}
                              src={ratings[Math.round(prod.review_average * 2)]}
                              alt=""
                            />
                            {prod.review_count}
                          </Flex>
                        ) : (
                          <Text style={{ ...bodyStyle, flex: "1" }}>
                            Be the first to review!
                          </Text>
                        )}
                      </View>
                      <Text style={{ ...bodyStyle, fontWeight: 600 }}>
                        ${prod.price}
                      </Text>
                    </Flex>
                  </Link>
                </Card>
              );
            })}
        </Flex>

        <Flex justifyContent="flex-end">
          <Link to="/fragrances" style={{ textDecoration: "none" }}>
            <View
              style={{
                padding: "0.9rem 2.2rem",
                border: "1px solid rgba(255,255,255,0.35)",
                borderRadius: "28px",
                background:
                  "linear-gradient(145deg,  #9a2424, rgba(20,20,20,0.9))",
                cursor: "pointer",
                boxShadow: "0 8px 18px rgba(0,0,0,0.35)",
                transition: "all 0.2s ease",
              }}
            >
              <Text style={bodyStyle}>Shop All</Text>
            </View>
          </Link>
        </Flex>
      </View>
    </>
  );
}
