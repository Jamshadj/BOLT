const { Router } = require('express');
const express = require('express');
const checkUser = require('../middlewares/checkUser')
const router = express.Router();


const {

   getHomePage,
   getProfile,
    // Authentication
    getLoginPage,
    postLoginPage,
    getUserSignUpPage,
    postSignUpPage,
    getOtpPage,
    postOtpPage,
    resendOTP,
    ForgotPasswordemil,
    postForgotPassword,
    userLogout,
    getChangePassword,
    postChangePassword,
    
    // Products
    getAllProductPage,
    getProductDetail,
    categorySelect,
    brandSelect,
    priceSorting,
    postSearchProduct,
  
    // Cart and Wishlist
    addToCart,
    getCartPage,
    removeFromCart,
    incrementQuantity,
    decrementQuantity,
    getWishlistPage,
    addToWishList,
    removeFromWishlist,
  
    // Checkout and Orders
    getUserCheckout,
    postCouponCode,
    postUserCheckout,
    getUserPayment,
    getVerifiedOrder,
    getAddAddress,
    postAddAddress,
    getEditAddress,
    postEditAddress,
    getOrderHistory,
    getOrders,
    orderCancel,
    orderReturn,
  
    // Reviews and Wallet
    postAddReview,
    useWallet,
    wishListToCart,
    deleteAddress,
  } = require('../controllers/user');


 // Authentication Routes
router.get('/', getHomePage)
router.get('/login', getLoginPage)
router.post('/login', postLoginPage)
router.get('/signup', getUserSignUpPage)
router.post('/signup', postSignUpPage)
router.get('/otp', getOtpPage)  
router.post('/otp', postOtpPage)
router.get('/resend', resendOTP)
router.get('/forgot', ForgotPasswordemil)
router.post('/forgot', postForgotPassword)
router.get('/add-new-address', checkUser, getAddAddress)
router.post('/add-new-address', checkUser, postAddAddress)
router.get('/password',  getChangePassword)
router.post('/password', postChangePassword)

// User Profile Routes
router.get('/profile', checkUser, getProfile)

// Product Routes
router.get('/productpage', getAllProductPage)
router.get('/product/:id', getProductDetail)
router.post('/search-product', postSearchProduct)
router.get('/addtocart/:id', checkUser, addToCart)
router.get('/cartpage', checkUser, getCartPage)
router.post('/applycoupon', checkUser, postCouponCode)
router.get('/wish-list', checkUser, getWishlistPage)
router.get('/addtowishlist/:id', checkUser, addToWishList)
router.get('/wishListToCart/:id',checkUser,wishListToCart)
router.get('/removeFromWishList/:id', checkUser, removeFromWishlist)
router.get('/checkout', checkUser, getUserCheckout)
router.post('/placeorder', checkUser, postUserCheckout)
router.get('/verifyPayment', checkUser, getUserPayment)
router.get('/orderConfirmed', checkUser, getVerifiedOrder)

// Cart Routes
router.get('/removeFromCart/:id/:quantity', checkUser, removeFromCart)
router.get('/incrementQuantity/:id', checkUser, incrementQuantity)
router.get('/decrementQuantity/:id', checkUser, decrementQuantity)

// Address Routes
router.get('/edit-address/:id', checkUser, getEditAddress)
router.post('/edit-address', checkUser, postEditAddress)
router.post('/deleteAddress/:id',checkUser,deleteAddress)
// Order Routes
router.get('/order-history', checkUser, getOrderHistory)
router.get('/orders/:id', checkUser, getOrders)
router.post('/cancel', checkUser, orderCancel)
router.post('/return', checkUser, orderReturn)

// Review Routes
router.post('/addReviews', checkUser, postAddReview)

// Wallet Routes
router.post('/applywallet', checkUser, useWallet)

// Sort Routes
router.get('/categoryproduct', categorySelect)
router.get('/brandproduct', brandSelect)
router.get('/priceSorting',priceSorting)

// Logout Route
router.get('/logout', userLogout)

module.exports = router       