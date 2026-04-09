import { useEffect, useState } from "react";
import {
  Card,
  View,
  Flex,
  Text,
  Button,
  SelectField,
  Grid,
  SliderField,
  Table,
  TableRow,
  TableCell,
  TableHead,
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import {
  getActiveProductsReq,
  saveBlendReq,
  getUserSavedBlendsReq,
  deleteUserBlendReq,
  createCartItemReq,
} from "../requests.js";
import Navbar from "../components/Navbar";
import LuxuryBackground from "../assets/Luxury Background2.png";
import Omre2 from "../assets/Mixology/OMRE2.png";
import BottleFill from "../components/BottleFill";
import { useToast } from "../components/ToastContext";

/*
Custom Styles ------------------------------------------------------------------------------------------------
- Custom heading and body style using downloaded font
- Will be used through out to edit aspects of cards
*/
const luxuryHeadingStyle = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 800,
  fontSize: "2.5rem",
  letterSpacing: "0.5px",
};
const luxuryHeadingStyle2 = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 1000,
  fontSize: "2.0rem",
  letterSpacing: "0.5px",
};
const luxurySubheadingStyle = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 700,
  fontSize: "1.8rem",
  letterSpacing: "0.3px",
};
const luxuryBodyStyle = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 500,
  fontSize: "1.1rem",
  letterSpacing: "0.2px",
};

// Styles to change font and outline of table headers and body ------------------------------
const tableHeaderStyle = {
  ...luxuryBodyStyle,
  fontSize: "2rem",
  fontWeight: 600,
  letterSpacing: "0.3px",
  backgroundColor: "transparent",
  border: "none",
  boxShadow: "none",
  outline: "none",
  color: "black",
};
const tableBodyStyle = {
  ...luxuryBodyStyle,
  fontSize: "1.5rem",
  fontWeight: 500,
  letterSpacing: "0.2px",
  backgroundColor: "transparent",
  border: "none",
  boxShadow: "none",
  outline: "none",
  color: "#ffffff",
};

const tableViewStyle = {
  padding: "1.2rem 1.5rem",
  border: "1px solid rgba(255,255,255,0.35)",
  borderRadius: "14px",
  background: "linear-gradient(145deg,  #9a2424, rgba(20,20,20,0.9))",
  boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100px",
  height: "100%",
  width: "100%",
  boxSizing: "border-box",
};

const mixologyButtonStyling = {
  ...luxuryBodyStyle,
  fontSize: "1rem",
  padding: "0.9rem 2.2rem",
  border: "1px solid rgba(255,255,255,0.35)",
  borderRadius: "28px",
  background: "linear-gradient(145deg,  #9a2424, rgba(20,20,20,0.9))",
  color: "#FFFFFF",
  cursor: "pointer",
  boxShadow: "0 8px 18px rgba(0,0,0,0.35)",
  transition: "all 0.2s ease",
};

const buttonStyling = {
  ...luxuryBodyStyle,
  fontSize: "1.2rem",
  padding: ".9rem .2rem",
  border: "2px solid rgba(0, 0, 0)",
  borderRadius: "10px",
  background:
    "linear-gradient(145deg, rgba(90, 20, 20, 0.92), rgba(40, 35, 35, 0.82))",
  color: "#FFFFFF",
  cursor: "pointer",
  boxShadow: "0 6px 14px rgba(0,0,0,0.22)",
  transition: "all 0.2s ease",
};

export default function Mixology() {
  const { toast } = useToast();
  const [blendLoading, setBlendLoading] = useState(false); // prevents double clicks

  // Set cologne choices --------------------------------------------------------
  const [cologne1Id, setCologne1Id] = useState("");
  const [cologne2Id, setCologne2Id] = useState("");
  const [cologne3Id, setCologne3Id] = useState("");
  const [sizeMl, setSizeMl] = useState("30");

  // Third Cologne Selected Mode -------------------------------------------------------
  const [thirdCologneSelectedMode, setThirdCologneSelectedMode] =
    useState(false);

  // Load and set products -------------------------------------------------------
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadTable, setLoadTable] = useState(false);

  // Show instructions when i is clicked -------------------------------------------
  const [showInstructions, setShowInstructions] = useState(false);

  // Loading blends -------------------------------------------------------
  // Calling load blends on button click, getting user saved blends from backend and setting.
  const [loadedBlends, setLoadedBlends] = useState([]);
  async function loadBlends() {
    let userid;
    for (let key of Object.keys(localStorage)) {
      if (key.includes("idToken")) {
        const idToken = localStorage.getItem(key);
        const base64 = idToken.split(".")[1];
        const decoded = JSON.parse(atob(base64));
        userid = decoded.sub;
        break;
      }
    }

    try {
      const data = await getUserSavedBlendsReq(userid);
      if (!data.success) {
        throw new Error(data.message);
      }
      setLoadedBlends(data.data.blends);
    } catch (error) {
      toast(error.message || "Error loading saved blends.", "error");
    }
  }

  // Max and min percentages for 2 fragrance and 3 fragrance modes
  const MIN_PCT = 5;
  const MAX_PCT = 95;

  // Percentage of each cologne in the mix, default to 50/50 for two cologne mix
  const [fragrancepct1, setfragrancePct1] = useState(50);
  const [fragrancepct2, setfragrancePct2] = useState(50);
  const fragrancepct3 = thirdCologneSelectedMode
    ? Math.max(MIN_PCT, 100 - fragrancepct1 - fragrancepct2)
    : 0;

  // Clamp function to ensure percentages stay within bounds and total 100% when 3rd cologne selected ----------------------
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  // Changing fragrance 1 percentage ----------------------
  const handleFragrance1PctChange = (value) => {
    // 2 Fragrance mode --------------------------------
    if (!thirdCologneSelectedMode) {
      // Making sure between the set bounds and that they add to 100%
      // Math example:
      // Value is 60 for fragrance 1, then fragrance 2 will be set to 40 to add to 100%
      const p1 = clamp(value, MIN_PCT, MAX_PCT);
      setfragrancePct1(p1);
      setfragrancePct2(100 - p1);
      return;
    }

    // 3 Fragrance mode -------------------------------- ------
    // Math example:
    // If value is 60 for fragrance 1
    // Min of fragrance 1 will be 5
    // Max of fragrance 1 will be 95
    const minP1 = MIN_PCT;
    const maxP1 = 100 - MIN_PCT - fragrancepct2;
    // Making sure between the set bounds and that fragrance 3 is at least 5% (so fragrance 1 + fragrance 2 is at most 95%)
    const p1 = clamp(value, minP1, maxP1);
    setfragrancePct1(p1);
    const minP2 = MIN_PCT;
    const maxP2 = 100 - MIN_PCT - p1;
    setfragrancePct2((prevP2) => clamp(prevP2, minP2, maxP2));
  };

  // If 3rd cologne selected, changing fragrance 2 percentage ----------------------
  // Will be able to now slide the percentage and it will have change fragrance 3
  const handleFragrance2PctChange = (value) => {
    if (!thirdCologneSelectedMode) {
      return;
    }
    const minP2 = MIN_PCT;
    const maxP2 = 100 - MIN_PCT - fragrancepct1;
    setfragrancePct2(clamp(value, minP2, maxP2));
  };

  // If third is toggled set initial fragrance percentages accordingly
  const toggleThird = () => {
    setThirdCologneSelectedMode((prev) => {
      const next = !prev;
      if (next) {
        setfragrancePct1(34);
        setfragrancePct2(33);
      } else {
        setCologne3Id("");
        setfragrancePct1(50);
        setfragrancePct2(50);
      }
      return next;
    });
  };

  // Making sure that a product that is already selected in another slot cannot be selected again to prevent duplicate selections ----------------------
  const isAlreadyPicked = (productId, slotNumber) => {
    // List of id's of currently selected colognes in the other slots
    const picked = [
      slotNumber != 1 ? cologne1Id : null,
      slotNumber != 2 ? cologne2Id : null,
      slotNumber != 3 ? cologne3Id : null,
    ];
    // Returns true or false if the product id is in the list of picked colognes for the other slots
    return picked.includes(productId);
  };

  // Get product ID from product object, accounting for different possible key names ---------------------------
  function getProductId(product) {
    return product.productid || product.product_id || product.id;
  }

  // Clean product name some products use - and – so we need to split by them to remove the inspired by stuff -------------------
  function cleanProductName(name) {
    if (!name) return "Unknown";
    return name.replace(/\s*[-–]\s*Inspired by.*$/i, "").trim();
  }

  // Grab the product name by using the ID ------------------------------------------
  // Remove the inspired by text splitting the string
  function getProductNameById(productId) {
    if (!productId) {
      return "";
    }
    // Find the product in the products list that matches the id, accounting for different possible key names for the id in the product object
    const match = products.find(
      (p) => String(getProductId(p)) === String(productId),
    );
    // clean product name removing the inspired by stuff
    return cleanProductName(match?.name);
  }

  // Load products from backend ---------------------------------------
  async function loadProducts() {
    setLoadingProducts(true);
    try {
      const data = await getActiveProductsReq();
      if (!data.success) {
        throw new Error(data.message);
      }
      setProducts(data.data.products);
    } catch (error) {
      toast(error.message || "Error loading products.", "error");
    } finally {
      setLoadingProducts(false);
    }
  }

  async function handleDeleteBlend(blendId) {
    let userid;
    for (let key of Object.keys(localStorage)) {
      if (key.includes("idToken")) {
        const idToken = localStorage.getItem(key);
        const base64 = idToken.split(".")[1];
        const decoded = JSON.parse(atob(base64));
        userid = decoded.sub;
        break;
      }
    }

    try {
      const data = await deleteUserBlendReq(userid, blendId);
      if (!data.success) {
        toast(data.message || "Failed to delete blend.", "error");
        return;
      }
      // Remove deleted blend from loaded blends to update table
      // This is done here after a successful delete request to the backend to ensure the frontend state matches the backend data
      setLoadedBlends((prev) => prev.filter((b) => b.id !== blendId));

      toast("Blend deleted successfully!", "success");
    } catch (err) {
      toast("Failed to delete blend.", "error");
    }
  }

  // Builds the blend payload from current state to send to backend
  function buildBlendPayload() {
    let userid;
    for (let key of Object.keys(localStorage)) {
      if (key.includes("idToken")) {
        const idToken = localStorage.getItem(key);
        const base64 = idToken.split(".")[1];
        const decoded = JSON.parse(atob(base64));
        userid = decoded.sub;
        break;
      }
    }
    return {
      userid,
      frag1_productid: cologne1Id,
      frag2_productid: cologne2Id,
      frag3_productid:
        thirdCologneSelectedMode && cologne3Id ? cologne3Id : null,
      frag1_pct: fragrancepct1,
      frag2_pct: fragrancepct2,
      frag3_pct: thirdCologneSelectedMode ? fragrancepct3 : null,
      size_ml: Number(sizeMl),
    };
  }

  // Frontend validation before hitting the backend
  function validateBlendSelections() {
    if (!cologne1Id || !cologne2Id) {
      toast("Please select at least 2 fragrances.", "error");
      return false;
    }
    if (thirdCologneSelectedMode && !cologne3Id) {
      toast("Please select a 3rd fragrance or remove it.", "error");
      return false;
    }
    return true;
  }

  async function handleSaveBlend() {
    if (!validateBlendSelections()) return;
    setBlendLoading(true);

    try {
      const data = await saveBlendReq(buildBlendPayload());
      if (!data.success) {
        toast(data.message || "Failed to save blend.", "error");
        return;
      }
      toast("Blend saved successfully!", "success");
    } catch (err) {
      toast("Failed to save blend.", "error");
    } finally {
      setBlendLoading(false);
    }
  }

  async function handleAddToCart() {
    if (!validateBlendSelections()) return;
    setBlendLoading(true);

    try {
      const blendPayload = buildBlendPayload();

      // Save blend first to get a persistent blend ID
      const saveRes = await saveBlendReq(blendPayload);
      if (!saveRes.success) {
        toast(saveRes.message || "Failed to save blend.", "error");
        return;
      }
      const blendId = saveRes.data.blend.id;
      if (!blendId) {
        toast("Failed getting blendId.", "error");
        return;
      }

      // createCartItem now handles the stock check
      const cartRes = await createCartItemReq({
        customerid: blendPayload.userid,
        itemid: blendId,
        type: "blend",
      });

      if (cartRes.stockUnavailable) {
        toast(cartRes.message || "Not enough stock for this blend.", "error");
        return;
      }
      if (!cartRes.success) {
        toast(cartRes.message || "Failed to add blend to cart.", "error");
        return;
      }

      toast("Blend added to cart!", "success");
    } catch (err) {
      toast("Failed to add blend to cart.", "error");
    } finally {
      setBlendLoading(false);
    }
  }

  // Taking a saved blend and adding it to the cart ---------------------------------------
  // Making sure that we create the payload, check userid, product stock,
  async function handleAddSavedBlendToCart(savedBlend) {
    setBlendLoading(true);

    try {
      let userid;
      for (let key of Object.keys(localStorage)) {
        if (key.includes("idToken")) {
          const idToken = localStorage.getItem(key);
          const base64 = idToken.split(".")[1];
          const decoded = JSON.parse(atob(base64));
          userid = decoded.sub;
          break;
        }
      }
      if (!userid) {
        toast("User not found. Please log in again.", "error");
        return;
      }

      // Pass existing blend ID directly — no new blend row created
      const cartRes = await createCartItemReq({
        customerid: userid,
        itemid: savedBlend.id,
        type: "blend",
      });

      if (cartRes.stockUnavailable) {
        toast(cartRes.message || "Not enough stock for this blend.", "error");
        return;
      }
      if (!cartRes.success) {
        toast(cartRes.message || "Failed to add blend to cart.", "error");
        return;
      }

      toast("Blend added to cart!", "success");
    } catch (err) {
      console.error(err);
      toast("Failed to add blend to cart.", "error");
    } finally {
      setBlendLoading(false);
    }
  }
  // Colors for the liquid in the bottl ---------------------------------------------------
  // Mock for now, fragrances may include color details in the backend in the future
  const color1 = "#b07ac4";
  const color2 = "#e3615b";
  const color3 = "#a12d0f";

  // Load products on component mount ---------------------------------------
  useEffect(() => {
    loadProducts();
  }, []);

  // Getting the sorted list of products ------------------------------------------
  const sortedProducts = [...products].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

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
        <Text style={luxuryHeadingStyle} marginTop="-2.5rem">
          Mixology
        </Text>
        <Flex direction="column" alignItems="center" gap="0.5rem">
          <Text
            style={luxurySubheadingStyle}
            marginTop="-.5rem"
            textAlign="center"
          >
            Create your own custom fragrance blend by selecting up to three of
            your favorite fragrances!
          </Text>
          <Button
            style={mixologyButtonStyling}
            onClick={() => setShowInstructions((prev) => !prev)}
          >
            <Text style={{ ...luxuryBodyStyle, color: "#FFFFFF" }}>
              {showInstructions ? "Hide Instructions" : "How to Use Mixology"}
            </Text>
          </Button>
        </Flex>
        {showInstructions && (
          <Flex justifyContent="center" marginTop="1rem" marginBottom="1rem">
            <View
              style={{
                width: "820px",
                maxWidth: "90%",
                padding: "2rem 2.5rem",
                background:
                  "linear-gradient(145deg, #480e0ee2, rgba(20,20,20,0.88))",
                borderRadius: "18px",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
              }}
            >
              <Text
                style={{
                  ...luxurySubheadingStyle,
                  fontSize: "1.5rem",
                  color: "#f0e6dc",
                  textAlign: "center",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  marginBottom: "1.5rem",
                  display: "block",
                  borderBottom: "1px solid rgba(255,255,255,0.15)",
                  paddingBottom: "0.75rem",
                }}
              >
                How to Use Mixology
              </Text>

              {[
                "Choose a bottle size — 30ML or 50ML.",
                "Select your first two fragrances from the dropdown menus.",
                "Adjust the sliders to control how much of each fragrance is used.",
                '(Optional) Click "Add 3rd Fragrance" for a more complex blend.',
                'Click "Add to Cart" to purchase or "Save Fragrance" to store it in your profile.',
                'Click "Load Blends" to view or reuse blends you previously saved.',
              ].map((step, i) => (
                <Flex
                  key={i}
                  alignItems="flex-start"
                  gap="1rem"
                  marginBottom="1rem"
                >
                  <View
                    style={{
                      minWidth: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "rgba(151,33,0,0.72)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Text
                      style={{
                        ...luxuryBodyStyle,
                        color: "#fff",
                        fontSize: "1rem",
                        fontWeight: 700,
                      }}
                    >
                      {i + 1}
                    </Text>
                  </View>
                  <Text
                    style={{
                      ...luxuryBodyStyle,
                      color: "rgba(240,230,220,0.9)",
                      fontSize: "1.15rem",
                      lineHeight: "1.6",
                      paddingTop: "0.2rem",
                    }}
                  >
                    {step}
                  </Text>
                </Flex>
              ))}
            </View>
          </Flex>
        )}
        <Flex direction="column" alignItems="center" gap="1.25rem">
          <View
            style={{
              position: "relative",
              width: "600px",
              maxWidth: "600px",
            }}
          >
            <View
              style={{
                position: "absolute",
                left: "50%",
                top: "55.5%",
                transform: "translate(-50%, -50%)",
                // Below will directly adjust the bottle fill size
                width: "194.6px",
                height: "211px",
                zIndex: 2, // In front of the bottle image
                pointerEvents: "none",
              }}
            >
              <BottleFill
                p1={fragrancepct1}
                p2={fragrancepct2}
                p3={fragrancepct3}
                color1={color1}
                color2={color2}
                color3={color3}
                threeFragrances={thirdCologneSelectedMode}
              />
            </View>
            <img
              src={Omre2}
              alt="OmreBottle"
              style={{
                width: "75%",
                height: "auto",
                zIndex: 1,
                position: "relative",
                display: "block",
                margin: "0 auto",
              }}
            />
          </View>
          <View>
            <Grid
              templateColumns={{ base: "1fr", large: "160px 1fr 1fr 1fr" }}
              gap="1rem"
              width="100%"
              maxWidth="1100px"
              alignItems="start"
            >
              <View>
                <SelectField
                  style={luxuryBodyStyle}
                  descriptiveText="Select fragrance size."
                  variation="quiet"
                  size="small"
                  value={sizeMl}
                  onChange={(e) => setSizeMl(e.target.value)}
                >
                  <option value="30">30ML</option>
                  <option value="50">50ML</option>
                </SelectField>
              </View>

              <Flex direction="column" gap="0.35rem">
                <SelectField
                  style={luxuryBodyStyle}
                  variation="quiet"
                  size="small"
                  descriptiveText="Select fragrance 1"
                  value={cologne1Id}
                  onChange={(e) => setCologne1Id(e.target.value)}
                >
                  <option
                    // Default non selectable placeholder
                    value=""
                    disabled
                    hidden
                  >
                    {/* Removed text as prof doesnt want placeholders */}
                    {/* Select a fragrance */}
                  </option>
                  {sortedProducts.map((product) => (
                    <option
                      key={getProductId(product)}
                      value={getProductId(product)}
                      // Disable option if already selected in another cologne slot to prevent duplicate selections
                      disabled={isAlreadyPicked(getProductId(product), 1)}
                    >
                      {cleanProductName(product.name)}
                    </option>
                  ))}
                </SelectField>
                <SliderField
                  style={luxuryBodyStyle}
                  label={"Fragrance 1"}
                  min={0}
                  max={100}
                  value={fragrancepct1}
                  onChange={handleFragrance1PctChange}
                  formatValue={(value) => `${value}%`}
                ></SliderField>
              </Flex>

              <Flex direction="column" gap="0.35rem">
                <SelectField
                  style={luxuryBodyStyle}
                  variation="quiet"
                  size="small"
                  descriptiveText="Select fragrance 2"
                  value={cologne2Id}
                  onChange={(e) => setCologne2Id(e.target.value)}
                >
                  <option value="" disabled hidden></option>
                  {sortedProducts.map((product) => (
                    <option
                      key={getProductId(product)}
                      value={getProductId(product)}
                      disabled={isAlreadyPicked(getProductId(product), 2)}
                    >
                      {cleanProductName(product.name)}
                    </option>
                  ))}
                </SelectField>
                <SliderField
                  style={luxuryBodyStyle}
                  label={"Fragrance 2"}
                  min={0}
                  max={100}
                  value={fragrancepct2}
                  onChange={
                    thirdCologneSelectedMode
                      ? handleFragrance2PctChange
                      : undefined
                  }
                  disabled={!thirdCologneSelectedMode}
                  formatValue={(value) => `${value}%`}
                ></SliderField>
              </Flex>

              <Flex
                className={!thirdCologneSelectedMode ? "mixology-disabled" : ""}
                direction="column"
                gap="0.35rem"
              >
                <SelectField
                  style={luxuryBodyStyle}
                  variation="quiet"
                  size="small"
                  disabled={!thirdCologneSelectedMode}
                  descriptiveText="Select fragrance 3"
                  value={cologne3Id}
                  onChange={(e) => setCologne3Id(e.target.value)}
                >
                  <option value="" disabled hidden></option>
                  {sortedProducts.map((product) => (
                    <option
                      key={getProductId(product)}
                      value={getProductId(product)}
                      disabled={isAlreadyPicked(getProductId(product), 3)}
                    >
                      {cleanProductName(product.name)}
                    </option>
                  ))}
                </SelectField>
                <SliderField
                  style={luxuryBodyStyle}
                  label={"Fragrance 3"}
                  min={0}
                  max={100}
                  value={fragrancepct3}
                  disabled={true}
                  formatValue={(value) => `${value}%`}
                ></SliderField>
              </Flex>
            </Grid>
            <Flex gap="1rem" marginTop="1rem" justifyContent="center">
              <Button style={mixologyButtonStyling} onClick={toggleThird}>
                <Text style={{ ...luxuryBodyStyle, color: "#FFFFFF" }}>
                  {thirdCologneSelectedMode
                    ? "Remove 3rd Fragrance"
                    : "Add 3rd Fragrance"}
                </Text>
              </Button>
              <Button
                style={mixologyButtonStyling}
                isLoading={blendLoading}
                onClick={handleAddToCart}
              >
                <Text style={{ ...luxuryBodyStyle, color: "#FFFFFF" }}>
                  Add to Cart
                </Text>
              </Button>
              <Button
                style={mixologyButtonStyling}
                isLoading={blendLoading}
                onClick={handleSaveBlend}
              >
                <Text style={{ ...luxuryBodyStyle, color: "#FFFFFF" }}>
                  Save Fragrance
                </Text>
              </Button>
              <Button
                // Can load and hide blends depending on click -----------------------
                style={mixologyButtonStyling}
                onClick={async () => {
                  if (!loadTable) {
                    await loadBlends();
                  }
                  setLoadTable((prev) => !prev);
                }}
              >
                <Text style={{ ...luxuryBodyStyle, color: "#FFFFFF" }}>
                  {loadTable ? "Hide blends" : "Load blends"}
                </Text>
              </Button>
            </Flex>
          </View>

          {loadTable && (
            <View marginTop="1rem">
              {/* If no blends are currently saved to users profile */}
              {loadedBlends.length === 0 ? (
                <Text style={luxuryBodyStyle}>
                  No saved blends yet. Create one above and press “Save
                  Fragrance”.
                </Text>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell style={tableHeaderStyle}>
                        Your Saved Blends
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  {loadedBlends.map((blend) => (
                    <TableRow
                      key={blend.id}
                      style={{
                        borderTop: "1px solid rgba(0,0,0,0.15)",
                      }}
                    >
                      <TableCell style={tableBodyStyle}>
                        <View
                          style={{
                            ...tableViewStyle,
                            margin: "0 auto",
                            width: "75%",
                            textAlign: "left",
                            alignItems: "flex-start",
                            justifyContent: "flex-start",
                            minHeight: "unset",
                            padding: "1.8rem",
                          }}
                        >
                          <View width="100%">
                            <View marginBottom="2rem">
                              <Flex
                                direction="row"
                                gap="1rem"
                                justifyContent="flex-start"
                                alignItems="stretch"
                                wrap="wrap"
                                marginBottom="1.25rem"
                              >
                                {/* Building a list of the fragrances by productID and percetange ------------------------------------------ */}
                                {[
                                  {
                                    productId: blend.frag1_productid,
                                    pct: blend.frag1_pct,
                                  },
                                  {
                                    productId: blend.frag2_productid,
                                    pct: blend.frag2_pct,
                                  },
                                  // if fragrance 3 exists then add it to the array otherwise skip it
                                  ...(blend.frag3_productid
                                    ? [
                                        {
                                          productId: blend.frag3_productid,
                                          pct: blend.frag3_pct,
                                        },
                                      ]
                                    : []),
                                ].map((frag, index) => {
                                  // Then we loop through every item of our previously created array
                                  const matchedProduct = products.find(
                                    // Look through products array to find matching product id to get the fragrance name and image for each fragrance in the blend
                                    (p) =>
                                      String(getProductId(p)) ===
                                      String(frag.productId),
                                  );
                                  if (!matchedProduct) return null;
                                  return (
                                    <View
                                      key={index}
                                      style={{
                                        width: "200px",
                                        padding: "1rem",
                                        borderRadius: "16px",
                                        background: "rgba(255,255,255,0.06)",
                                        border:
                                          "1px solid rgba(255,255,255,0.15)",
                                        boxShadow:
                                          "0 4px 10px rgba(0,0,0,0.18)",
                                        textAlign: "left",
                                      }}
                                    >
                                      {matchedProduct.images?.[0] && (
                                        <View
                                          style={{
                                            borderRadius: "14px",
                                            overflow: "hidden",
                                            border:
                                              "2px solid rgba(0,0,0,0.55)",
                                            marginBottom: "0.75rem",
                                          }}
                                        >
                                          <img
                                            src={matchedProduct.images[0]}
                                            alt={matchedProduct.name}
                                            style={{
                                              width: "120%",
                                              height: "160px",
                                              objectFit: "cover",
                                              display: "block",
                                            }}
                                          />
                                        </View>
                                      )}

                                      <Text
                                        style={{
                                          ...luxuryBodyStyle,
                                          color: "#FFFFFF",
                                          fontSize: "1.2rem",
                                          lineHeight: "1.35",
                                        }}
                                      >
                                        ✦ {matchedProduct.name}
                                      </Text>

                                      <Text
                                        style={{
                                          ...luxuryBodyStyle,
                                          color: "#FFFFFF",
                                          fontSize: "1.2rem",
                                          marginTop: "0.2rem",
                                        }}
                                      >
                                        Percentage: {frag.pct}%
                                      </Text>
                                    </View>
                                  );
                                })}
                              </Flex>

                              <Text
                                style={{
                                  ...luxuryBodyStyle,
                                  color: "#FFFFFF",
                                  fontSize: "1.5rem",
                                }}
                              >
                                Size: {blend.size_ml}ml
                              </Text>
                            </View>
                          </View>
                          {/* Ability to add blend to cart or delete from profile -------------------------------------------------- */}
                          <Flex
                            direction="row"
                            gap="2rem"
                            justifyContent="center"
                            alignItems="center"
                            width="100%"
                          >
                            <View
                              style={{
                                ...buttonStyling,
                                border: "2px solid #000000",
                                cursor: "pointer",
                                background:
                                  "linear-gradient(145deg, #00ff91, rgba(40, 35, 35, 0.82))",
                                padding: ".5rem 1rem",
                              }}
                              onClick={() => handleAddSavedBlendToCart(blend)}
                            >
                              <Text
                                style={{
                                  ...luxuryBodyStyle,
                                  color: "#ffffff",
                                  fontSize: "1.5rem",
                                  fontWeight: 500,
                                }}
                              >
                                Add to Cart
                              </Text>
                            </View>
                            <View
                              style={{
                                ...buttonStyling,
                                border: "2px solid #8f0000",
                                cursor: "pointer",
                                padding: ".5rem 1rem",
                                background:
                                  "linear-gradient(145deg, #e22424, rgba(20,20,20,0.92))",
                              }}
                              onClick={() => {
                                handleDeleteBlend(blend.id);
                              }}
                            >
                              <Text
                                style={{
                                  ...luxuryBodyStyle,
                                  color: "#ffffff",
                                  fontSize: "1.5rem",
                                  fontWeight: 500,
                                }}
                              >
                                Delete Blend
                              </Text>
                            </View>
                          </Flex>
                        </View>
                      </TableCell>
                    </TableRow>
                  ))}
                </Table>
              )}
            </View>
          )}
        </Flex>
      </View>
    </>
  );
}
