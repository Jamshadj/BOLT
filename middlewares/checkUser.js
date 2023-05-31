const userModel = require('../models/UserModel');

async function checkUser(req, res, next) {
  try {
    const user = await userModel.findOne({ _id: req.session.user?._id });
    if (user && !user.block) {
      req.user = user;
      next();
    } else {
      req.session.user = null;
      res.redirect('/login');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
}

module.exports = checkUser;
