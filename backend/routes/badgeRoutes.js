const express = require("express");
const router = express.Router();

const User = require('../models/User');
const { getUserBadges ,seedBadges} = require("../controllers/badgeController");
const {protect} = require("../middlewares/authMiddleware");

const { updateUserBadges } = require('../utility/gamification');
router.route('/badges').get(protect,getUserBadges);
router.post("/seed", seedBadges);

// 🔹 Endpoint to assign badges to all existing users
router.post('/sync-badges', async (req, res) => {
  try {
    const users = await User.find({});
    let updatedCount = 0;

    for (const user of users) {
      await updateUserBadges(user._id);
      updatedCount++;
    }

    res.json({
      success: true,
      message: `Badges updated for ${updatedCount} users`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

