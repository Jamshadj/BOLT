const express = require("express");
const adminModel = require("../models/adminModel");
const productModel = require("../models/productModel");
const categoryModel = require("../models/categoryModel");
const brandModel = require("../models/brandModel");
const usermodel = require("../models/UserModel");
const bannerModel = require("../models/bannerModel");
const couponModel = require("../models/couponModel");
const orderModel = require("../models/orderModel");
const sharp = require("sharp");
const path = require('path');
const fs = require("fs");
const { Error } = require("mongoose");


// Define function to render the Admin login page

let msg = null;
const getAdminLoginPage = (req, res, next) => {
  try {
    if (req.session.admin) {
      res.redirect("admin/home"); // Redirect to admin home page if already logged in
    } else {
      let msg;
      if (msg == undefined) {
        // do nothing
      } else {
        msg = msg; // Set message to the value of msg if defined
      }
      res.render("admin/AdminLogin", { CSS: ["stylesheet/adminlogin.css"], msg }); // Render the Admin login page with any messages
      msg = null; // Reset the message after rendering the page
    }
  } catch (err) {
    next(err); // Pass any caught errors to the error handling middleware
  }
};

// Define function to render the Admin home page
const getAdminHomePage = (req, res) => {
  if (req.session.admin) {
    res.render("admin/Adminhome", { CSS: ["stylesheet/style.css"] }); // Render the Admin home page if logged in
  } else {
    res.redirect("/admin"); // Redirect to the Admin login page if not logged in
  }
}

// Define function to handle Admin login form submission
const postAdminLogin = async (req, res) => {
  const { email, password } = req.body;
  const adminmail = await adminModel.findOne({ email: email });

  if (adminmail) {
    if (password == adminmail.password) {
      req.session.admin = true; // Set session variable to indicate successful login
      res.redirect("/admin/home"); // Redirect to the Admin home page if login successful
    } else {
      msg = "Password incorrect"; // Set error message if password is incorrect
      res.redirect("/admin"); // Redirect to the Admin login page
    }
  } else {
    msg = "Check email and password"; // Set error message if email is not found
    res.redirect("/admin"); // Redirect to the Admin login page
  }
};


const adminLogout = async (req, res) => {
  req.session.destroy()
  res.redirect('/admin')
}


//Product Management 


// Define function to render the Products page
const getProductsPage = async (req, res) => {
  let productsdetail = await productModel.find().sort({ _id: -1 }).lean();
 
  if (req.session.admin) {
    res.render("admin/products", { productsdetail, msg });
  } else {
    res.redirect('/admin');
  }
};


// Define function to render the Add Product page
const getAddProducts = async (req, res) => {
  let category = await categoryModel.find().lean();
  let brands = await brandModel.find().lean();
  if (req.session.admin) {
    res.render("admin/addProduct", { category, brands, msg });

  } else {
    res.redirect('/admin');
  }
};
const postAddProducts = async (req, res) => {
  let block = false;
  const { productname, category, brand, quantity, prize, MRP, description } = req.body;

  try {
    let products;
    await sharp(req.files.image[0].path)
    .png()
    .resize(250, 250, {
      kernel: sharp.kernel.nearest,
      fit: 'contain',
      position: 'center',
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    })
    .toBuffer(async (err, data, info) => {
      if (err) {
        throw err;
      }
      const compressedImage = await sharp(data).toBuffer();
      fs.writeFileSync(req.files.image[0].path + ".png", compressedImage);
      req.files.image[0].filename = req.files.image[0].filename + ".png";

      // Crop and save subimages
      const subimages = [];
      for (const file of req.files.subimage) {
        const subimageData = await sharp(file.path)
          .resize(250, 250, {
            kernel: sharp.kernel.nearest,
            fit: 'contain',
            position: 'center',
            background: { r: 255, g: 255, b: 255, alpha: 0 }
          })
          .toBuffer();
        const subimageBuffer = await sharp(subimageData)
          .extract({
            left: Math.floor(info.width / 2) - 125,
            top: Math.floor(info.height / 2) - 125,
            width: 250,
            height: 250,
          })
          .toBuffer();
        const subimageFilename = file.filename + ".png";
        fs.writeFileSync(file.path + ".png", subimageBuffer);
        subimages.push(subimageFilename);
      }

      products = new productModel({
        productname,
        category,
        brand,
        quantity,
        prize,
        MRP,
        description,
        block,
        image: req.files.image[0].filename,
        subimage: subimages,
      });
      await products.save();
      return res.redirect("/admin/products");
    });
  } catch (error) {
    msg = "Please ensure that all details entered are correct.";
    return res.redirect("/admin/addproducts");
  }
};




// GET method for product edit page
const getProductEdit = async (req, res) => {
  let proid = req.params.id;
  let category = await categoryModel.find().lean();
  let brands = await brandModel.find().lean();
  let product = await productModel.findOne({ _id: proid }).lean();

  if (req.session.admin) {
    res.render("admin/productedit", { product, category, brands, msg });

  } else {
    res.redirect('/admin')
  }
};

const postProductEdit = async (req, res) => {
  const {
    productname,
    category,
    brand,
    quantity,
    prize,
    description,
    MRP,
    _id,
  } = req.body;

  try {
    let product;

    // Validate image
    if (req.files?.image) {
      const image = req.files.image[0];
      const validExtensions = [".jpg", ".jpeg", ".png", ".webp"];
      const fileExtension = path.extname(image.originalname).toLowerCase();

      if (!validExtensions.includes(fileExtension)) {
        throw new Error("Invalid image file type");
      }
    }

    if (req.files?.image && req.files?.subimage) {
      await sharp(req.files.image[0].path)
        .png()
        .resize(250, 250, {
          kernel: sharp.kernel.nearest,
          fit: 'contain',
          position: 'center',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .toFile(req.files.image[0].path + ".png");
      req.files.image[0].filename = req.files.image[0].filename + ".png";
      req.files.image[0].path = req.files.image[0].path + ".png";

      product = await productModel.updateOne(
        { _id },
        {
          $set: {
            productname,
            category,
            brand,
            quantity,
            prize,
            MRP,
            description,
            image: req.files.image[0].filename,
            subimage: req.files.subimage.map(file => file.filename),
          },
        }
      );
    } else if (!req.files?.image && req.files?.subimage) {
      product = await productModel.updateOne(
        { _id },
        {
          $set: {
            productname,
            category,
            brand,
            quantity,
            prize,
            MRP,
            description,
            subimage: req.files.subimage.map(file => file.filename),
          },
        }
      );
    } else if (!req.files?.image && !req.files?.subimage) {
      product = await productModel.updateOne(
        { _id },
        {
          $set: {
            productname,
            category,
            brand,
            quantity,
            prize,
            MRP,
            description,
          },
        }
      );
    } else if (req.files?.image && !req.files?.subimage) {
      await sharp(req.files.image[0].path)
        .png()
        .resize(250, 250, {
          kernel: sharp.kernel.nearest,
          fit: 'contain',
          position: 'center',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .toFile(req.files.image[0].path + ".png");
      req.files.image[0].filename = req.files.image[0].filename + ".png";
      req.files.image[0].path = req.files.image[0].path + ".png";

      product = await productModel.updateOne(
        { _id },
        {
          $set: {
            productname,
            category,
            brand,
            quantity,
            prize,
            MRP,
            description,
            image: req.files.image[0].filename,
          },
        }
      );
    }
    return res.redirect("/admin/products");
  } catch (error) {
    console.error(error);
    msg = " Please check the fields and ensure that they are correct. If the issue persists, please contact the system administrator for further assistance."
    return res.status(500).send("Internal Server Error");
  }
};

// DELETE method for deleting product's main image
const deleteProductMainImage = async (req, res) => {
  try {
    const id = req.params.id;
    await productModel.findByIdAndUpdate(id, { $unset: { image: 1 } });
    res.redirect("/admin/productedit/" + id);
  } catch (err) {
    console.error(err);
    res.redirect("/admin/productedit/" + id);
  }
};


const deleteProductSubImage = async (req, res) => {

}
// BLOCK PRODUCT
const blockProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    await productModel.findByIdAndUpdate(
      { _id: productId },
      { $set: { block: true } }
    );
    res.redirect("/admin/products");
  } catch (error) {
    console.error(error);
    res.redirect("/admin/products");
  }
};

// UNBLOCK PRODUCT
const unblockProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    await productModel.findByIdAndUpdate(
      { _id: productId },
      { $set: { block: false } }
    );
    res.redirect("/admin/products");
  } catch (error) {
    console.error(error);
    res.redirect("/admin/products");
  }
};


//ADD CATEGORY
const getCategory = async (req, res) => {
  try {
    const category = await categoryModel.find().sort({ _id: -1 }).lean();
    if (req.session.admin) {
      res.render("admin/AddCategory", { category, msg });
      msg = null
    } else {
      res.redirect('/admin');
    }
  } catch (err) {
    console.error(err);
    msg = "Sorry, there was an error";
    res.render("admin/AddCategory", { category: [], msg });
  }
};

const postAddCategory = async (req, res) => {

  try {
    const { newcategory } = req.body;
    const categorycheck = newcategory.trim();
    const existingCategories = await categoryModel.findOne({
      newcategories: { $regex: new RegExp(`^${categorycheck}$`, 'i') }
    });

    if (existingCategories) {

      msg = "The category you are trying to add already exists.";
    
      res.redirect('/admin/AddCategory');
    } else {
      const newCategories = new categoryModel({ newcategories: categorycheck, block: false });
      await newCategories.save();
      res.redirect('/admin/AddCategory');
    }
  } catch (err) {
    console.error(err);
    msg = "Sorry, there was an error adding the category. Please try again later";
    msg = null
    res.render('admin/AddCategory', { msg });
  }
};

//BLOCK CATEGORY
const blockCategory = async (req, res) => {
  try {
    const proid = req.params.id;
    await categoryModel.findByIdAndUpdate(
      { _id: proid },
      { $set: { block: true } }
    );
    res.redirect("/admin/addcategory");
  } catch (err) {
    res.redirect("/admin/addcategory");
  }
};

const unblockCategory = async (req, res) => {
  try {
    const proid = req.params.id;
    await categoryModel.findByIdAndUpdate(
      { _id: proid },
      { $set: { block: false } }
    );
    res.redirect("/admin/addcategory");
  } catch (err) {
    res.redirect("/admin/addcategory");
  }
};

const getCategoryEdit = async (req, res) => {
  try {
    const catId = req.params.id;
    const category = await categoryModel.findOne({ _id: catId }).lean();
    if (req.session.admin) {
      res.render("admin/categoryEdit", { category });
    } else {
      res.redirect('/admin');
    }
  } catch (err) {
    console.error(err);
    res.redirect('/admin/addcategory');
  }
};

const postCategoryEdit = async (req, res) => {
  try {
    const { newcategories, _id } = req.body;
    await categoryModel.findByIdAndUpdate(
      { _id },
      { $set: { newcategories } }
    );
    res.redirect("/admin/Addcategory");
  } catch (err) {
    console.error(err);
    res.redirect('/admin/addcategory');
  }
};

//BRAND

//Retrieve all brands from the database and render the brand page
const getBrand = async (req, res) => {
  try {
    let brands = await brandModel.find().sort({ _id: -1 }).lean();
    if (req.session.admin) {
      res.render("admin/brand", { brands });
    } else {
      res.redirect('/admin')
    }
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};

//Render the add brand page
const getAddBrand = (req, res) => {
  try {
    if (req.session.admin) {
      res.render('admin/addbrand', { msg })
    } else {
      res.redirect('/admin')
    }
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
}

//Add a new brand to the database
const postAddBrand = async (req, res) => {
  try {
    let block = false;
    const { brand } = req.body;
    const brandcheck = brand.trim();
    const existingBrand = await brandModel.findOne({
      newbrands: { $regex: new RegExp(`^${brandcheck}$`, 'i') }
    });

    //Check if the brand already exists, if it does redirect back to the add brand page
    if (existingBrand) {
      msg = "The brand you are trying to add already exists."
      res.redirect('/admin/addbrand');
      return;
    }

    const newbrands = brandcheck;
    let NewBrands = new brandModel({
      newbrands,
      block,
      image: req.files.image[0].filename, //Get the image file from the request
    });
    await NewBrands.save();
    res.redirect("/admin/brand");
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};

//Block a brand in the database
const blockBrand = async (req, res) => {
  try {
    let braid = req.params.id;
    await brandModel.findByIdAndUpdate(
      { _id: braid },
      { $set: { block: true } }
    );
    res.redirect("/admin/brand");
  } catch (error) {
    msg = error;
   
    res.status(500).send("Internal Server Error");
  }
};

//Unblock a brand in the database
const unblockBrand = async (req, res) => {
  try {
    let braid = req.params.id;
    await brandModel.findByIdAndUpdate(
      { _id: braid },
      { $set: { block: false } }
    );
    res.redirect("/admin/brand");
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};

const getBrandEdit = async (req, res) => {
  try {
    let braId = req.params.id;
    let brand = await brandModel.findOne({ _id: braId }).lean();
    if (req.session.admin) {
      res.render("admin/brandEdit", { brand });
    } else {
      res.redirect('/admin')
    }
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};
const postBrandEdit = async (req, res) => {
  try {
    const { newbrands, _id } = req.body;
    if (req.files && req.files.image && req.files.image[0]) { // check if image exists before accessing it
      const brand = await brandModel.updateOne(
        { _id },
        {
          $set: {
            newbrands,
            image: req.files.image[0].filename,
          },
        }
      );
      res.redirect('/admin/brand');// send response
    } else {
      const brand = await brandModel.updateOne(
        { _id },
        {
          $set: {
            newbrands,
          },
        }
      );
      res.redirect('/admin/brand'); // send response
    }
  } catch (error) {
    res.status(500).send("Server error"); // send error response
  }
};


// Get all users
const getUsers = async (req, res) => {
  try {
    let users = await usermodel.find().sort({ _id: -1 }).lean();
    if (req.session.admin) {
      res.render("admin/users", { users });
    } else {
      res.redirect("/admin");
    }
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};

// Block user
const blockUser = async (req, res) => {
  try {
    let userId = req.params.id;
    await usermodel.findByIdAndUpdate(
      { _id: userId },
      { $set: { block: true } }
    );
    res.redirect("/admin/users");
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};

// Unblock user
const unblockUser = async (req, res) => {
  try {
    let userId = req.params.id;
    await usermodel.findByIdAndUpdate(
      { _id: userId },
      { $set: { block: false } },
    );
    res.redirect("/admin/users");
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};
//BANNER

// Retrieve all banners
const getBanner = async (req, res) => {
  try {
    let banner = await bannerModel.find().sort({ _id: -1 }).lean();
    if (req.session.admin) {
      res.render("admin/banner", { banner });
    } else {
      res.redirect('/admin');
    }
  } catch (err) {
    console.error(err);
    res.redirect('/admin');
  }
};

// Render add banner form
const getAddBanner = (req, res) => {
  if (req.session.admin) {
    res.render("admin/Addbanner", { msg });
    msg = null;
  } else {
    res.redirect('/admin');
  }
};

// Controller function for adding a new banner
const PostAddBanner = async (req, res) => {
  try {
    // Extract name and description from request body
    const { name, description } = req.body;
    // Create new banner instance with name, description, and image filename
    const newBanner = new bannerModel({
      name,
      description,
      image: req.files.image[0].filename,
    });
    // Save banner to database
    const savedBanner = await newBanner.save();
 
    res.redirect("/admin/banner");
  } catch (error) {
    // Handle errors by rendering error page
    res.render('admin/error404');
  }
};


// Delete a banner by ID
const deleteBanner = async (req, res) => {
  try {
    const banId = req.params.id;
    await bannerModel.findByIdAndRemove({ _id: banId }).lean();
    res.redirect("/admin/banner");
  } catch (err) {
    console.error(err);
    res.redirect('/admin');
  }
};
// Get all coupons from the database
const getCoupon = async (req, res) => {
  try {
    let coupon = await couponModel.find().sort({ _id: -1 }).lean();
    if (req.session.admin) {
      res.render("admin/coupon", { coupon });
    } else {
      res.redirect('/admin')
    }
  } catch (err) {
    res.status(500).send("Error retrieving coupons: " + err);
  }
};

// Render the add coupon page
const getAddCoupon = (req, res) => {
  if (req.session.admin) {
    res.render("admin/addCoupon", { msg });
    msg = null;
  } else {
    res.redirect("/admin")
  }
};

const postAddCoupon = async (req, res) => {
  const { name, code, discount, expiration_date, minimum_purchase_amount, maximum_uses } = req.body;
  try {
    // Check if a coupon with the same name already exists

    const existingCoupon = await couponModel.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') }

    });
    const existingCode = await couponModel.findOne({
      code: { $regex: new RegExp(`^${code}$`) }
    });
    if (existingCoupon) {
      // If a coupon with the same name exists, redirect back to the add coupon page with an error message
      msg = "Coupon name already exists";
      return res.redirect('/admin/addCoupon');
    }
    else if (existingCode) {
      msg = "Coupon code is already exists";
      return res.redirect('/admin/addCoupon');
    }
    // Check if the expiration_date is before today
    if (new Date(expiration_date) < new Date()) {
      // If the expiration_date is before today, redirect back to the add coupon page with an error message
      msg = "Expiration date must be after today";
      return res.redirect('/admin/addCoupon');
    }
    // Create a new coupon object and save it to the database
    const coupon = new couponModel({
      name,
      code,
      discount,
      expiration_date,
      minimum_purchase_amount,
      maximum_uses
    });
    await coupon.save();
 
    // Redirect to the coupon page after successfully adding a new coupon
    res.redirect("/admin/coupon");
  } catch (err) {
    // Handle errors when adding a new coupon
    res.status(500).send("Error saving coupon: " + err);
  }  
};


// Render the coupon edit page
const getCouponEdit = async (req, res) => {
  try {
    const copId = req.params.id;
    // Find the coupon to edit by its id
    const coupon = await couponModel.findOne({ _id: copId }).lean();
    if (req.session.admin) {
      res.render("admin/couponEdit", { coupon });
    } else {
      res.redirect("/admin")
    }
  } catch (err) {
    // Handle errors when retrieving the coupon to edit
    res.status(500).send("Error retrieving coupon: " + err);
  }
};

// Update an existing coupon in the database
const postCouponEdit = async (req, res) => {
  const { name, code, _id, discount, expiration_date, minimum_purchase_amount, maximum_uses } = req.body;
  try {
    // Find the coupon to update by its id and set the new values

    await couponModel.findByIdAndUpdate(
      { _id },
      {
        $set: {
          name,
          code,
          discount,
          expiration_date,
          minimum_purchase_amount,
          maximum_uses
        },
      }
    );
    // Redirect to the coupon page after successfully updating the coupon
    res.redirect("/admin/coupon");
  } catch (err) {
    // Handle errors when updating the coupon
    res.status(500).send("Error updating coupon: " + err);
  }
};


const deleteCoupon = async (req, res) => {
  try {
    const copId = req.params.id;
    await couponModel.findByIdAndRemove({ _id: copId }).lean();
    res.redirect("/admin/coupon");
  } catch (err) {
    res.status(500).send("Error deleting coupon: " + err);
  }
};
// Get all orders
const getAllOrders = async (req, res) => {
  try {
    // Check if user is authorized to access the admin panel
    if (!req.session.admin) {
      return res.redirect('/admin');
    }

    // Retrieve all orders from the database
    const orders = await orderModel.find().sort({ _id: -1 }).lean();

    // Render the orders page with the orders data
    res.render("admin/orders", { orders });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

// Display the order status edit page
const displayOrderStatusEditPage = async (req, res) => {
  try {
    // Retrieve the order id from the request parameters
    const Id = req.params.id;
    const order = await orderModel.findOne({ orderItems: { $elemMatch: { _id: Id } } }).lean();

    const orderItem = order.orderItems.find(item => item._id.toString() === Id);
    res.render('admin/orderStatusEdit', { order, orderItem });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};
const updateOrderStatus = async (req, res) => {
  try {
    // Retrieve the new order status, the order id, and the item id from the request body
    const { status, orderId, itemId, userId, itemPrice } = req.body;

    // Find the order by its ID
    const order = await orderModel.findById(orderId);

    // Update the status of the order item with the matching ID
    let item;
    order.orderItems.forEach((orderItem) => {
      if (orderItem._id == itemId) {
        orderItem.status = status;
        if (status === "Delivered") {
          item = orderItem;
          item.deliveryDate = new Date();
        }
        else if (status === "Return completed") {
          item = orderItem;
          item.returnDate = new Date();
        }
      }
    });
    if (status === "Return completed") {
      await orderModel.updateOne(
        { _id: orderId, "orderItems._id": itemId },
        {
          $set: {
            "orderItems.$.status": status,
            "orderItems.$.returnDate": item?.returnDate,
          },
        }
      );
      await usermodel.updateOne(
        { _id: userId },
        { $inc: { wallet: itemPrice } }
      );
    }
    // Save the updated order item to the database
    await orderModel.updateOne(
      { _id: orderId, "orderItems._id": itemId },
      {
        $set: {
          "orderItems.$.status": status,
          "orderItems.$.deliveredDate": item?.deliveryDate,
        },
      }
    );

    // Redirect to the orders page
    res.redirect("/admin/orders");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

const getOrderviewPage = async (req, res) => {
  try {
    const _id = req.params.id;
    const order = await orderModel.findById(_id).lean();
    order.date = order.date.toLocaleDateString();
    res.render('admin/orders-view', { order });
  } catch (error) {
    console.error(error);
    res.render('admin/error');
  }
};

const getAdminSalesReport = async (req, res) => {

  try {
    let startDate = new Date(new Date().setDate(new Date().getDate() - 8));
    let endDate = new Date();
    let filter = req.query.filter ?? "";

    if (req.query.startDate) startDate = new Date(req.query.startDate);
    if (req.query.endDate) endDate = new Date(req.query.endDate);

    const currentDate = new Date();
    switch (req.query.filter) {

      case 'thisYear':
        startDate = new Date(currentDate.getFullYear(), 0, 1);
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        break;
      case 'lastYear':
        startDate = new Date(currentDate.getFullYear() - 1, 0, 1);
        endDate = new Date(currentDate.getFullYear() - 1, 11, 31);
        break;
      case 'thisMonth':
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        break;
      case 'lastMonth':
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        break;
      default:
        if (!req.query.filter && !req.query.startDate) filter = "lastWeek";
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(24, 0, 0, 0);


    let salesCount = 0;


    let deliveredOrders
    let salesSum
    let result
    if (req.query.startDate || req.query.endDate || req.query.filter) {

      let startDate, endDate, filter;
      if (req.query.startDate) {
        startDate = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        endDate = new Date(req.query.endDate);
      }
      if (req.query.filter) {
        filter = req.query.filter;
      }

      const query = {};
      if (startDate && endDate) {
        query.date = { $gte: startDate, $lte: endDate };
      }
      if (filter) {
        query.filter = filter;
      }

      const orders = await orderModel.find(query).sort({ date: -1 }).lean();
      salesCount = orders.length;

      deliveredOrders = orders.filter(order => order.orderItems.some(item => item.status === "Delivered"));
      salesSum = deliveredOrders.reduce((acc, order) => acc + order.totalPrice, 0);
    }
    else {
      deliveredOrders = await orderModel.find({ 'orderItems.status': "Delivered" }).populate("orderItems").lean();
      deliveredOrders = deliveredOrders.map((order) => {
        order.date = new Date(order.date).toLocaleString();
        return order;
      });


      salesCount = await orderModel.countDocuments({ 'orderItems.status': 'Delivered' });



      result = await orderModel.aggregate([
        {
          $match: { 'orderItems.status': 'Delivered' }
        },
        {
          $unwind: "$orderItems" // unwind the orderItems array
        },
        {
          $match: { 'orderItems.status': 'Delivered' }
        },
        {
          $group: { _id: null, totalPrice: { $sum: '$orderItems.price' } }
        }
      ]);


      salesSum = result[0]?.totalPrice
    }
    const users = await orderModel.distinct('user')
    const userCount = users.length
    res.render("admin/salesReport", { userCount, salesCount, salesSum, deliveredOrders })

  } catch (error) {
    res.status(404)
    throw new Error("cant get")
  }
}








const getAdminDashboard = async (req, res) => {
  if (!req.session.admin) {
    return res.redirect('/admin');
  }


  const deliveredOrders = await orderModel.find({ 'orderItems.status': "Delivered" }).lean();

  let totalRevenue = 0;
  deliveredOrders.forEach(order => {
    order.orderItems.forEach(item => {
      totalRevenue += item.price;
    });
  });
  const monthlyDataArray = await orderModel.aggregate([
    { $match: { 'orderItems.status': "Delivered" } },
    {
      $addFields: {
        orderDateConverted: {
          $toDate: "$date"
        }
      }
    },
    {
      $group: {
        _id: { $month: "$orderDateConverted" },
        sum: { $sum: "$totalPrice" }
      }
    },
  ]);

  let monthlyDataObject = {};
  monthlyDataArray.forEach(item => {
    monthlyDataObject[item._id] = item.sum;
  });

  let monthlyData = [];
  for (let i = 1; i <= 12; i++) {
    monthlyData[i - 1] = monthlyDataObject[i] || 0;
  }

  const onlineOrdersCount = await orderModel.countDocuments({ "paymentMethod": "Online-payment" });
  const codOrdersCount = await orderModel.countDocuments({ "paymentMethod": "COD" });
  const userCount = await usermodel.countDocuments();
  const productCount = await productModel.countDocuments();
  const orderCount = await orderModel.countDocuments();
  const orderData = await orderModel.find().sort({ _id: -1 }).limit(5).lean()

  const startDate = new Date();
  const endDate = new Date(new Date().setDate(new Date().getDate() - 7));

  const weeklyDataArray = await orderModel.aggregate([
    { $match: { 'orderItems.status': "Delivered" } },
    {
      $group: { _id: { $dayOfWeek: "$date" }, totalPrice: { $sum: '$totalPrice' } }
    }
  ]);

  let weeklyDataObject = {};
  weeklyDataArray.forEach(item => {
    weeklyDataObject[item._id] = item.orderItems?.price;
  });

  let weeklyData = [];
  for (let i = 1; i <= 7; i++) {
    weeklyData[i - 1] = weeklyDataObject[i] || 0;
  }
  res.render("admin/Adminhome", {
    weeklyData,
    totalRevenue,
    userCount,
    productCount,
    orderCount,
    orderData,
    monthlyData,
    onlineOrdersCount,
    codOrdersCount
  });
}



module.exports = {
  getAdminLoginPage, postAdminLogin,
  getAdminHomePage,

  //product
  getProductsPage,
  getAddProducts, postAddProducts,
  getProductEdit, postProductEdit,
  blockProduct, unblockProduct, deleteProductMainImage,

  //category
  getCategory, postAddCategory,
  blockCategory, unblockCategory,
  getCategoryEdit, postCategoryEdit, adminLogout,

  //brand
  getBrand,
  getAddBrand, postAddBrand,
  getAdminSalesReport,
  blockBrand, unblockBrand,
  getBrandEdit, postBrandEdit,

  //user
  getUsers,
  blockUser, unblockUser,

  //banner
  getBanner,
  getAddBanner, PostAddBanner,
  deleteBanner,

  //coupon
  getCoupon,
  getAddCoupon, postAddCoupon,
  getCouponEdit, postCouponEdit,
  deleteCoupon, deleteProductSubImage,


  //order
  getAllOrders, displayOrderStatusEditPage, updateOrderStatus,
  getAdminDashboard, getOrderviewPage
};
