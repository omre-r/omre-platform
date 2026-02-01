const   {
    validateLoginReq, changePasswordReq, getUserReq, getUsersReq, createUserReq, deleteUserReq,
    getProductReq, updateProductReq, deleteProductReq, getActiveProductsReq, createProductReq, getProductsReq,
    getProductReviewsReq, getUserReviewsReq, updateReviewReq, createReviewReq, getReviewsReq, 
    cancelOrderReq, completeOrderReq, getOrderReq, createOrderReq
} = require("../frontend/src/requests.js")


// Testing a user flow

async function testUserFlow(){
    //email, password, firstname, lastname, role
    const user1 = {
        email: "salehm0529@gmail.com",
        password: "crzy8123",
        firstname: "murad",
        lastname: "saleh",
        role: "user"
    }
    const user2 = {
        email: "ahadkidwai45@gmail.com",
        password: "123",
        firstname: "ahad",
        lastname: "kidwai",
        role: "user"
    }
    const user3 = {
        email: "aymannazir28@gmail.com",
        password: "321",
        firstname: "ayman",
        lastname: "nazir",
        role: "user"
    }
    const user4 = {
        email: "zanechriste88@gmail.com",
        password: "helloworld",
        firstname: "zane",
        lastname: "christe",
        role: "user"
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

    //get user 2
    console.log("Getting user 2", await getUserReq(createdUser2.id))

    // //delete user 2
    // await (createdUser2.id)
    // console.log("Deleting user 2")

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




testUserFlow()
