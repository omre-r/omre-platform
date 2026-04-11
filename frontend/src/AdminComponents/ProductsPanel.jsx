import { useEffect, useState, useRef } from "react";
import {
  Card,
  Flex,
  Text,
  Button,
  View,
  TextField,
  TextAreaField,
  SwitchField,
  Grid,
  SelectField,
} from "@aws-amplify/ui-react";

import {
  getProductReq,
  getFilteredProductsReq,
  updateProductReq,
  updateProductStockReq,
  deleteProductReq,
  getProductsReq,
  createProductReq,
  createProductFlowReq_LOCAL,
  uploadAndGetURlsReq,
} from "../requests.js";

import OptionsIcon from "../assets/options_icon.png";
import SearchIcon from "../assets/search_icon.png";
import EditIcon from "../assets/edit_icon.png";
import { RefreshCw } from "lucide-react";
import { useToast } from "../components/ToastContext";

// Custom Styling for fonts and amplify ui --------------------------------------
const bodyStyle2 = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 400,
  fontSize: "1.3rem",
  letterSpacing: "0.5px",
  color: "#000000",
};

const luxuryHeadingStyle = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 700,
  fontSize: "2.5rem",
  letterSpacing: "0.5px",
};
const luxuryBodyStyle = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 500,
  fontSize: "1.2rem",
  letterSpacing: "0.2px",
};
const compactStyle = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 200,
  fontSize: "1rem",
  letterSpacing: "0.1px",
};
const MODES = {
  IDLE: "idle",
  ADD: "add",
  APPEND: "append",
  EDIT: "edit",
  REMOVE: "remove",
};

const buttonStyling = {
  ...luxuryBodyStyle,
  fontSize: "1.2rem",
  padding: "0.5rem 1.2rem",
  border: "2px solid rgba(0, 0, 0)",
  borderRadius: "28px",
  background:
    "linear-gradient(145deg, rgba(90, 20, 20, 0.92), rgba(40, 35, 35, 0.82))",
  color: "#FFFFFF",
  cursor: "pointer",
  boxShadow: "0 6px 14px rgba(0,0,0,0.22)",
  transition: "all 0.2s ease",
};

// Default Product Draft   ---------------------------------------
// When adding we set our draft to start with this where it holds no information
// When cancelling an add or finishing an add will set the draft to default after to remove any data being saved
const defaultProductDraft = {
  type: "",
  name: "",
  variation: "",
  price: "",
  stock_ml: "",
  description: ``,
  notes: {
    top: [],
    heart: [],
    base: [],
  },
  isfeatured: false,
  ishidden: false,
  images: [],
  review_count: 0,
  review_average: 0,
};

// Products Admin Panel ---------------------------------------------
// Will give user the option to add, edit, and remove products from this dashboard
export default function ProductsPanel() {
  // Products states ----------------------------------------------------
  const [products, setProducts] = useState([]);
  // Selected Product will be shown in right card
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const { toast } = useToast();

  // UI mode switch ---------------------------------------
  // Will switch depending on editing, removing, or adding
  const [activeMode, setActiveMode] = useState(MODES.IDLE);

  // Set draft based on default draft or product editing and use that information --------------------------------
  const [draft, setDraft] = useState(defaultProductDraft);

  const [showImages, setShowImages] = useState(false);
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  //search and filter
  const [search, setSearch] = useState("");
  const [minimum, setMinimum] = useState("");
  const [maximum, setMaximum] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [includeSearch, setIncludeSearch] = useState(false);

  const [priceErrorMsg, setPriceErrorMsg] = useState("");
  const priceErrorTimer = useRef(null);

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

  // When editing or adding to draft, name and type cannot be left blank but other information can
  const canSave = draft.type.trim() !== "" && draft.name.trim() !== "";

  // Lets us handle inconsistent ID field names across backend -----------------------------------
  function getProductId(product) {
    return product.productid || product.product_id || product.id;
  }

  // Form Change Handler --------------------------------------------------------------------------
  function setDraftField(field, value) {
    setDraft((prevState) => ({
      ...prevState,
      [field]: value,
    }));
  }

  // Takes product information and creates draft based on it ------------------------------------------------
  function makeDraftFromProduct(product) {
    return {
      type: product.type ?? "",
      name: product.name ?? "",
      variation: product.variation ?? "",
      price: product.price != null ? String(product.price) : "",
      stock_ml: product.stock_ml != null ? String(product.stock_ml) : "",
      description: product.description ?? ``,
      notes: {
        top: product.notes?.top ?? [],
        heart: product.notes?.heart ?? [],
        base: product.notes?.base ?? [],
      },
      isfeatured: product.isfeatured,
      ishidden: product.ishidden,
      images: product.images,
      review_count: product.review_count,
      review_average: product.review_average,
    };
  }

  // For images uploaded when editing or creating ------------------------------------------------------
  function onImagesSelected(e) {
    const MAX_SIZE = 1024 * 1024 * 5;
    const numAllowedFiles = 5 - draft.images.length;
    const newFiles = Array.from(e.target.files || []).slice(0, numAllowedFiles);
    e.target.value = "";
    if (newFiles.length === 0 || numAllowedFiles <= 0) return;

    const validFiles = [];

    //check no duplicates
    for (const file of newFiles) {
      // when files is not empty, theuser is prompted to upload.

      //no unique ids available, so just comparing name + size + last modified
      if (
        files.some(
          (f) =>
            `${f.name}${f.size}${f.lastModified}` ===
            `${file.name}${file.size}${file.lastModified}`,
        )
      ) {
        continue;
      }
      if (file.size >= MAX_SIZE) {
        setFiles([]);
        toast("You can't upload images over 5MB.", "error");

        for (const f of validFiles) {
          URL.revokeObjectURL(defaultProductDraft.url);
        }
        return;
      }
      validFiles.push(file);
      file.url = URL.createObjectURL(file);
    }
    if (validFiles.length === 0) {
      return;
    }
    setFiles((prev) => [...prev, ...validFiles]);
  }

  async function uploadImages() {
    if (files.length === 0) return;

    const newFiles = [...files];
    for (const f of newFiles) {
      URL.revokeObjectURL(f.url);
      delete f.url;
    }
    //files => urls
    /*files are tagged temporary on S3, 
        so unused images will be deleted in 2 days (may change)*/
    setIsUploading(true);
    const imageurls = await uploadAndGetURlsReq(newFiles, "products");
    setIsUploading(false);
    if (!imageurls) {
      setFiles([]);
      toast("Failed to upload images.", "error");
    }
    setDraft((prev) => {
      return {
        ...prev,
        images: [...prev.images, ...imageurls],
      };
    });
    setFiles([]);
  }

  //Used when rearranging images
  async function handleImageDrag(event, i) {
    event.preventDefault();
    const elem = event.currentTarget;
    const scrollContainer = elem.parentElement;

    const initialElemRect = elem.getBoundingClientRect();
    initialElemRect.index = i;

    const initialX = event.clientX;
    const initialScrollLeft = scrollContainer.scrollLeft;
    const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
    let newPosition = i;
    let scrollLeftInterval;
    let scrollRightInterval;

    let lastClientX = event.clientX;
    const startDrag = (e) => {
      lastClientX = e.clientX;

      const shift =
        e.clientX - initialX + (scrollContainer.scrollLeft - initialScrollLeft);
      elem.style.transform = `translate(${shift}px,0)`;

      //get sorted list of rects of image containers in increasing order
      let allImageRects = Array.from(
        document.querySelectorAll(".product-image-draggable"),
      )
        .filter((item) => item !== elem)
        .map((item) => {
          const rect = item.getBoundingClientRect();
          rect.index = Number(item.dataset.index);
          return rect;
        });
      allImageRects.push(initialElemRect);
      allImageRects.sort((a, b) => a.right - b.right);

      //checks who is closest to the mouse
      let closest = [99999999, i];
      for (const rect of allImageRects) {
        const distance = Math.abs(
          rect.left + (rect.right - rect.left) / 2 - e.clientX,
        );
        if (distance < closest[0]) {
          closest = [distance, rect.index];
        }
      }
      newPosition = closest[1];

      //move scroll container if near left/right end
      /*main reason for complexity is that when mouse stops moving,
             so does dragged image and scrolling */
      const scrollRect = scrollContainer.getBoundingClientRect();
      if (e.clientX < scrollRect.left + 150) {
        clearInterval(scrollRightInterval);
        scrollRightInterval = null;

        scrollLeftInterval = scrollLeftInterval
          ? scrollLeftInterval
          : setInterval(() => {
              scrollContainer.scrollLeft -= 4;
              const shift =
                lastClientX -
                initialX +
                (scrollContainer.scrollLeft - initialScrollLeft);
              elem.style.transform = `translate(${shift}px,0)`;
            }, 16);
      } else if (e.clientX > scrollRect.right - 150) {
        clearInterval(scrollLeftInterval);
        scrollLeftInterval = null;

        scrollRightInterval = scrollRightInterval
          ? scrollRightInterval
          : setInterval(() => {
              if (scrollContainer.scrollLeft > maxScroll) return;
              scrollContainer.scrollLeft += 4;
              const shift =
                lastClientX -
                initialX +
                (scrollContainer.scrollLeft - initialScrollLeft);
              elem.style.transform = `translate(${shift}px,0)`;
            }, 16);
      } else {
        clearInterval(scrollLeftInterval);
        clearInterval(scrollRightInterval);
        scrollLeftInterval = null;
        scrollRightInterval = null;
      }
    };
    const endDrag = (e) => {
      elem.style.zIndex = "auto";
      elem.style.transform = ``;
      clearInterval(scrollLeftInterval);
      clearInterval(scrollRightInterval);
      if (newPosition !== i) {
        const newImages = [...draft.images];
        const temp1 = newImages[newPosition];
        newImages[newPosition] = newImages[i];
        newImages[i] = temp1;
        setDraft((prev) => {
          return {
            ...prev,
            images: newImages,
          };
        });
      }
      document.removeEventListener("mousemove", startDrag);
      document.removeEventListener("mouseup", endDrag);
    };
    elem.style.zIndex = "1000";
    document.addEventListener("mousemove", startDrag);
    document.addEventListener("mouseup", endDrag);
  }

  // Form helper for #'s
  function validateNumbers(price, stock_ml) {
    if (price && (!Number.isFinite(price) || price < 0))
      return "Price must be a valid number.";
    if (stock_ml && (!Number.isFinite(stock_ml) || stock_ml < 0))
      return "Stock must be a valid number.";
    return null;
  }

  function resetToIdle() {
    for (const file of files) {
      URL.revokeObjectURL(file.url);
    }
    setFiles([]);
    setSelectedProduct(null);
    setDraft(defaultProductDraft);
    setActiveMode(MODES.IDLE);
  }

  function resetToAdd() {
    for (const file of files) {
      URL.revokeObjectURL(file.url);
    }
    setFiles([]);
    setSelectedProduct(null);
    setDraft(defaultProductDraft);
    setActiveMode(MODES.ADD);
  }

  //Prefills fields. For when we want a new product based off another and of a different variation
  function resetToAppend(prod) {
    for (const file of files) {
      URL.revokeObjectURL(file.url);
    }
    setFiles([]);
    setDraft({
      ...makeDraftFromProduct(prod),
      variation: "",
      images: [],
    });
    setActiveMode(MODES.APPEND);
  }

  function resetToEdit(prod) {
    for (const file of files) {
      URL.revokeObjectURL(file.url);
    }
    setFiles([]);
    setSelectedProduct(prod);
    setDraft(makeDraftFromProduct(prod));
    setActiveMode(MODES.EDIT);
  }

  function groupRelevantElements(productList) {
    const parents = {};
    for (const p of productList) {
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
    return Object.values(parents);
  }

  async function filterProducts(filters) {
    setLoadingProducts(true);
    try {
      const data = await getFilteredProductsReq({ ...filters });
      if (!data.success) {
        throw Error(data.message || "Error getting filtered products");
      }
      setProducts(groupRelevantElements(data.data.products));
    } catch (error) {
      toast(error.message || "Failed to get filtered products.", "error");
    } finally {
      setLoadingProducts(false);
    }
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
      resetToIdle();
      loadProducts();
      return;
    }
    resetToIdle();
    filterProducts(filters);
  }

  // Left card  loading---------------------------------------------------------------
  async function loadProducts() {
    setLoadingProducts(true);
    try {
      const data = await getProductsReq();
      if (!data.success) {
        throw new Error(data.message);
      }
      setProducts(groupRelevantElements(data.data.products));
    } catch (error) {
      toast(error.message || "Error loading products.", "error");
    } finally {
      setLoadingProducts(false);
    }
  }

  // Removing a product ---------------------------------------------------------------------------------
  // get the product id of the select product and send the id to the backend deleteProductReq function
  async function removeProduct() {
    if (!selectedProduct) {
      return;
    }
    try {
      const id = getProductId(selectedProduct);
      if (!id) {
        toast("ID Error in removing products.", "error");
        return;
      }

      const data = await deleteProductReq(id);
      if (!data.success) {
        throw new Error(data.message);
      }
      toast("Deleted product: " + selectedProduct.name, "success");
      resetToIdle();
      await loadProducts();
    } catch (error) {
      toast(error.message || "Error removing product.", "error");
    }
  }

  // Hide a product from website display -----------------------------------
  // Gather the products id and check the status if it is hidden or not, will update status on button click
  async function hideProduct() {
    try {
      if (!selectedProduct) {
        toast("No product selected.", "error");
        return;
      }
      const id = getProductId(selectedProduct);
      if (!id) {
        toast("Product does not have id.", "error");
        return;
      }
      // Check if product is hidden, will hide or unhide depending on which
      const hiddenStatus = !selectedProduct.ishidden;

      const data = await updateProductReq(id, { ishidden: hiddenStatus });
      if (!data.success) {
        throw new Error(data.message);
      }
      toast(
        `${hiddenStatus ? "Hidden" : "Unhidden"}: ${selectedProduct.name}`,
        "success",
      );
      await loadProducts();
      resetToIdle();
    } catch (error) {
      toast(error.message || "Error hiding product.", "error");
    }
  }

  // Adding a product to the backend ---------------------------------------------------------------------------
  // Type and name of product must be required but other information is not mandatory at this point
  async function addProduct() {
    try {
      if (!canSave) {
        toast("Type and name are required.", "error");
        return;
      }
      if (draft.images.length === 0) {
        toast("At least 1 image is required.", "error");
        return;
      }
      // Pull info from draft
      const form = {
        parentid: activeMode === MODES.APPEND ? selectedProduct.parentid : null,
        type: draft.type.trim(),
        name: draft.name.trim(),
        variation: draft.variation.trim(),
        price: draft.price === "" ? 0 : Number(draft.price),
        stock_ml: draft.stock_ml === "" ? 0 : Number(draft.stock_ml),
        description: draft.description.trim(),
        // To match the backend format of the notes, we have top, heart, and base
        // which will be respectively their own scents.
        notes: {
          top: draft.notes.top,
          heart: draft.notes.heart,
          base: draft.notes.base,
        },
        isfeatured: !!draft.isfeatured,
        ishidden: !!draft.ishidden,
        images: draft.images ?? [],
        review_count: draft.review_count === 0 ? 0 : Number(draft.review_count),
        review_average:
          draft.review_average === 0 ? 0 : Number(draft.review_average),
      };
      const validNums = validateNumbers(form.price, form.stock_ml);
      if (validNums) {
        toast(validNums, "error");
        return;
      }
      if (!form.variation) {
        toast("Please select a variation.", "error");
        return;
      }
      const data = await createProductReq(form);
      if (!data.success) {
        throw new Error(data.message);
      }
      const newProduct = data.data.product;
      toast(`Created: ${newProduct.name}`, "success");
      resetToIdle();
      await loadProducts();
    } catch (error) {
      toast(error.message || "Error adding product.", "error");
    }
  }

  // When updating a products information ---------------------------------------------------------
  // Gather the product id and create the form based on information already entered
  async function updateProduct() {
    try {
      if (!selectedProduct) {
        return;
      }
      const id = getProductId(selectedProduct);
      if (!id) {
        toast("Product does not have id.", "error");
        return;
      }
      if (!canSave) {
        toast("Type and name are required.", "error");
        return;
      }
      // makeDraftFromProduct function will be called and that will be setting the draft with the existing info
      const form = {
        type: draft.type.trim(),
        name: draft.name.trim(),
        variation: draft.variation.trim(),
        price: draft.price === "" ? 0 : Number(draft.price),
        description: draft.description.trim(),
        notes: {
          top: draft.notes.top,
          heart: draft.notes.heart,
          base: draft.notes.base,
        },
        isfeatured: !!draft.isfeatured,
        ishidden: !!draft.ishidden,
        images: draft.images,
      };
      const validNums = validateNumbers(form.price, null);
      if (validNums) {
        toast(validNums, "error");
        return;
      }
      // Only include images if user actually selected new files
      if (draft.images.length > 0) {
        form.images = draft.images;
      }
      const data = await updateProductReq(id, form);
      if (!data.success) {
        throw new Error(data.message);
      }
      toast(`Updated: ${form.name}`, "success");
      await loadProducts();
      resetToIdle();
    } catch (error) {
      toast(error.message || "Error updating product.", "error");
    }
  }

  // stock updates get a specific function as they are outside normal flow --------------------------------------------------
  async function updateProductStock() {
    try {
      if (!selectedProduct) {
        return;
      }

      // makeDraftFromProduct function will be called and that will be setting the draft with the existing info
      const form = {
        stock_ml: draft.stock_ml === "" ? 0 : Number(draft.stock_ml),
      };
      const validNums = validateNumbers(null, form.stock_ml);
      if (validNums) {
        toast(validNums, "error");
        return;
      }
      const data = await updateProductStockReq(
        selectedProduct.parentid,
        form.stock_ml,
      );
      if (!data.success) {
        throw new Error(data.message);
      }
      await loadProducts();
      resetToIdle();
    } catch (error) {
      toast(error.message || "Error updating product.", "error");
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  if (loadingProducts) {
    return (
      <Text style={{ ...luxuryBodyStyle, color: "#ffffff" }}>
        Loading Products...
      </Text>
    );
  }

  // List of sorted products ---------------------------------------
  // Have to do this way because groupOfRelevantElements because a is grouped array of product variations (30ml, 50ml)
  const sortedProducts = [...products].sort((a, b) =>
    a[0].name.localeCompare(b[0].name),
  );

  return (
    <Flex direction={"column"} height="100%">
      <Flex
        direction="row"
        gap="1rem"
        flex="1"
        alignItems="stretch"
        height="100%"
      >
        {/* Left card holding products ---------------------------------------------*/}
        {/* Will be shown as a list where each product is clickable  */}
        <Card
          flex="1.2"
          height="100%"
          padding="1rem"
          style={{
            background:
              "linear-gradient(145deg, rgba(255, 240, 235, 0.35), rgba(245, 225, 218, 0.28))",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(120, 80, 70, 0.18)",
            borderRadius: "22px",
            overflow: "visible",
            zIndex: 20,
          }}
        >
          <Flex direction="column" height="100%">
            <Flex
              justifyContent="space-between"
              alignItems="center"
              wrap="wrap"
            >
              {/* Search bar for products ---------------------------------------- */}
              <Flex
                padding={"10px"}
                alignItems={"center"}
                justifyContent={"center"}
                gap={"6px"}
                style={{ zIndex: "1000", background: "#ffffff00" }}
              >
                <View position={"relative"}>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      resetToIdle();
                      filterProducts({ name: search });
                    }}
                    style={{
                      width: "300px",
                      height: "50px",
                      paddingLeft: "18px",
                      paddingRight: "42px",
                      borderRadius: "8px",
                      border: "2px solid rgba(0, 0, 0)",
                      background:
                        "linear-gradient(145deg, rgba(90, 20, 20, 0.92), rgba(40, 35, 35, 0.82))",
                      color: "#FFFFFF",
                      caretColor: "#FFFFFF",
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: "1.3rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />

                  {!search && (
                    <Text
                      style={{
                        position: "absolute",
                        left: "18px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "white",
                        pointerEvents: "none",
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: "1.3rem",
                      }}
                    >
                      Find products...
                    </Text>
                  )}
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
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      resetToIdle();
                      filterProducts({ name: search });
                    }}
                  >
                    <img
                      src={SearchIcon}
                      alt="search"
                      style={{
                        width: "20px",
                        height: "20px",
                        filter: "brightness(0) invert(1)",
                      }}
                    />
                  </section>
                </View>
                <View
                  position={"relative"}
                  padding={"8px"}
                  backgroundColor={"white"}
                  borderRadius={"10px"}
                  style={{
                    ...buttonStyling,
                    border: "2px solid rgba(0, 0, 0)",
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
                      width: "32px",
                      height: "32px",
                      display: "block",
                      filter: "brightness(0) invert(1)",
                    }}
                  />

                  {/* Filter section ----------------------------------------------------------- */}
                  {showFilters && (
                    <Card
                      position={"absolute"}
                      top={"110%"}
                      left={"50%"}
                      transform={"translateX(-50%)"}
                      borderRadius={"18px"}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        background:
                          "linear-gradient(160deg, rgba(52,6,6,0.98), rgba(12,7,7,0.99))",
                        border: "1px solid rgba(255,255,255,0.1)",
                        boxShadow: "0 24px 60px rgba(0,0,0,0.65)",
                        backdropFilter: "blur(14px)",
                        minWidth: "310px",
                        zIndex: 9999,
                        padding: "1.25rem 1.5rem",
                      }}
                    >
                      <Flex direction={"column"} gap={0}>
                        {priceErrorMsg && (
                          <Text
                            style={{
                              color: "#ff8080",
                              lineHeight: "17px",
                              marginBottom: "8px",
                              fontFamily: "'Cormorant Garamond', serif",
                              fontSize: "0.95rem",
                            }}
                          >
                            {priceErrorMsg}
                          </Text>
                        )}

                        {/* price container */}
                        <Flex alignItems={"center"} gap={"8px"}>
                          <Text
                            marginRight={"auto"}
                            style={{
                              color: "#F8F4F0",
                              fontFamily: "'Cormorant Garamond', serif",
                              fontSize: "1.1rem",
                              letterSpacing: "0.3px",
                            }}
                          >
                            Price:
                          </Text>
                          <input
                            min={0}
                            max={200}
                            type={"number"}
                            placeholder="Min"
                            value={minimum}
                            onChange={(e) => setMinimum(e.target.value)}
                            style={{
                              width: "78px",
                              padding: "7px 8px",
                              borderRadius: "9px",
                              border:
                                maximum !== "" &&
                                Number(minimum) > Number(maximum)
                                  ? "1.5px solid #ff6b6b"
                                  : "1px solid rgba(255,255,255,0.2)",
                              background: "rgba(255,248,244,0.1)",
                              color: "#F8F4F0",
                              fontFamily: "'Cormorant Garamond', serif",
                              fontSize: "1rem",
                              outline: "none",
                              textAlign: "center",
                            }}
                          />
                          <input
                            min={0}
                            max={200}
                            type={"number"}
                            placeholder="Max"
                            value={maximum}
                            onChange={(e) => setMaximum(e.target.value)}
                            style={{
                              width: "78px",
                              padding: "7px 8px",
                              borderRadius: "9px",
                              border:
                                maximum !== "" &&
                                Number(minimum) > Number(maximum)
                                  ? "1.5px solid #ff6b6b"
                                  : "1px solid rgba(255,255,255,0.2)",
                              background: "rgba(255,248,244,0.1)",
                              color: "#F8F4F0",
                              fontFamily: "'Cormorant Garamond', serif",
                              fontSize: "1rem",
                              outline: "none",
                              textAlign: "center",
                            }}
                          />
                        </Flex>
                        <hr
                          style={{
                            width: "100%",
                            marginBlock: "12px",
                            border: "none",
                            borderTop: "1px solid rgba(255,255,255,0.1)",
                          }}
                        />

                        {/* size container */}
                        <Flex alignItems={"center"}>
                          <Text
                            marginRight={"auto"}
                            style={{
                              color: "#F8F4F0",
                              fontFamily: "'Cormorant Garamond', serif",
                              fontSize: "1.1rem",
                            }}
                          >
                            Size:
                          </Text>
                          <Flex gap={"6px"}>
                            {["30ml", "50ml"].map((size) => (
                              <button
                                key={size}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSizes((prev) =>
                                    prev.includes(size)
                                      ? prev.filter((s) => s !== size)
                                      : [...prev, size],
                                  );
                                }}
                                style={{
                                  padding: "5px 14px",
                                  borderRadius: "20px",
                                  cursor: "pointer",
                                  fontFamily: "'Cormorant Garamond', serif",
                                  fontSize: "1rem",
                                  border: "1px solid rgba(255,255,255,0.3)",
                                  background: selectedSizes.includes(size)
                                    ? "rgba(210,175,140,0.88)"
                                    : "rgba(255,255,255,0.08)",
                                  color: selectedSizes.includes(size)
                                    ? "#2B1E1A"
                                    : "#F8F4F0",
                                  fontWeight: selectedSizes.includes(size)
                                    ? 700
                                    : 400,
                                  transition: "all 0.15s ease",
                                }}
                              >
                                {size === "30ml" ? "30 ml" : "50 ml"}
                              </button>
                            ))}
                          </Flex>
                        </Flex>
                        <hr
                          style={{
                            width: "100%",
                            marginBlock: "12px",
                            border: "none",
                            borderTop: "1px solid rgba(255,255,255,0.1)",
                          }}
                        />

                        {/* featured container */}
                        <Flex alignItems={"center"}>
                          <Text
                            marginRight={"auto"}
                            style={{
                              color: "#F8F4F0",
                              fontFamily: "'Cormorant Garamond', serif",
                              fontSize: "1.1rem",
                            }}
                          >
                            Only Featured:
                          </Text>
                          <SwitchField
                            isChecked={onlyFeatured}
                            onChange={(e) => setOnlyFeatured(e.target.checked)}
                          />
                        </Flex>
                        <hr
                          style={{
                            width: "100%",
                            marginBlock: "12px",
                            border: "none",
                            borderTop: "1px solid rgba(255,255,255,0.1)",
                          }}
                        />

                        {/* include search container */}
                        <Flex
                          direction={"column"}
                          gap={"3px"}
                          alignItems={"center"}
                        >
                          <Flex width={"100%"}>
                            <Text
                              marginRight={"auto"}
                              style={{
                                color: "#F8F4F0",
                                fontFamily: "'Cormorant Garamond', serif",
                                fontSize: "1.1rem",
                              }}
                            >
                              Include Search:
                            </Text>
                            <SwitchField
                              isChecked={includeSearch}
                              onChange={(e) =>
                                setIncludeSearch(e.target.checked)
                              }
                            />
                          </Flex>
                          {includeSearch && (
                            <Text
                              style={{
                                fontSize: ".85rem",
                                color: "rgba(210,175,140,0.9)",
                                fontStyle: "italic",
                                fontFamily: "'Cormorant Garamond', serif",
                              }}
                            >
                              "{search}"
                            </Text>
                          )}
                        </Flex>
                        <hr
                          style={{
                            width: "100%",
                            marginBlock: "12px",
                            border: "none",
                            borderTop: "1px solid rgba(255,255,255,0.1)",
                          }}
                        />

                        {/* notes container */}
                        <Flex direction={"column"} gap={"6px"}>
                          <Flex alignItems={"center"}>
                            <Text
                              marginRight={"auto"}
                              style={{
                                color: "#F8F4F0",
                                fontFamily: "'Cormorant Garamond', serif",
                                fontSize: "1.1rem",
                              }}
                            >
                              Notes:
                            </Text>
                            <select
                              name="notes"
                              id="notes"
                              style={{
                                padding: "6px 10px",
                                borderRadius: "10px",
                                textAlign: "center",
                                fontFamily: "'Cormorant Garamond', serif",
                                fontSize: "1rem",
                                fontWeight: "600",
                                background: "rgba(255,248,244,0.1)",
                                color: "#F8F4F0",
                                border: "1px solid rgba(255,255,255,0.25)",
                                cursor: "pointer",
                                outline: "none",
                              }}
                              onChange={(e) =>
                                setSelectedNotes((prev) =>
                                  !prev.includes(e.target.value) &&
                                  e.target.value
                                    ? [...prev, e.target.value]
                                    : prev,
                                )
                              }
                            >
                              <option
                                value=""
                                style={{
                                  background: "#3a0808",
                                  color: "#F8F4F0",
                                }}
                              >
                                Notes
                              </option>
                              {fragranceOptions.map((f) => (
                                <option
                                  key={f}
                                  disabled={selectedNotes.includes(f)}
                                  value={f}
                                  style={{
                                    background: "#3a0808",
                                    color: "#F8F4F0",
                                  }}
                                >
                                  {f}
                                </option>
                              ))}
                            </select>
                          </Flex>
                          <Flex wrap={"wrap"} gap={"4px"}>
                            {selectedNotes.map((note) => (
                              <button
                                key={note}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedNotes((prev) =>
                                    prev.filter((n) => note !== n),
                                  );
                                }}
                                style={{
                                  padding: "3px 10px",
                                  borderRadius: "16px",
                                  background: "rgba(210,175,140,0.18)",
                                  color: "#F8F4F0",
                                  border: "1px solid rgba(210,175,140,0.4)",
                                  cursor: "pointer",
                                  fontFamily: "'Cormorant Garamond', serif",
                                  fontSize: "0.88rem",
                                }}
                              >
                                {note} ×
                              </button>
                            ))}
                          </Flex>
                        </Flex>
                        <hr
                          style={{
                            width: "100%",
                            marginBlock: "12px",
                            border: "none",
                            borderTop: "1px solid rgba(255,255,255,0.1)",
                          }}
                        />

                        <button
                          onClick={handleFilterSubmit}
                          style={{
                            width: "100%",
                            padding: "10px",
                            background:
                              "linear-gradient(135deg, rgba(210,175,140,0.92), rgba(180,140,100,0.8))",
                            color: "#2B1E1A",
                            border: "none",
                            borderRadius: "10px",
                            fontFamily: "'Cormorant Garamond', serif",
                            fontSize: "1.2rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            letterSpacing: "1px",
                          }}
                        >
                          Filter
                        </button>
                      </Flex>
                    </Card>
                  )}
                </View>
                <View
                  position={"relative"}
                  onClick={async () => {
                    resetToIdle();
                    await loadProducts();
                  }}
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "10px",
                    border: "2px solid black",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                    background:
                      "linear-gradient(145deg, rgba(90, 20, 20, 0.92), rgba(40, 35, 35, 0.82))",
                    boxShadow: "0 6px 14px rgba(0,0,0,0.22)",
                  }}
                >
                  <RefreshCw color="white" size={22} />
                </View>
              </Flex>
              <Flex
                direction="row"
                gap=".95rem"
                wrap="wrap"
                justifyContent="flex-end"
              >
                {/* Button : add mode -------------------------------------------------- */}
                <View
                  position={"relative"}
                  padding="9.5px"
                  borderRadius={"10px"}
                  disabled={!selectedProduct}
                  onClick={resetToAdd}
                  style={{
                    ...buttonStyling,
                    color: "White",
                    background:
                      "linear-gradient(145deg, #00ff91, rgba(40, 35, 35, 0.82))",
                    border: "2px solid rgba(0, 0, 0)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  Add
                </View>
                {/* Button : remove mode ---------------------------------------------------- */}
                <View
                  position={"relative"}
                  padding="9.5px"
                  borderRadius={"10px"}
                  disabled={!selectedProduct}
                  onClick={() => {
                    if (!selectedProduct) return;
                    setActiveMode(MODES.REMOVE);
                  }}
                  style={{
                    ...buttonStyling,
                    color: selectedProduct ? "White" : "black",
                    border: "2px solid rgba(0, 0, 0)",
                    background: selectedProduct
                      ? "linear-gradient(145deg, #e22424, rgba(40, 35, 35, 0.82))"
                      : "linear-gradient(145deg, #888, #555)",
                    cursor: selectedProduct ? "pointer" : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  Remove
                </View>
              </Flex>
            </Flex>

            <View
              className="hide-scrollbar"
              overflow="auto"
              height="25rem"
              marginTop="1rem"
              padding="0.5rem"
            >
              {sortedProducts.map((prodList) => {
                const isSelected =
                  selectedProduct?.parentid === prodList[0].parentid;

                return (
                  <Flex
                    direction={"column"}
                    gap="0.6rem"
                    marginBottom="0.6rem"
                    key={prodList[0].parentid}
                  >
                    <Button
                      style={{
                        ...buttonStyling,
                        width: "100%",
                        justifyContent: "flex-start",
                        marginBottom: ".4rem",
                        border: isSelected
                          ? "2px solid gold"
                          : ".5px solid #111",
                        boxShadow: isSelected
                          ? "0 0 12px gold"
                          : buttonStyling.boxShadow,
                        transform: isSelected ? "scale(1.02)" : "scale(1)",
                        textAlign: "left",
                        borderRadius: "6px",
                        background:
                          prodList[0].stock_ml < 1000
                            ? "linear-gradient(145deg, #ff4d4d, #cc0000)"
                            : buttonStyling.background,
                        color:
                          prodList[0].stock_ml < 1000
                            ? "#ffffff"
                            : buttonStyling.color,
                      }}
                      onClick={() => {
                        if (!isSelected) {
                          const id = getProductId(prodList[0]);
                          if (!id) {
                            toast("Product ID missing.", "error");
                            return;
                          }
                          resetToEdit(prodList[0]);
                        }
                      }}
                    >
                      <Text
                        style={{
                          ...luxuryBodyStyle,
                          fontWeight: "600",
                          color:
                            prodList[0].stock_ml < 1000 ? "#ffffff" : "#FFFFFF",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                          textAlign: "left",
                          flex: 1,
                        }}
                      >
                        {prodList[0].name} — {prodList[0].stock_ml} mL{" "}
                        {prodList[0].stock_ml < 1000 && "(LOW!)"}
                      </Text>
                    </Button>

                    {isSelected && (
                      <Flex>
                        {/* Everything inside stays exactly the same */}
                        <Flex
                          alignItems={"center"}
                          justifyContent={"left"}
                          gap={"5px"}
                        >
                          <Text color="White">Stock</Text>
                          <input
                            style={{
                              ...buttonStyling,
                              width: "100px",
                              padding: "5px 10px",
                              borderRadius: "5px",
                            }}
                            color="White"
                            placeholder="Stock (ml)"
                            type="number"
                            value={draft.stock_ml}
                            onChange={(e) =>
                              setDraftField("stock_ml", e.target.value)
                            }
                          />
                          {Math.floor(draft.stock_ml) !==
                            Math.floor(selectedProduct.stock_ml) && (
                            <Button
                              onClick={updateProductStock}
                              style={{
                                overflow: "hidden",
                                width: "40px",
                                height: "40px",
                                padding: "5px",
                                border: "solid",
                                borderWidth: "1px",
                                borderRadius: "4px",
                                boxShadow: "0 0 4px inset",
                              }}
                            >
                              <img src={EditIcon} width={"100%"} alt="Edit" />
                            </Button>
                          )}
                        </Flex>
                        <Flex
                          wrap={"wrap"}
                          gap={"5px"}
                          justifyContent={"center"}
                          marginBlock={"10px"}
                        >
                          {prodList.map((prod) => (
                            <Button
                              style={{
                                ...buttonStyling,
                                boxShadow:
                                  selectedProduct?.id === prod.id
                                    ? "0 0 10px rgb(255, 217, 103)"
                                    : buttonStyling.boxShadow,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                              padding={"5px 10px"}
                              onClick={() => resetToEdit(prod)}
                            >
                              <Text
                                color="White"
                                fontSize="1.5rem"
                                fontWeight="800"
                              >
                                {prod.variation}
                              </Text>
                            </Button>
                          ))}
                          <Button
                            padding={"5px 10px"}
                            style={
                              activeMode === MODES.APPEND
                                ? {
                                    ...buttonStyling,
                                    opacity: ".7",
                                    boxShadow: "0 0 5px inset",
                                  }
                                : {
                                    ...buttonStyling,
                                    border: "2px solid rgba(0, 0, 0)",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                  }
                            }
                            onClick={() => resetToAppend(selectedProduct)}
                          >
                            <Text
                              color="White"
                              fontSize="1.5rem"
                              fontWeight="800"
                            >
                              +
                            </Text>
                          </Button>
                        </Flex>
                      </Flex>
                    )}
                  </Flex>
                );
              })}
            </View>
          </Flex>
        </Card>

        {/* Right card edit, delete, or adds information ----------------------------------------- */}
        <Card
          flex="1.0"
          height="100%"
          padding="1rem"
          position={"relative"}
          style={{
            background:
              "linear-gradient(145deg, rgba(255, 240, 235, 0.35), rgba(245, 225, 218, 0.28))",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(120, 80, 70, 0.18)",
            borderRadius: "22px",
          }}
        >
          <Flex
            direction="column"
            height="100%"
            width="100%"
            justifyContent="flex-start"
            alignItems="center"
            style={{ minWidth: 0 }}
          >
            {loadingProduct && (
              <Flex direction="column" gap="0.25rem">
                <Text style={luxuryHeadingStyle}>Product Information</Text>
                <Text style={luxuryBodyStyle}>Loading Product...</Text>
              </Flex>
            )}

            {/* Add mode: Will pull up a blank draft to be filled out with information of a product they want to add */}
            {/* Edit mode: Will take existing product and show its information in the draft instead of being blank */}
            {(activeMode === MODES.ADD ||
              activeMode === MODES.EDIT ||
              activeMode === MODES.APPEND) && (
              <Grid
                templateColumns="1fr 1fr"
                gap="0.4rem"
                marginTop="-.2rem"
                width="100%"
                style={{ minWidth: 0 }}
              >
                <TextField
                  style={compactStyle}
                  placeholder="Name"
                  value={draft.name}
                  onChange={(e) => setDraftField("name", e.target.value)}
                />
                <SelectField
                  style={compactStyle}
                  value={draft.type}
                  onChange={(e) => setDraftField("type", e.target.value)}
                >
                  <option value="" disabled>
                    Type
                  </option>
                  {!["Men's Cologne", "Women's Perfume"].includes(draft.type) &&
                    ![MODES.ADD, MODES.APPEND].includes(activeMode) && (
                      <option value={draft.type} disabled>
                        {draft.type}
                      </option>
                    )}
                  <option value="Men's Cologne">Men's Cologne</option>
                  <option value="Women's Perfume">Women's Perfume</option>
                </SelectField>

                {/* Includes an invalid variation as a disabled option, so admin can see the invalid state but not reselect it */}
                <SelectField
                  style={compactStyle}
                  value={draft.variation}
                  onChange={(e) => setDraftField("variation", e.target.value)}
                >
                  <option value="" disabled>
                    Variation
                  </option>
                  {!["30ml", "50ml"].includes(draft.variation) &&
                    activeMode === MODES.EDIT && (
                      <option value={draft.variation} disabled>
                        {draft.variation}
                      </option>
                    )}
                  {activeMode === MODES.ADD || !selectedProduct ? (
                    <>
                      <option value="30ml">30ml</option>
                      <option value="50ml">50ml</option>
                    </>
                  ) : (
                    ["30ml", "50ml"].map((size) => {
                      const parentGroup = sortedProducts.find(
                        (arr) =>
                          arr?.[0]?.parentid === selectedProduct.parentid,
                      );
                      if (
                        parentGroup.some(
                          (p) =>
                            (activeMode === MODES.APPEND ||
                              p.id !== selectedProduct.id) &&
                            p.variation === size,
                        )
                      ) {
                        return (
                          <option value={`${size}`} disabled>
                            {size}
                          </option>
                        );
                      } else {
                        return <option value={`${size}`}>{size}</option>;
                      }
                    })
                  )}
                </SelectField>
                <TextField
                  style={compactStyle}
                  placeholder="Price"
                  type="number"
                  value={draft.price}
                  onChange={(e) => setDraftField("price", e.target.value)}
                />
                {/* Entering Top, Heart, and Base notes ------------------------------------------------------------*/}
                <TextField
                  columnSpan={2}
                  style={compactStyle}
                  placeholder="Notes Top (, separated)"
                  // If array exists for top use it and separate by commas
                  value={(draft.notes.top || []).join(",")}
                  onChange={(e) => {
                    const arr = e.target.value.split(",").map((s) => s.trim());
                    setDraft((prev) => ({
                      ...prev,
                      notes: { ...prev.notes, top: arr },
                    }));
                  }}
                />
                <TextField
                  columnSpan={2}
                  style={compactStyle}
                  placeholder="Notes Heart (, separated)"
                  value={(draft.notes.heart || []).join(",")}
                  onChange={(e) => {
                    const arr = e.target.value.split(",").map((s) => s.trim());
                    setDraft((prev) => ({
                      ...prev,
                      notes: { ...prev.notes, heart: arr },
                    }));
                  }}
                />
                <TextField
                  columnSpan={2}
                  style={compactStyle}
                  placeholder="Notes Base (, separated)"
                  value={(draft.notes.base || []).join(",")}
                  onChange={(e) => {
                    const arr = e.target.value.split(",").map((s) => s.trim());
                    setDraft((prev) => ({
                      ...prev,
                      notes: { ...prev.notes, base: arr },
                    }));
                  }}
                />
                <View columnSpan={2}>
                  <TextAreaField
                    textAlign={"left"}
                    style={{ ...compactStyle, height: "50px" }}
                    placeholder={"Description"}
                    value={draft.description}
                    onChange={(e) => {
                      setDraft((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }));
                    }}
                    onFocus={(e) => {
                      e.target.style.height = "100px";
                    }}
                    onBlur={(e) => {
                      e.target.style.height = "50px";
                    }}
                  />
                </View>
                {/* Hidden or featured switches -------------------- */}
                <Flex columnSpan={2} justifyContent={"center"}>
                  <SwitchField
                    style={compactStyle}
                    label="Hidden?"
                    isChecked={draft.ishidden}
                    onChange={(e) =>
                      setDraftField("ishidden", e.target.checked)
                    }
                  />
                  <SwitchField
                    style={compactStyle}
                    label="Featured"
                    isChecked={draft.isfeatured}
                    onChange={(e) =>
                      setDraftField("isfeatured", e.target.checked)
                    }
                  />
                </Flex>
                <View columnSpan={2}>
                  <Text marginBottom="2rem" fontSize={".9em"}>
                    Images: {draft.images.length}
                  </Text>

                  <Flex gap="1rem" justifyContent="center">
                    <Button
                      style={{
                        ...buttonStyling,
                        border: "2px solid rgba(0, 0, 0)",
                      }}
                      borderRadius="10px"
                      padding="0.5rem 0.5rem"
                      as="label"
                    >
                      <input
                        id="product-images"
                        type="file"
                        multiple
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={onImagesSelected}
                      />
                      <Text color="White">Upload Images</Text>
                    </Button>
                    <Button
                      style={{
                        ...buttonStyling,
                        border: "2px solid rgba(0, 0, 0)",
                      }}
                      borderRadius="10px"
                      padding="0.5rem 0.5rem"
                      onClick={(e) => setShowImages((prev) => !prev)}
                    >
                      <Text color="White">
                        {showImages ? "Hide Images" : "Show Images"}
                      </Text>
                    </Button>
                    {/* Save button --------------------------------------------------- */}
                    <Button
                      style={{
                        ...buttonStyling,
                        border: "2px solid rgba(0, 0, 0)",
                      }}
                      borderRadius="10px"
                      padding="0.5rem 1.3rem"
                      onClick={() => {
                        if (!canSave) {
                          toast(
                            "Please fill out type and name information.",
                            "error",
                          );
                          return;
                        }
                        // in case of append, it will include the parentid of the selected product
                        if (
                          activeMode === MODES.ADD ||
                          activeMode === MODES.APPEND
                        )
                          addProduct();
                        else updateProduct();
                      }}
                    >
                      <Text color="White">Save</Text>
                    </Button>
                    {/* Cancel button ------------------------------------------------------------------- */}
                    <Button
                      style={{
                        ...buttonStyling,
                        border: "2px solid rgba(0, 0, 0)",
                      }}
                      borderRadius="10px"
                      padding="0.5rem .7rem"
                      onClick={() => {
                        resetToIdle();
                      }}
                    >
                      <Text color="White">Cancel</Text>
                    </Button>
                  </Flex>
                </View>
              </Grid>
            )}
            {/* Removal mode -------------------------------------------------- !!!*/}
            {activeMode === MODES.REMOVE && selectedProduct && (
              <Flex direction="row" gap="0.5rem" wrap="wrap">
                <Button style={buttonStyling} onClick={() => hideProduct()}>
                  <Text color="White">
                    {selectedProduct.ishidden ? "Unhide" : "Hide"}
                  </Text>
                </Button>
                <Button style={buttonStyling} onClick={() => removeProduct()}>
                  <Text color="White">Delete</Text>
                </Button>
                <Button
                  style={buttonStyling}
                  onClick={() => {
                    if (selectedProduct) {
                      setActiveMode(MODES.IDLE);
                      setSelectedProduct(null);
                      return;
                    }
                    setActiveMode(MODES.IDLE);
                  }}
                >
                  <Text color="White">Cancel</Text>
                </Button>
              </Flex>
            )}
            {/* Base mode when no product is selected ----------------------------------------------- */}
            {activeMode === MODES.IDLE && (
              <>
                <Flex direction="column" gap="0.05rem" wrap="wrap">
                  <Flex
                    alignItems="center"
                    justifyContent="center"
                    style={{
                      padding: ".5rem .5rem",
                      border: "2px solid rgba(0, 0, 0)",
                      borderRadius: "10px",
                      background:
                        "linear-gradient(145deg, rgba(90, 20, 20, 0.92), rgba(40, 35, 35, 0.82))",
                      width: "fit-content",
                      margin: "0 auto",
                    }}
                  >
                    <Text
                      style={{
                        ...luxuryHeadingStyle,
                        fontSize: "2.2rem",
                        color: "#FFFFFF",
                      }}
                    >
                      Product Information
                    </Text>
                  </Flex>
                  <View
                    marginTop="1rem"
                    style={{
                      borderRadius: "24px",
                      background:
                        "linear-gradient(145deg, rgba(90, 20, 20, 0.92), rgba(40, 35, 35, 0.82))",
                      padding: ".5rem .5rem",
                      border: "2px solid rgba(0, 0, 0)",
                      width: "fit-content",
                      margin: "0 auto",
                    }}
                  >
                    <Text style={{ ...luxuryBodyStyle, color: "White" }}>
                      Please select a product
                    </Text>
                  </View>
                </Flex>
              </>
            )}
            {/* View product ------------------------------------------------- */}
            {activeMode === MODES.VIEW &&
              selectedProduct &&
              !loadingProduct && (
                <Flex
                  direction="column"
                  gap="0.1rem"
                  wrap="wrap"
                  textAlign="center"
                >
                  <Text style={luxuryBodyStyle}>
                    Name: {selectedProduct.name}
                  </Text>
                  <Text style={luxuryBodyStyle}>
                    Type: {selectedProduct.type}
                  </Text>
                  <Text style={luxuryBodyStyle}>
                    Variation: {selectedProduct.variation}
                  </Text>
                  <Text style={luxuryBodyStyle}>
                    Price: ${selectedProduct.price}
                  </Text>
                  <Text style={luxuryBodyStyle}>
                    Stock: {selectedProduct.stock_ml} ml
                  </Text>
                  <Text style={luxuryBodyStyle}>
                    Featured: {selectedProduct.isfeatured ? "Yes" : "No"}
                  </Text>
                  <Text style={luxuryBodyStyle}>
                    Hidden: {selectedProduct.ishidden ? "Yes" : "No"}
                  </Text>
                  <Text style={luxuryBodyStyle}>
                    {/* Display the selected products Top, Heart, and Base notes in one line */}
                    Notes: Top[{selectedProduct.notes?.top.join(", ") || "—"}] /
                    Heart[{selectedProduct.notes?.heart.join(", ") || "—"}] /
                    Base[{selectedProduct.notes?.base.join(", ") || "—"}]
                  </Text>
                  <Text style={luxuryBodyStyle}>
                    Images:{" "}
                    {Array.isArray(selectedProduct.images)
                      ? selectedProduct.images.length
                      : 0}
                  </Text>
                </Flex>
              )}
          </Flex>
        </Card>
        {showImages && (
          <View
            position={"fixed"}
            top={0}
            left={0}
            display={"flex"}
            width={"100vw"}
            height={"100vh"}
            style={{ backdropFilter: "blur(4px)", zIndex: 9999 }}
            justifyContent={"center"}
            alignItems={"center"}
          >
            <Card
              display={"flex"}
              width={"800px"}
              minHeight={"200px"}
              padding={0}
              border={"solid black"}
              borderWidth={"10px"}
              borderRadius={"20px"}
              backgroundColor={"#27231e"}
              color={"white"}
              position={"relative"}
            >
              <View
                position={"absolute"}
                top={0}
                right={0}
                transform={"translate(50%,-50%)"}
                color={"black"}
                backgroundColor={"white"}
                width={"40px"}
                height={"40px"}
                borderRadius={"40%"}
                border={"solid black"}
                display={"flex"}
                justifyContent={"center"}
                alignItems={"center"}
                fontSize={"1.3em"}
                onClick={(e) => setShowImages((prev) => !prev)}
              >
                <strong>X</strong>
              </View>
              <Flex direction={"column"} flex={1} width={"100%"}>
                <h2>View / Rearrange Images</h2>
                <Flex
                  border={"solid black"}
                  borderRadius={"20px"}
                  padding={"10px"}
                  width={"100%"}
                  height={"200px"}
                  wrap={"nowrap"}
                  gap={"12px"}
                  alignItems={"center"}
                  backgroundColor={"rgb(253, 248, 245)"}
                  style={{
                    overflowX: "auto",
                    overflowY: "hidden",
                    scrollbarWidth: "none",
                  }}
                >
                  {draft.images.map((url, i) => {
                    return (
                      <View
                        key={url}
                        width={"200px"}
                        shrink={0}
                        border={"solid gray"}
                        borderWidth={"5px"}
                        borderRadius={"10px"}
                        height={"100%"}
                        display={"flex"}
                        alignItems={"center"}
                        position={"relative"}
                        onMouseDown={(e) => handleImageDrag(e, i)}
                        className="product-image-draggable"
                        data-index={i}
                      >
                        <img
                          src={url}
                          alt="img"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />

                        <View
                          position={"absolute"}
                          top={0}
                          right={0}
                          transform={"translate(50%,-50%)"}
                          color={"white"}
                          backgroundColor={"maroon"}
                          width={"30px"}
                          height={"30px"}
                          borderRadius={"40%"}
                          border={"solid black"}
                          display={"flex"}
                          justifyContent={"center"}
                          alignItems={"center"}
                          fontSize={"1.3em"}
                          onClick={(e) => {
                            if (draft.images.length <= 1) return;
                            setDraft((prev) => {
                              return {
                                ...prev,
                                images: prev.images.filter((u) => u !== url),
                              };
                            });
                          }}
                        >
                          <strong>X</strong>
                        </View>
                        {i === 0 && (
                          <Text
                            position={"absolute"}
                            bottom={0}
                            left={"50%"}
                            transform={"translateX(-50%)"}
                            backgroundColor={"white"}
                            width={"100%"}
                            opacity={0.8}
                            color={"black"}
                            fontSize={"1.2em"}
                          >
                            Cover Photo
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </Flex>
              </Flex>
            </Card>
          </View>
        )}
        {files.length !== 0 && (
          <View
            position={"fixed"}
            top={0}
            left={0}
            display={"flex"}
            width={"100vw"}
            height={"100vh"}
            style={{ backdropFilter: "blur(4px)", zIndex: 9999 }}
            justifyContent={"center"}
            alignItems={"center"}
          >
            <Card
              display={"flex"}
              width={"800px"}
              minHeight={"200px"}
              padding={0}
              border={"solid black"}
              borderWidth={"10px"}
              borderRadius={"20px"}
              backgroundColor={"#27231e"}
              color={"white"}
              position={"relative"}
            >
              <View
                position={"absolute"}
                top={0}
                right={0}
                transform={"translate(50%,-50%)"}
                color={"black"}
                backgroundColor={"white"}
                width={"40px"}
                height={"40px"}
                borderRadius={"40%"}
                border={"solid black"}
                display={"flex"}
                justifyContent={"center"}
                alignItems={"center"}
                fontSize={"1.3em"}
                onClick={(e) => {
                  for (const f of files) {
                    URL.revokeObjectURL(f.url);
                  }
                  setFiles([]);
                }}
              >
                <strong>X</strong>
              </View>
              {isUploading ? (
                <Flex
                  direction={"column"}
                  justifyContent={"center"}
                  alignItems={"center"}
                  flex={1}
                  width={"100%"}
                >
                  <h2>Uploading...</h2>
                </Flex>
              ) : (
                <Flex
                  direction={"column"}
                  justifyContent={"center"}
                  alignItems={"center"}
                  flex={1}
                  width={"100%"}
                >
                  <h2>Upload Images</h2>
                  <Flex
                    border={"solid black"}
                    borderRadius={"20px"}
                    padding={"10px"}
                    width={"100%"}
                    height={"200px"}
                    wrap={"nowrap"}
                    gap={"12px"}
                    alignItems={"center"}
                    backgroundColor={"rgb(253, 248, 245)"}
                    style={{
                      overflowX: "auto",
                      overflowY: "hidden",
                      scrollbarWidth: "none",
                    }}
                  >
                    {files.map((f, i) => {
                      return (
                        <View
                          key={f.url}
                          width={"200px"}
                          shrink={0}
                          border={"solid gray"}
                          borderWidth={"5px"}
                          borderRadius={"10px"}
                          height={"100%"}
                          display={"flex"}
                          alignItems={"center"}
                          position={"relative"}
                        >
                          <img
                            src={f.url}
                            alt="img"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />

                          <View
                            position={"absolute"}
                            top={0}
                            right={0}
                            transform={"translate(50%,-50%)"}
                            color={"white"}
                            backgroundColor={"maroon"}
                            width={"30px"}
                            height={"30px"}
                            borderRadius={"40%"}
                            border={"solid black"}
                            display={"flex"}
                            justifyContent={"center"}
                            alignItems={"center"}
                            fontSize={"1.3em"}
                            onClick={(e) => {
                              URL.revokeObjectURL(f.url);
                              setFiles((prev) =>
                                prev.filter((file) => file !== f),
                              );
                            }}
                          >
                            <strong>X</strong>
                          </View>
                        </View>
                      );
                    })}
                  </Flex>
                  <Button
                    style={compactStyle}
                    border="1px solid #111"
                    borderRadius="6px"
                    padding="0.35rem 0.75rem"
                    fontSize={"1.5em"}
                    fontWeight={"bold"}
                    margin={"auto"}
                    onClick={uploadImages}
                  >
                    Upload
                  </Button>
                </Flex>
              )}
            </Card>
          </View>
        )}
      </Flex>
    </Flex>
  );
}
