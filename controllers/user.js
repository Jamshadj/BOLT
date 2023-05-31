const express = require("express");

const sentOTP = require("../helper/otp");
const productModel = require("../models/productModel");
const brandModel = require("../models/brandModel");
const bannerModel = require("../models/bannerModel");
const categoryModel = require("../models/categoryModel");
const UserModel = require("../models/UserModel");
const couponModel = require("../models/couponModel");
const orderModel = require("../models/orderModel");
const createId = require("../helper/createId");
var bcrypt = require("bcrypt");
const sharp = require("sharp");
const moment = require("moment-timezone");
const axios = require("axios");
const { create, find } = require("../models/productModel");
const session = require("express-session");
const ProductModel = require("../models/productModel");
var salt = bcrypt.genSaltSync(10);
require("dotenv");
let userDetails;
let password;
var message = null;

const formatDate = function (date, format) {
  moment.locale("en");
  return moment(date).tz("Asia/Kolkata").format(format);
};

//HOME
const getHomePage = async (req, res) => {
  let product = await productModel.find({ block: false }).limit(8).lean();
  let brand = await brandModel.find().limit(4).lean();
  let banner = await bannerModel.find().lean();
  let user = await req.session.user;
  res.render("users/Home", {
    CSS: ["stylesheet/home.css"],
    product,
    brand,
    banner,
    user,
  });
};

//login
const getLoginPage = (req, res) => {
  if (req.session.user) {
    res.redirect("/");
  } else {
    res.render("users/login", {
      CSS: ["stylesheet/adminlogin.css"],
      message,
      sucessmessage,
    });
    message = null;
    sucessmessage = null;
  }
};

//SIGNUP
const getUserSignUpPage = (req, res) => {
  res.render("users/userSignup", {
    CSS: ["stylesheet/adminlogin.css"],
    message,
  });
  message = null;
};

const postSignUpPage = async (req, res) => {
  const exstinguser = await UserModel.findOne({ email: req.body.email });
  if (exstinguser) {
    message = "Email already exist";
    res.redirect("/signup");
  } else if (req.body.phoneno.length != 10) {
    message = "Mobile number is not vailed";
    res.redirect("/signup");
  } else if (req.body.password.length < 8) {
    message = "Please enter password leangth more than 8 charachter";
    res.redirect("/signup");
  } else if (req.body.password != req.body.confirmpassword) {
    message = "Password is not same";
    res.redirect("/signup");
  } else {


    userDetails = req.body;
    password = req.body.password;
    let otp = Math.floor(Math.random() * 1000000);
    signupOTP = otp;
    signupEmail = req.body.email;
    sentOTP(req.body.email, otp);
    res.redirect("/otp");
  }
};

//OTP

const getOtpPage = (req, res) => {
  res.render("users/verifyOTP", {
    CSS: ["stylesheet/adminlogin.css"],
    message,
    userDetails,
  });
  message = null;
};

const postOtpPage = (req, res) => {
  if (signupOTP == req.body.verify) {
    let block = false;
    // const { name, email, mobile, password } = req.body
    let users = new UserModel({
      ...userDetails,
      password: bcrypt.hashSync(password, salt),
      block,
    });
    users.save((err, data) => {
      if (err) {
        res.render("userSignup", {
          error: true,
          message: "Something went wrong",
        });
      } else {
        req.session.user = userDetails;
        res.redirect("/");
      }
    });
  } else if (signupOTP == req.body.forgot) {
    res.redirect("/password");
  } else {
    res.redirect("/otp");
    message = "OTP is incorrect";
  }
};

const resendOTP = (req, res) => {
  res.redirect("/otp");
  let otp = Math.floor(Math.random() * 1000000);
  sentOTP(signupEmail, otp);
  signupOTP = otp;
  // ##############
  var countDownTime = 1200000;
  setTimeout(() => {
    otp = undefined;
  }, countDownTime);
  // ##############
};

const ForgotPasswordemil = (req, res) => {
  res.render("users/forgot-email", {
    CSS: ["stylesheet/adminlogin.css"],
    message,
  });
  message = null;
};
const postForgotPassword = async (req, res) => {
  const exstinguser = await UserModel.findOne({ email: req.body.email });
  if (exstinguser) {
    req.session.email = req.body.email;
    let otp = Math.floor(Math.random() * 1000000);
    signupOTP = otp;
    signupEmail = req.body.email;
    sentOTP(req.body.email, otp);
    res.redirect("/otp");
  } else {
    message = "Email not exist";
    res.redirect("/forgot");
  }
};

const getChangePassword = async (req, res) => {
  res.render("users/updatePassword", {
    CSS: ["stylesheet/adminlogin.css"],
    message,
  });
  message = null;
};
var sucessmessage = "";
const postChangePassword = async (req, res) => {
  const { password, confirmPassword } = req.body;
  const email = req.session.email;

  try {
    if (password.length < 8) {
      message = "Password length must be 8 or more characters";
    } else if (password !== confirmPassword) {
      message = "Password and confirm password do not match";
    } else {
      let user = await UserModel.findOneAndUpdate(
        { email: email },
        { $set: { password: bcrypt.hashSync(password, salt) } },
        { new: true }
      ).lean();

      sucessmessage = "Password updated successfully";
      res.redirect("/login");
      return;
    }
  } catch (error) {
    console.error(error);
    message = "An error occurred while updating the password";
  }
  res.redirect("/password");

  return;
};

const userLogout = (req, res) => {
  req.session.destroy();
  res.redirect("/");
};
let signupEmail;

const postLoginPage = async (req, res) => {
  const { email, password } = req.body;
  const exstinguser = await UserModel.findOne({ email: email });

  if (exstinguser) {
    if (exstinguser.block == true) {
      message = "Sorry you are banned";
      res.redirect("/login");
    } else if (bcrypt.compareSync(password, exstinguser.password)) {
      req.session.user = exstinguser;
      // req.sessio.user=exstinguser.email

      res.redirect("/");
    } else {
      message = "Incorrect password";
      res.redirect("/login");
    }
  } else {
    message = "Email is not exist";
    res.redirect("/login");
  }
};

//PRODUCT PAGE
const getAllProductPage = async (req, res) => {
  try {
    const [categories, brands, products] = await Promise.all([
      categoryModel.find({ block: false }).lean(),
      brandModel.find({ block: false }).lean(),
      productModel.find({ block: false }).lean(),
    ]);
    const user = req.session.user;
    const { sortProducts, catgproducts, brandproducts } = req.session;
    req.session.pageNum = parseInt(req.query.page ?? 1);
    req.session.perpage = 6;
    let docCount = await productModel.countDocuments();
    let allproducts = await productModel
      .find()
      .skip((req.session.pageNum - 1) * req.session.perpage)
      .limit(req.session.perpage)
      .lean();
    let pageCount = Math.ceil(docCount / req.session.perpage);
    let pagination = [];
    for (let i = 1; i <= pageCount; i++) {
      pagination.push(i);
    }
    if (sortProducts) {
      req.session.sortProducts = null;
      return res.render("users/allProductPage", {
        sorted: req.session.sorted,
        products: sortProducts,
        ...getCommonRenderProps(categories, brands, user),
      });
    }

    if (catgproducts) {
      req.session.catgproducts = null;
      return res.render("users/allProductPage", {
        products: catgproducts,
        ...getCommonRenderProps(categories, brands, user),
      });
    }

    if (brandproducts) {
      req.session.brandproducts = null;
      return res.render("users/allProductPage", {
        products: brandproducts,
        ...getCommonRenderProps(categories, brands, user),
      });
    }

    res.render("users/allProductPage", {
     
      allproducts,
      pagination,
      ...getCommonRenderProps(categories, brands, user),
    });
  } catch (err) {
    // Handle the error here
  }
};

const getCommonRenderProps = (categories, brands, user) => ({
  category: categories,
  brand: brands,
  user,
});


//cart

const addToCart = async (req, res) => {
  try {
    if (req.session.user) {
      const user_id = req.session.user._id;
      const pdt_id = req.params.id;
      await UserModel.updateOne(
        { _id: user_id },
        { $addToSet: { cart: { id: pdt_id, quantity: 1 } } }
      );
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
    });
  }
};
let msg;

const getCartPage = async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.redirect("/login");
    }

    // Get user and cart details
    const user = req.session.user;
    const cartQuantity = {};
    const userId = user._id;
    const cartDetails = await UserModel.findOne({ _id: userId }, { cart: 1 });

    // Get cart items and quantity
    const cartItems = cartDetails.cart.map((item) => {
      cartQuantity[item.id] = item.quantity;
      return item.id;
    });
    req.session.user.cartQuantity = cartQuantity;
    // Get product details for cart items
    const products = await productModel
      .find({ _id: { $in: cartItems } })
      .lean();

    // Calculate total amount and discount
    let totalAmount = 0;
    let totalMRP = 0;
    let itemprize;
    products.forEach((item, index) => {
      const quantity = cartQuantity[item._id];
      products[index].quantity = quantity;
      totalAmount = totalAmount + item.prize * cartQuantity[item._id];
      totalMRP = totalMRP + item.MRP * cartQuantity[item._id];
      item.itemprize = item.prize * item.quantity;
    });
    const discount = totalMRP - totalAmount;

    res.render("users/cart", {
      products,
      totalAmount,
      cartDetails,
      totalMRP,
      user,
      discount,
      itemprize,
      message,
      cartMessage,
      msg,
    });
    cartMessage = null;
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

let cartMessage = null;
// Increment product quantity

const incrementQuantity = async (req, res) => {
  try {
    // Find the product by ID
    const product = await ProductModel.findById(req.params.id);

    // Get the current cart item quantity for the logged in user
    const user = await UserModel.findOne(
      {
        _id: req.session.user._id,
        cart: { $elemMatch: { id: req.params.id } },
      },
      {
        "cart.$": 1, // Get only the matching cart item
      }
    );

    // Check if the requested quantity is available
    const cartQuantity = user.cart[0].quantity;
    const productQuantity = product.quantity;
    if (productQuantity <= cartQuantity) {
      return res.json({
        success: false,
        message: "Requested quantity not available",
      });
    } else {
      // Update the cart item quantity for the logged in user
      await UserModel.updateOne(
        {
          _id: req.session.user._id,
          cart: { $elemMatch: { id: req.params.id } },
        },
        {
          $inc: {
            "cart.$.quantity": 1, // Increment the cart item quantity by 1
          },
        }
      );
      res.json({ success: true });
    }
  } catch (err) {
    // Handle errors
    console.error(err);
    res.status(500).json({
      message: "Server error",
    });
  }
};
// Decrement product quantity
const decrementQuantity = async (req, res) => {
  try {
    // Find the cart item with the given ID for the logged in user
    const { cart } = await UserModel.findOne(
      { "cart.id": req.params.id },
      { _id: 0, cart: { $elemMatch: { id: req.params.id } } }
    );

    if (cart[0].quantity <= 1) {
      // If the cart item quantity is 1, remove the item from the cart
      await UserModel.updateOne(
        {
          _id: req.session.user._id,
        },
        {
          $pull: {
            cart: { id: req.params.id }, // Remove the cart item with the given ID
          },
        }
      );
      res.json({ success: false });
    } else {
      // Decrement the cart item quantity by 1
      await UserModel.updateOne(
        {
          _id: req.session.user._id,
          cart: { $elemMatch: { id: req.params.id } },
        },
        {
          $inc: {
            "cart.$.quantity": -1, // Decrement the cart item quantity by 1
          },
        }
      );
      res.json({ success: true });
    }
    // Redirect to the cart page
  } catch (err) {
    // Handle errors
    console.error(err);
    res.status(500).json({
      message: "Server error",
    });
  }
};

const removeFromCart = async (req, res) => {
  const userId = req.session.user._id;
  const proid = req.params.id;
  await UserModel.updateOne(
    { _id: userId },
    { $pull: { cart: { id: proid } } }
  );
  res.redirect("/cartpage");
};

//wishlist

const getWishlistPage = async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.redirect("/login");
    }

    // Get user and wish list details
    const user = req.session.user;
    const userId = user._id;

    const wishListDetails = await UserModel.findOne(
      { _id: userId },
      { wishlist: 1 }
    );

    // Get cart items
    const wishLIstItems = wishListDetails.wishlist.map((item) => {
      return item.id;
    });

    // Get product details for cart items
    const products = await productModel
      .find({ _id: { $in: wishLIstItems } })
      .lean();

    res.render("users/wish-list", { products,user });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const addToWishList = async (req, res) => {
  try {
    if (req.session.user) {
      const user_id = req.session.user._id;
      const pdt_id = req.params.id;
      await UserModel.updateOne(
        { _id: user_id },
        { $addToSet: { wishlist: { id: pdt_id } } }
      );
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (err) { 
    console.error(err);
    res.status(500).json({
      message: "Server error",
    });
  }
};

const removeFromWishlist = async (req, res) => {
  const userId = req.session.user._id;
  const proid = req.params.id;
  await UserModel.updateOne(
    { _id: userId },
    { $pull: { wishlist: { id: proid } } }
  );
  res.redirect("/wish-list");
};

const wishListToCart=async (req,res)=>{
  try {
    if (req.session.user) {
      const user_id = req.session.user._id;
      const pdt_id = req.params.id;
      await UserModel.updateOne(
        { _id: user_id },
        { $addToSet: { cart: { id: pdt_id, quantity: 1 } } }
      );
      await UserModel.updateOne(
        { _id: user_id },
        { $pull: { wishlist: { id:  pdt_id } } }
      );
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
    });
  }
}



const getProductDetail = async (req, res) => {
  try {
    let proid = req.params.id;
    let user = await req.session.user;
    let products = await productModel.find().limit(4).lean();
    let Quantity = await productModel
      .findOne({ _id: proid })
      .select("quantity")
      .lean();
    let product = await productModel.findOne({ _id: proid }).lean();
    let noQuantity = Quantity.quantity === 0 ? true : false;
    let lowQuantity =
      Quantity.quantity > 0 && Quantity.quantity <= 5 ? true : false;
    res.render("users/productDetail", {
      product,
      products,
      user,
      noQuantity,
      lowQuantity,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const getUserCheckout = async (req, res) => {
  const _id = req.session.user._id;
  let user = await req.session.user;
  const users = await UserModel.findById({ _id }).lean();

  const address = users.address;
  const cart = users.cart;
  const cartQuantity = {};

  const cartItems = cart.map((item) => {
    cartQuantity[item.id] = item.quantity;
    return item.id;
  });
  const product = await productModel.find({ _id: { $in: cartItems } }).lean();
  const products = product.map((item) => {
    return { ...item, quantity: cartQuantity[item._id] };
  });

  let totalAmount = 0;
  let coupons = await couponModel.find().lean();
  let itemprize;
  products.forEach((item, index) => {
    const quantity = cartQuantity[item._id];
    products[index].quantity = quantity;
    totalAmount = totalAmount + item.prize * cartQuantity[item._id];
    item.itemprize = item.prize * item.quantity;
  });

  let coupon = req.session.coupon;

  let cashback = {};
  let date = new Date();
  if (coupon) {
    if (totalAmount > coupon.minimum_purchase_amount) {
      cashback.discountedPrice = totalAmount - coupon.discount;
      cashback.discount = coupon.discount;
    }
  }

  let wallet = Number(req.session.amount);


  if (wallet <= totalAmount) {

    if (wallet) {
      cashback.walletAmount = wallet;
      cashback.walletPrice = totalAmount - wallet;

    }
  }

  if (coupon && wallet) {
    if (totalAmount > coupon.minimum_purchase_amount) {
      if (wallet <= totalAmount) {

        if (wallet) {
          cashback.lastDiscount = coupon.discount + wallet;
          cashback.lastPrice = totalAmount - coupon.discount - wallet;
      
        }
      }
    }
  }
  const message = req.session.message; // Accessing the message here
  req.session.message = null; // Clearing the message from session
  const walletmessage = req.session.walletPrice; // Accessing the message here
  req.session.walletPrice = null; // Clearing the message from session
  res.render("users/checkout", {
    products,
    totalAmount,
    address,
    cart,
    coupon,
    cashback,
    itemprize,
    users,
    msg,
    message,
    walletmessage,user
  });
  msg = null;
  cashback = null;
};



const postUserCheckout = async (req, res) => {
  const userId = req.session.user._id;
  const user = await UserModel.findById(userId).lean();

  const cart = user.cart;

  const cartList = cart.map((item) => {
    return item.id;
  });

  const { address } = await UserModel.findOne({ _id: userId }, { address: 1 });
  const selectedAddress = address.find((e) => e.id == req.body.useraddress);

  const products = await productModel.find({ _id: { $in: cartList } }).lean();
  const orderItems = products.map((item, i) => {
    return {
      product: item._id,
      name: item.productname,
      image: item.image,
      quantity: cart[i].quantity,
      price: cart[i].quantity * item.prize,
      deliveredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
  });

  let totalItemsPrice = 0;

  orderItems.forEach((item) => {
    totalItemsPrice += item.price;
  });

  for (let i = 0; i < products.length; i++) {
    if (products[i].quantity < orderItems[i].quantity) {
      msg = `${products[i].productname} is out of stock.`;
      return res.redirect("/checkout");
    }
  }

  let coupon = req.session.coupon;
  let discount = 0;
  if (coupon) {
    if (totalItemsPrice > coupon.minimum_purchase_amount) {
      discount = coupon.discount;
      req.session.coupon = null;
    }
  }
  const shippingAddress = {
    name: `${selectedAddress.firstname} ${selectedAddress.lastname}`,
    address: `${selectedAddress.address}`,
    state: `${selectedAddress.state}`,
    pincode: `${selectedAddress.town} ${selectedAddress.pincode}`,
    phoneno: `${selectedAddress.phonenumber}`,
  };

  let wallet = Number(req.session.amount);

  if (wallet) {
    await UserModel.updateOne({ _id: userId }, { $inc: { wallet: -wallet } });
    req.session.amount=null
  }
  const totalPrice = totalItemsPrice - (discount || 0) - (wallet || 0);
  const Discount=(discount || 0) + (wallet || 0)
 
  const { paymentMethod } = req.body;

  const order = new orderModel({
    user: userId,
    orderItems: orderItems,
    shippingAddress: shippingAddress,
    paymentMethod: paymentMethod,
    itemsPrice: totalItemsPrice,
    discount: Discount,
    totalPrice: totalPrice,
    date: new Date(),
  });
  req.session.orders = order;
  if (req.body.paymentMethod !== "COD") {
    let orderId = "order_" + createId();
    const options = {
      method: "POST",
      url: "https://sandbox.cashfree.com/pg/orders",
      headers: {
        accept: "application/json",
        "x-api-version": "2022-09-01",
        "x-client-id": "333565b632336d7cea8d6caa61565333",
        "x-client-secret": "fa3273e76456388f4f4498485b16a5647a19b6f1",
        "content-type": "application/json",
      },
      data: {
        order_id: orderId,
        order_amount: req.body.totalAmount || req.body.discountedPrice,
        order_currency: "INR",
        customer_details: {
          customer_id: userId,
          customer_email: "jamshadjamshu596@gmail.com",
          customer_phone: "7012257903",
        },
        order_meta: {
          return_url: "https://boltt.store/verifyPayment?order_id={order_id}",
        },
      },
    };

    await axios
      .request(options)
      .then(function (response) {
        return res.render("users/paymentTemp", {
          orderId,
          sessionId: response.data.payment_session_id,
        });
      })
      .catch(function (error) {
        console.error(error);
      });
  } else {
    await order.save();
    for (let i = 0; i < products.length; i++) {
      await productModel.updateOne(
        { _id: products[i]._id },
        { $inc: { quantity: -orderItems[i].quantity } }
      );

      await UserModel.findByIdAndUpdate(userId, { $set: { cart: [] } });
    }
    res.redirect("/orderConfirmed");
  }
};
const postCouponCode = async (req, res) => {
  try {

    const coupon = await couponModel.findOne({ code: req.body.couponcode });
    if (!coupon) {
      req.session.coupon = null;
      req.session.message = "Invalid coupon code";
      res.redirect("/checkout");
    } else if (coupon.expiration_date < new Date()) {
      req.session.coupon = null;
      req.session.message = "Coupon code has expired";
      res.redirect("/checkout");
    } else if (
      coupon.maximum_uses &&
      coupon.maximum_uses <= coupon.used_count
    ) {
      req.session.coupon = null;
      req.session.message = "Coupon code has exceeded maximum uses";
      res.redirect("/checkout");
    } else {
      req.session.coupon = coupon;
      req.session.message = "Coupon code applied successfully";
      res.redirect("/checkout");
    }
  } catch (error) {
    console.error(error);
    req.session.message = "An error occurred while processing the coupon code.";
    res.status(500).render("/checkout", {
      message: req.session.message,
    });
  }
};


const getVerifiedOrder = async (req, res) => {
  let user = await req.session.user;
  res.render("users/order-confirmed",{user});
};

const deleteAddress=async(req,res)=>{
  const userId = req.session.user._id;
const addressId = req.params.id;

try {
  const updatedUser = await UserModel.findOneAndUpdate(
    {_id: userId},
    {$pull: {address: {id: addressId}}},
    {new: true}
  );
  res.redirect('/profile');
} catch (err) {
  res.status(500).json({message: "Failed to delete address", error: err});
}
}

const getUserPayment = async (req, res) => {
  const userId = req.session.user._id;
  const user = await UserModel.findById(userId).lean();

  const cart = user.cart;
  const cartList = cart.map((item) => {
    return item.id;
  });
  const products = await productModel.find({ _id: { $in: cartList } }).lean();

  const order_id = req.query.order_id;

  const options = {
    method: "GET",
    url: "https://sandbox.cashfree.com/pg/orders/" + order_id,
    headers: {
      accept: "application/json",
      "x-api-version": "2022-09-01",
      "x-client-id": "333565b632336d7cea8d6caa61565333",
      "x-client-secret": "fa3273e76456388f4f4498485b16a5647a19b6f1",
      "content-type": "application/json",
    },
  };

  try {
    const response = await axios.request(options);
    if (response.data.order_status === "PAID") {
      await orderModel.create(req.session.orders);
      for (let i = 0; i < products.length; i++) {
        await productModel.updateOne(
          { _id: products[i]._id },
          { $inc: { quantity: -req.session.orders.orderItems[i].quantity } }
        );
      }
      await UserModel.findByIdAndUpdate(userId, { $set: { cart: [] } });
      res.redirect("/orderConfirmed");
    } else {
      res.redirect("/cart");
    }
  } catch (error) {
    console.error(error);
    res.redirect("/cart");
  }
};

// const getUserPayment=(req,res)=>{

// }

const getAddAddress = (req, res) => {
  res.render("users/add-New-Address");
};
const postAddAddress = async (req, res) => {
  const _id = req.session.user._id;
  const {
    firstname,
    lastname,
    country,
    address,
    state,
    town,
    pincode,
    phonenumber,
    landmark,
  } = req.body;

  // Get the user from the database using the _id
  const user = await UserModel.findById(_id);

  // Set the address fields of the user document
  user.address.push({
    firstname: firstname,
    lastname: lastname,
    country: country,
    address: address,
    state: state,
    town: town,
    pincode: pincode,
    phonenumber: phonenumber,
    landmark: landmark,
    id: createId(),
  });

  // Save the updated user document
  await user.save();

  // Send the response to the client
  res.redirect("/checkout");
};

//edit address

const getEditAddress = async (req, res) => {
  const user = req.session.user;
  const Id = req.params.id;
  let { address } = await UserModel.findOne(
    { _id: user._id },
    { address: 1 }
  ).lean();
  let data = address.find((e) => e.id == Id);
  if (user) {
   res.render("users/editAddress", { data });
  } else {
    res.redirect("/");
  }
};

const postEditAddress = async (req, res) => {
  try {
    await UserModel.updateOne(
      { _id: req.session.user._id, "address.id": req.body.id },
      {
        $set: {
          "address.$.firstname": req.body.firstname,
          "address.$.lastname": req.body.lastname,
          "address.$.country": req.body.country,
          "address.$.address": req.body.address,
          "address.$.landmark": req.body.landmark,
          "address.$.state": req.body.state,
          "address.$.town": req.body.town,
          "address.$.pincode": req.body.pincode,
          "address.$.phonenumber": req.body.phonenumber,
        },
      }
    );
    res.redirect("/profile");
  } catch (error) {
    console.error(error);
    res.render("404page");
  }
};


// sort

const categorySelect = async (req, res) => {
  try {
    let catgproducts = await productModel
      .find({ category: req.query.catgy, block: false })
      .lean();
    let catstatus = req.query.catgy;
    req.session.catgproducts = catgproducts;
    req.session.catstatus = catstatus;
    res.redirect("/productpage");
  } catch (error) {
    res.render("errorpage", {
      error: true,
      message: "Something went wrong. Please try again later.",
    });
  }
};

const brandSelect = async (req, res) => {
  const brand = req.query.brand;

  try {
    const brandProducts = await productModel
      .find({ brand, block: false })
      .lean(); // add block filter to only get non-blocked products
    let brandStatus = req.query.brand;

    req.session.brandproducts = brandProducts;
    req.session.brandstatus = brandStatus; // rename to brandStatus to avoid naming conflicts with other variables
    res.redirect("/productpage");
  } catch (error) {

    res.render("errorpage", {
      error: true,
      message: "Something went wrong. Please try again later.",
    });
  }
};

const priceSorting = async (req, res) => {
  try {
    const sort = req.query.sort || "asc"; // default to ascending order if no sort parameter is provided
    let sortProducts;
    let sorted = true;
    if (req.session.brandstatus) {
      sortProducts = await productModel
        .find({ brand: req.session.brandstatus })
        .sort({ prize: sort === "asc" ? 1 : -1 }) // use ternary operator to determine the sorting order based on the sort parameter
        .lean();
    } else if (req.session.catstatus) {
      sortProducts = await productModel
        .find({ category: req.session.catstatus })
        .sort({ prize: sort === "asc" ? 1 : -1 })
        .lean();
    } else {
      sortProducts = await productModel
        .find()
        .sort({ prize: sort === "asc" ? 1 : -1 })
        .lean();
    }
    req.session.sortProducts = sortProducts;
    req.session.sorted = sorted;
    res.redirect("/productpage");
  } catch (error) {

    res.redirect("/404");
  }
};
//filter

const postSearchProduct = async (req, res) => {
  try {
    const [category, brand] = await Promise.all([
      categoryModel.find({ block: false }).lean(),
      brandModel.find({ block: false }).lean(),
    ]);

    if (req.body.name) {
      const products = await productModel
        .find({
          $and: [
            { status: "available" },
            {
              $or: [
                { productname: new RegExp(req.body.name, "i") },
                { category: new RegExp(req.body.name, "i") },
              ],
            },
          ],
        })
        .lean();
      res.render("users/allProductPage", {
        products: products,
        category: category,
        brand: brand,
      });
    } else {
      res.render("users/allProductPage", { category: category, brand: brand });
    }
  } catch (err) {
    res.render('admin/error404')
    // Handle the error here
  }
};

//profile

const getProfile = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const user = await UserModel.findById(userId).lean();
    const address = user.address;
    res.render("users/profile", { user, address });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

//order history
const getOrderHistory = async (req, res) => {
  const user = req.session.user;
  const orders = await orderModel
    .find({ user: user._id })
    .sort({ date: -1 })
    .lean();
  res.render("users/ordersHistory", { formatDate, user, orders });
};

const getOrders = async (req, res) => {
  const user = req.session.user;
  const proId = req.params.id;
  const order = await orderModel
    .findOne({ orderItems: { $elemMatch: { _id: proId } } })
    .lean();

  if (!order) {
    // Handle case where order is null
    return res.status(404).send("Order not found");
  }

  const orderItem = order.orderItems.find(
    (item) => item._id.toString() === proId
  );

  const productId = orderItem.product;
  const review = await productModel
    .findOne(
      { _id: productId, reviews: { $elemMatch: { user: order.user } } },
      { reviews: { $elemMatch: { user: order.user } } }
    )
    .lean();
  const returnFinished = new Date(orderItem.deliveredDate);
  returnFinished.setDate(returnFinished.getDate() + 7);
  const returnFinishedString = returnFinished.toLocaleDateString();

  // Check if orderItem is delivered and if return date has not passed
  const isOrderReturnable =
    orderItem.status === "Delivered" && new Date() < returnFinished;
  
  res.render("users/order-History-View", {
    formatDate,
    orderItem,
    user,
    order,
    returnFinished: returnFinishedString,
    isOrderReturnable,
    review,
  });
};

// order Mangament
const orderCancel = async (req, res) => {
  try {
    const { orderId, orderItemId, userId, itemPrice } = req.body;
    const order = await orderModel.findOne({ _id: orderId });
    const paymentMethod = order.paymentMethod;
    const orderItem = await orderModel.findOne(
      { _id: orderId, "orderItems._id": orderItemId }
    );
    
 
      const matchingOrderItem = orderItem.orderItems.find(item => item._id == orderItemId);
      const thisItemPrice = matchingOrderItem.price;
    const numOrderItems = order.orderItems.length;
    const singleProductDiscount = order.discount / numOrderItems;
    const discountedPrice = thisItemPrice- singleProductDiscount;
    const price = order.totalPrice - discountedPrice;
   
    if (paymentMethod === "Online-payment") {
      await orderModel.updateOne(
        { _id: orderId, "orderItems._id": orderItemId },
        { 
          totalPrice: price,
          "orderItems.$.status": "Cancelled",
          "orderItems.$.deliveredDate": null,
          "orderItems.$.cancelledDate": new Date(),
        }
      );
      await UserModel.updateOne({ _id: userId }, { $inc: { wallet: itemPrice } });
    } else {
      await orderModel.updateOne(
        { _id: orderId, "orderItems._id": orderItemId },
        {
          totalPrice: price,
          "orderItems.$.status": "Cancelled",
          "orderItems.$.deliveredDate": null,
          "orderItems.$.cancelledDate": new Date(),
        }
      );
    }
    res.redirect(`/orders/${orderItemId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while cancelling the order.");
  }
};


//return

const orderReturn = async (req, res) => {
  const { orderId, orderItemId } = req.body;
  await orderModel.updateOne(
    { _id: orderId, "orderItems._id": orderItemId },
    {
      "orderItems.$.status": "Return requested",
      "orderItems.$.returnDate": new Date(),
    }
  );
  res.redirect(`/orders/${orderItemId}`);
};

//review
const postAddReview = async (req, res) => {
  const { productId, rating, comment, Id, user } = req.body;

  try {
    const product = await ProductModel.findOneAndUpdate(
      { _id: productId },
      { $push: { reviews: { rating, comment, user } } }
    );

    res.redirect(`/orders/${Id}`);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

//wallet

const useWallet = async (req, res) => {
  const userId = req.session.user._id;
  const user = await UserModel.findOne({ _id: userId });
  const walletBalance = user.wallet;
  if (req.body.amount > walletBalance) {
   req.session.walletPrice="please check the wallet balance"
   res.redirect("/checkout");
  } else {
    req.session.amount = req.body.amount;
    res.redirect("/checkout");
  }
};

module.exports = {
  // Home page
  getHomePage,
  // Products

  getAllProductPage,
  getProductDetail,

  // Cart
  addToCart,
  getCartPage,
  removeFromCart,
  incrementQuantity,
  decrementQuantity,
  postUserCheckout,
  getAddAddress,
  postAddAddress,

  // Checkout
  getUserCheckout,

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
  postCouponCode,
  getUserPayment,
  addToWishList,

  // wishlist
  getWishlistPage,
  removeFromWishlist,
  getEditAddress,
  postEditAddress,
  wishListToCart,

  //filter
  categorySelect,
  brandSelect,
  postSearchProduct,
  priceSorting,

  //profile

  getProfile,
  getOrderHistory,
  userLogout,
  getOrders,
  getVerifiedOrder,

  //review

  postAddReview,

  //orderManagement

  orderCancel,
  orderReturn,

  useWallet,
  deleteAddress,
  getChangePassword,
  postChangePassword,
};
