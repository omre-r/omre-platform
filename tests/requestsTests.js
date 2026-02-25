import {
    getUserReq, getUsersReq, createUserReq, deleteUserReq,
    getProductReq, updateProductReq, deleteProductReq, getActiveProductsReq, createProductReq, getProductsReq,
    getProductReviewsReq, getUserReviewsReq, updateReviewReq, createReviewReq, getReviewsReq, deleteReviewReq,
    cancelOrderReq, updateOrderStatusReq, getOrderReq, createOrderReq, deleteOrderReq,
    createCartItemReq, deleteCartItemReq, getCartReq, clearCartReq, updateCartReq,
    validateAllImages, uploadImageToS3Req, getPresignedUrlReq_LOCAL, getPresignedUrlReq, createProductAWSReq, createProductAWSFlowReq,
    createProductFlowReq_LOCAL,
} from "../frontend/src/requests.js"
 
//Note: set USE_ACCESS_TOKENS to false before testing 

async function testUserFlow(){
    //{id, email, firstname, lastname, preferrednotes}    
    const user1 = {
        id: "1",
        email: "salehm0529@gmail.com",
        firstname: "murad",
        lastname: "saleh",
        preferrednotes: ["ice cream", "vanilla"]
    }
    const user2 = {
        id: "2",
        email: "ahadkidwai45@gmail.com",
        firstname: "ahad",
        lastname: "kidwai",
        preferrednotes: ["ice cream", "vanilla"]
    }
    const user3 = {
        id: "3",
        email: "aymannazir28@gmail.com",
        firstname: "ayman",
        lastname: "nazir",
        preferrednotes: ["ice cream", "vanilla"]
    }
    const user4 = {
        id: "4",
        email: "zanechriste88@gmail.com",
        firstname: "zane",
        lastname: "christe",
        preferrednotes: ["ice cream", "vanilla"]
    }

    //get all users
    console.log("Getting all users: ", await getUsersReq())

    //create 4 users
    const createdUser1 =  await createUserReq(user1);
    const createdUser2 =  await createUserReq(user2);
    const createdUser3 =  await createUserReq(user3);
    const createdUser4 =  await createUserReq(user4);
    console.log("Created users", createdUser1, createdUser2, createdUser3, createdUser4)

    //get all users
    console.log("Getting all users: ", await getUsersReq())

    //get a single user
    console.log("Getting user 2", await getUserReq(createdUser2.id))

    //delete users 
    await deleteUserReq(createdUser1.id);
    await deleteUserReq(createdUser2.id);
    await deleteUserReq(createdUser3.id);
    await deleteUserReq(createdUser4.id);
    console.log("Deleting users");

    //get all users
    console.log("Getting all users: ", await getUsersReq())
}

async function testProductFlow(){   
    const garbageData = new Uint8Array([1]);
    const randomFile1 = new File([garbageData], "1.png", {type: "image/png"})
    const randomFile2 = new File([garbageData], "2.jpeg", {type: "image/jpeg"})
    const randomFile3 = new File([garbageData], "3.png", {type: "image/png"})
    
    const files1 = [randomFile1, randomFile2, randomFile3];
    const files2 = [randomFile1, randomFile3]
    const files3 = [randomFile3]

    if (!validateAllImages(files1).valid) return
    console.log("files1 array is valid")
    if (!validateAllImages(files2).valid) return
    console.log("files2 array is valid")
    if (!validateAllImages(files3).valid) return
    console.log("files3 array is valid")


    const uploadUrls1 = await Promise.all(files1.map(f => getPresignedUrlReq_LOCAL(f)));
    const uploadUrls2 = await Promise.all(files2.map(f => getPresignedUrlReq_LOCAL(f)));
    const uploadUrls3 = await Promise.all(files3.map(f => getPresignedUrlReq_LOCAL(f)));
    console.log("retrieved all upload/public urls", uploadUrls1, uploadUrls2, uploadUrls3)

    const uploadResults1 = await Promise.all(uploadUrls1.map((data, i) => uploadImageToS3Req(data.uploadUrl, files1[i])));
    const uploadResults2 = await Promise.all(uploadUrls2.map((data, i) => uploadImageToS3Req(data.uploadUrl, files2[i])));
    const uploadResults3 = await Promise.all(uploadUrls3.map((data, i) => uploadImageToS3Req(data.uploadUrl, files3[i])));
    console.log("Uploaded all images", uploadResults1, uploadResults2, uploadResults3)

    const urls1 = uploadUrls1.map(data => data.publicUrl)
    const urls2 = uploadUrls2.map(data => data.publicUrl)
    const urls3 = uploadUrls3.map(data => data.publicUrl)
    console.log("All urls", urls1, urls2, urls3)

    const product1 = {
        type: "mens_cologne",
        name: "Cinnamon Cologne",
        variation: "30ml spray",
        price: 35.34,
        images: urls1,
        quantity: 20,
        notes: {
            top: ["Cinammon"],
            heart: ["Cherries"],
            base: []
        },
        description: "great product",
        isfeatured: true,
        ishidden: false
    }
    const product2 = {
        type: "womens_perfume",
        name: "Vanilla Perfume",
        variation: "30ml spray",
        price: 99.99,
        images: urls2,
        quantity: 50,
        notes: {
            top: ["Vanilla", "Raspberry"],
            heart: ["Graphe", "Blueberry"],
            base: []
        },
        description: "this has a great smell",
        isfeatured: true,
        ishidden: false
    }
    const product3 = {
        type: "unisex_fragrance",
        name: "Popular fragrance inspired by someone",
        variation: "5ml mini",
        price: 25.25,
        images: urls3,
        quantity: 5,
        notes: {
            top: ["Gold"],
            heart: ["Ice cream"],
            base: []
        },
        description: "buy this one too",
        isfeatured: true,
        ishidden: true
    }
    // checks
    console.log("Get all products: ", await getProductsReq());
    console.log("Get active products: ", await getActiveProductsReq());


    //create 4 products
    const createdProduct1 =  await createProductReq(product1);
    const createdProduct2 =  await createProductReq(product2);
    const createdProduct3 =  await createProductReq(product3);
    console.log("Created products", createdProduct1, createdProduct2, createdProduct3)

    //checks
    console.log("Get all products: ", await getProductsReq());
    console.log("Get active products: ", await getActiveProductsReq());

    // get a single product
    console.log("Get product 2", await getProductReq(createdProduct2.id))

    const updatedFields1 = {variation: "95ML supersize", price: 1000, ishidden: true}
    const updatedFields2 = {type: "mens_cologne", name: "smth else"}
    const updatedFields3 = {images: []}

    await updateProductReq(createdProduct1.id, updatedFields1);
    await updateProductReq(createdProduct2.id, updatedFields2);
    await updateProductReq(createdProduct3.id, updatedFields3);

    //checks
    console.log("Get all products: ", await getProductsReq());
    console.log("Get active products: ", await getActiveProductsReq());

    //delete products
    console.log("Deleting products");
    await deleteProductReq(createdProduct1.id);
    await deleteProductReq(createdProduct2.id);
    await deleteProductReq(createdProduct3.id);

    //checks
    console.log("Get all products: ", await getProductsReq());
    console.log("Get active products: ", await getActiveProductsReq());
}

async function testReviewsFlow() {
    const user =  await createUserReq({
        email: "salehm0529@gmail.com",
        password: "crzy8123",
        firstname: "murad",
        lastname: "saleh",
        role: "user",
        preferrednotes: ["ice cream", "vanilla"]
    });

    const product =  await createProductReq({
        type: "mens_cologne",
        name: "Cinnamon Cologne",
        variation: "30ml spray",
        price: 35.34,
        images: [new Blob([]), new Blob([]), new Blob([])],
        quantity: 20,
        notes: {
            top: ["Cinammon"],
            heart: ["Cherries"],
            base: []
        },
        isfeatured: true,
        ishidden: false
    });

    const review1 = {
        customerid: user.id,
        productid: product.id,
        message: "This is the best cologne ever",
        rating: 5,
        images: [new Blob([])]
    }
    const review2 = {
        customerid: user.id,
        productid: product.id,
        message: "The bottle contained no warning that it was not to be drunk from",
        rating: 2,
        images: [new Blob([])]
    }

    console.log("Get Product reviews: ", await getProductReviewsReq(product.id));
    console.log("Get User reviews: ", await getUserReviewsReq(user.id));
    console.log("Get reviews: ", await getReviewsReq());

    const createdReview1 = await createReviewReq(review1)
    const createdReview2 = await createReviewReq(review2)
    console.log("Created reviews: ", createdReview1, createdReview2)

    console.log("Get Product reviews: ", await getProductReviewsReq(product.id));
    console.log("Get User reviews: ", await getUserReviewsReq(user.id));
    console.log("Get reviews: ", await getReviewsReq());


    console.log("Adding admin responses: ")
    let newResponses1 = [{isadmin: true, message: "Thank you! We strive for quality."}];
    let newResponses2 = [{isadmin: true, message: "I see, we apologize for the misunderstaning."}];

    await updateReviewReq(createdReview1.id, {responses: newResponses1});
    await updateReviewReq(createdReview2.id, {responses: newResponses2});

    console.log("Get Product reviews: ", await getProductReviewsReq(product.id));
    console.log("Get User reviews: ", await getUserReviewsReq(user.id));
    console.log("Get reviews: ", await getReviewsReq());

    console.log("Adding review 2 rebuttal: ")
    newResponses2 = [...newResponses2, {isadmin: false, message: "May I have a refund?"}];

    await updateReviewReq(createdReview2.id, {responses: newResponses2});
    
    console.log("Get Product reviews: ", await getProductReviewsReq(product.id));
    console.log("Get User reviews: ", await getUserReviewsReq(user.id));
    console.log("Get reviews: ", await getReviewsReq());


    console.log("Deleting reviews")
    await deleteReviewReq(createdReview1.id);
    await deleteReviewReq(createdReview2.id);

    console.log("Get Product reviews: ", await getProductReviewsReq(product.id));
    console.log("Get User reviews: ", await getUserReviewsReq(user.id));
    console.log("Get reviews: ", await getReviewsReq());



    await deleteUserReq(user.id);
    await deleteProductReq(product.id);
}

async function testOrdersFlow() {
    const user =  await createUserReq({
        email: "salehm0529@gmail.com",
        password: "crzy8123",
        firstname: "murad",
        lastname: "saleh",
        role: "user",
        preferrednotes: ["ice cream", "vanilla"]
    });

    const product =  await createProductReq({
        type: "mens_cologne",
        name: "Cinnamon Cologne",
        variation: "30ml spray",
        price: 35.34,
        images: [new Blob([]), new Blob([]), new Blob([])],
        quantity: 20,
        notes: {
            top: ["Cinammon"],
            heart: ["Cherries"],
            base: []
        },
        isfeatured: true,
        ishidden: false
    });
    const order = {
        customerid: user.id,
        items: [{productid: product.id, quantity: 3}],
        total: 33.75
    }
    const createdOrder = await createOrderReq(order);
    console.log("Created order", createdOrder);

    console.log("Get order", await getOrderReq(createdOrder.id))

    console.log("Mark order completed")
    await completeOrderReq(createdOrder.id)

    console.log("Get order", await getOrderReq(createdOrder.id))

    console.log("Mark order canceled")
    await cancelOrderReq(createdOrder.id, "I want to buy something else")

    console.log("Get order", await getOrderReq(createdOrder.id))

    console.log("Deleted orders");
    await deleteOrderReq(createdOrder.id);

    console.log("Get order", await getOrderReq(createdOrder.id))    
}

async function testCartItemsFlow() {
    //Create 2 test users
    const user1 = {
        id: "sdh38edg234",
        email: "m@g.com",
        firstname: "murad",
        lastname: "saleh",
        preferrednotes: ["Vanilla", "Cheese"]
    }
    const user2 = {
        id: "sqwops0kweoak",
        email: "ak@g.com",
        firstname: "ahad",
        lastname: "kidwai",
        preferrednotes: ["Cinnamon", "Banana"]
    }
    const user1Info = await createUserReq(user1);
    const user2Info = await createUserReq(user2);
    console.log("Test user ids: ", user1Info.id, user2Info.id)

    //Create 3 test products
    const garbageData = new Uint8Array([1]);
    const randomFile1 = new File([garbageData], "1.png", {type: "image/png"})
    const randomFile2 = new File([garbageData], "2.jpeg", {type: "image/jpeg"})
    const randomFile3 = new File([garbageData], "3.png", {type: "image/png"})

    const product1 = {
        type: "mens_cologne",
        name: "TEST TEST PRODUCT 1",
        variation: "30ml spray",
        price: 35.34,
        images: [randomFile1, randomFile2, randomFile3],
        stock_ml: 20,
        notes: {
            top: ["Cinammon"],
            heart: ["Cherries"],
            base: []
        },
        description: "great product",
        isfeatured: true,
        ishidden: false
    }
    const product2 = {
        type: "womens_perfume",
        name: "TEST TEST PRODUCT 2",
        variation: "30ml spray",
        price: 99.99,
        images: [randomFile1, randomFile3],
        stock_ml: 50,
        notes: {
            top: ["Vanilla", "Raspberry"],
            heart: ["Graphe", "Blueberry"],
            base: []
        },
        description: "this has a great smell",
        isfeatured: true,
        ishidden: false
    }
    const product3 = {
        type: "unisex_fragrance",
        name: "TEST TEST PRODUCT 3",
        variation: "5ml mini",
        price: 25.25,
        images: [randomFile3],
        stock_ml: 5,
        notes: {
            top: ["Gold"],
            heart: ["Ice cream"],
            base: []
        },
        description: "buy this one too",
        isfeatured: true,
        ishidden: true
    }

    const product1Info = await createProductFlowReq_LOCAL(product1);
    const product2Info = await createProductFlowReq_LOCAL(product2);
    const product3Info = await createProductFlowReq_LOCAL(product3)
    console.log("Test Product ids: ", product1Info.id, product2Info.id, product3Info.id)

    let user1Cart;
    let user2Cart;
    //Get user 1's cart
    user1Cart = await getCartReq(user1Info.id)
    console.log("user 1 cart: ", user1Cart);

    //Get user 2's cart
    user2Cart = await getCartReq(user2Info.id)
    console.log("user 2 cart: ", user2Cart);


    //add product 1 to user 1 cart, add product 1 + product 3 to user 2 cart
    const cartItem1 = {
        customerid: user1Info.id,
        itemid: product1Info.id,
        type: "product"
    }
    const cartItem2 = {
        customerid: user2Info.id,
        itemid: product1Info.id,
        type: "product"
    }
    const cartItem3 = {
        customerid: user2Info.id,
        itemid: product3Info.id,
        type: "product"
    }
    const cartItem1Info = await createCartItemReq(cartItem1);
    const cartItem2Info = await createCartItemReq(cartItem2);
    const cartItem3Info = await createCartItemReq(cartItem3);
    console.log("Created cart items: ", cartItem1Info, cartItem2Info, cartItem3Info);

    //Get user 1's cart
    user1Cart = await getCartReq(user1Info.id)
    console.log("user 1 cart: ", user1Cart);

    //Get user 2's cart
    user2Cart = await getCartReq(user2Info.id)
    console.log("user 2 cart: ", user2Cart);

    //add 2 product 2s to user 1's cart and delete 1 product 3 from user 2's cart
    const cartItem4 = {
        customerid: user1Info.id,
        itemid: product2Info.id,
        type: "product"
    }
    const cartItem5 = {
        customerid: user1Info.id,
        itemid: product2Info.id,
        type: "product"
    }
    const cartItem4Info = await createCartItemReq(cartItem4);
    const cartItem5Info = await createCartItemReq(cartItem5);
    console.log("Created cart items: ", cartItem4Info, cartItem5Info);

    const deleteCartItem3Res = await deleteCartItemReq(cartItem3Info.id)
    console.log("Deleted cart item: ", deleteCartItem3Res);

    //Get user 1's cart
    user1Cart = await getCartReq(user1Info.id)
    console.log("user 1 cart: ", user1Cart);

    //Get user 2's cart
    user2Cart = await getCartReq(user2Info.id)
    console.log("user 2 cart: ", user2Cart);


    //clear everyone's cart
    await clearCartReq(user1Info.id);
    await clearCartReq(user2Info.id);
    console.log("Cleared everyone's cart");

    //Get user 1's cart
    user1Cart = await getCartReq(user1Info.id)
    console.log("user 1 cart: ", user1Cart);

    //Get user 2's cart
    user2Cart = await getCartReq(user2Info.id)
    console.log("user 2 cart: ", user2Cart);

    //restore states before clearing
    const newUser1Cart = [
        {...cartItem1, quantity: 1},
        {...cartItem4, quantity: 2}
    ]
    const newUser2Cart = [
        {...cartItem2, quantity: 1}
    ]
    const updateUser1CartRes = await updateCartReq(user1Info.id, newUser1Cart);
    const updateUser2CartRes = await updateCartReq(user2Info.id, newUser2Cart);
    console.log("Updated carts: ", updateUser1CartRes, updateUser2CartRes);

    //Get user 1's cart
    user1Cart = await getCartReq(user1Info.id)
    console.log("user 1 cart: ", user1Cart);

    //Get user 2's cart
    user2Cart = await getCartReq(user2Info.id)
    console.log("user 2 cart: ", user2Cart);

    //clear everyone's cart
    await clearCartReq(user1Info.id);
    await clearCartReq(user2Info.id);
    
    console.log("Cleared everyone's cart");
    //Get user 1's cart
    user1Cart = await getCartReq(user1Info.id)
    console.log("user 1 cart: ", user1Cart);

    //Get user 2's cart
    user2Cart = await getCartReq(user2Info.id)
    console.log("user 2 cart: ", user2Cart);

    //delete users 
    const d1 = await deleteUserReq(user1Info.id);
    const d2 = await deleteUserReq(user2Info.id);

    //delete products
    const d3 = await deleteProductReq(product1Info.id);
    const d4 = await deleteProductReq(product2Info.id);
    const d5 = await deleteProductReq(product3Info.id);
    console.log("deleted: ", d1 !== null, d2 !== null, d3 !== null, d4 !== null, d5 !== null)
}

async function testFlows() {
    // await testUserFlow()
    // await testProductFlow()
    // await testReviewsFlow()
    // await testOrdersFlow()
    await testCartItemsFlow()
}

testFlows()