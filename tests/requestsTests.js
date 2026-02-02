const   {
    validateLoginReq, changePasswordReq, getUserReq, getUsersReq, createUserReq, deleteUserReq,
    getProductReq, updateProductReq, deleteProductReq, getActiveProductsReq, createProductReq, getProductsReq,
    getProductReviewsReq, getUserReviewsReq, updateReviewReq, createReviewReq, getReviewsReq, deleteReviewReq,
    cancelOrderReq, completeOrderReq, getOrderReq, createOrderReq, deleteOrderReq
} = require("../frontend/src/requests.js")

async function testUserFlow(){
    //email, password, firstname, lastname, role
    const user1 = {
        email: "salehm0529@gmail.com",
        password: "crzy8123",
        firstname: "murad",
        lastname: "saleh",
        role: "user",
        preferrednotes: ["ice cream", "vanilla"]
    }
    const user2 = {
        email: "ahadkidwai45@gmail.com",
        password: "123",
        firstname: "ahad",
        lastname: "kidwai",
        role: "user",
        preferrednotes: ["ice cream", "vanilla"]
    }
    const user3 = {
        email: "aymannazir28@gmail.com",
        password: "321",
        firstname: "ayman",
        lastname: "nazir",
        role: "user",
        preferrednotes: ["ice cream", "vanilla"]
    }
    const user4 = {
        email: "zanechriste88@gmail.com",
        password: "helloworld",
        firstname: "zane",
        lastname: "christe",
        role: "user",
        preferrednotes: ["ice cream", "vanilla"]
    }

    let allUsers
    //get all users

    console.log("Getting all users: ", await getUsersReq())

    //create 4 users
    const createdUser1 =  await createUserReq(user1);
    const createdUser2 =  await createUserReq(user2);
    const createdUser3 =  await createUserReq(user3);
    const createdUser4 =  await createUserReq(user4)
    console.log("Created users", createdUser1, createdUser2, createdUser3, createdUser4)

    //get all users
    console.log("Getting all users: ", await getUsersReq())

    //get a single user
    console.log("Getting user 2", await getUserReq(createdUser2.id))

    // All users login with wrong credentials
    let retrievedUser1 = await validateLoginReq(createdUser1.id, createdUser1.email, "no")
    let retrievedUser2 = await validateLoginReq(createdUser2.id, createdUser2.email, "dewjrdncw")
    let retrievedUser3 = await validateLoginReq(createdUser3.id, createdUser3.email, "asx")
    let retrievedUser4 = await validateLoginReq(createdUser4.id, createdUser4.email, "xsaxed")
    console.log("Retrieved users (wrong login): ", retrievedUser1, retrievedUser2, retrievedUser3, retrievedUser4)

    //All users login with correct credentials
    retrievedUser1 = await validateLoginReq(createdUser1.id, createdUser1.email, user1.password)
    retrievedUser2 = await validateLoginReq(createdUser2.id, createdUser2.email, user2.password)
    retrievedUser3 = await validateLoginReq(createdUser3.id, createdUser3.email, user3.password)
    retrievedUser4 = await validateLoginReq(createdUser4.id, createdUser4.email, user4.password)
    console.log("Retrieved users (correct login): ", retrievedUser1, retrievedUser2, retrievedUser3, retrievedUser4)

    //All users change passwords
    await changePasswordReq(createdUser1.id, "8");
    await changePasswordReq(createdUser2.id, "8");
    await changePasswordReq(createdUser3.id, "8");
    await changePasswordReq(createdUser4.id, "8");
    console.log("Changing passwords");

    //All users login AFTER changing passwords
    retrievedUser1 = await validateLoginReq(createdUser1.id, createdUser1.email, user1.password)
    retrievedUser2 = await validateLoginReq(createdUser2.id, createdUser2.email, user2.password)
    retrievedUser3 = await validateLoginReq(createdUser3.id, createdUser3.email, user3.password)
    retrievedUser4 = await validateLoginReq(createdUser4.id, createdUser4.email, user4.password)
    console.log("Retrieved users (old login): ", retrievedUser1, retrievedUser2, retrievedUser3, retrievedUser4)

    //All users login with changed passwords
    retrievedUser1 = await validateLoginReq(createdUser1.id, createdUser1.email, "8")
    retrievedUser2 = await validateLoginReq(createdUser2.id, createdUser2.email, "8")
    retrievedUser3 = await validateLoginReq(createdUser3.id, createdUser3.email, "8")
    retrievedUser4 = await validateLoginReq(createdUser4.id, createdUser4.email, "8")
    console.log("Retrieved users (new login): ", retrievedUser1, retrievedUser2, retrievedUser3, retrievedUser4)

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
    //async function createProductReq({type, name, variation, price, images, quantity, notes, isfeatured, ishidden}){
    const product1 = {
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
    }
    const product2 = {
        type: "womens_perfume",
        name: "Vanilla Perfume",
        variation: "30ml spray",
        price: 99.99,
        images: [],
        quantity: 50,
        notes: {
            top: ["Vanilla", "Raspberry"],
            heart: ["Graphe", "Blueberry"],
            base: []
        },
        isfeatured: true,
        ishidden: false
    }
    const product3 = {
        type: "unisex_fragrance",
        name: "Popular fragrance inspired by someone",
        variation: "5ml mini",
        price: 25.25,
        images: [new Blob([])],
        quantity: 5,
        notes: {
            top: ["Gold"],
            heart: ["Ice cream"],
            base: []
        },
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

async function testFlows() {
    await testUserFlow()
    await testProductFlow()
    await testReviewsFlow()
    await testOrdersFlow()
}

testFlows()