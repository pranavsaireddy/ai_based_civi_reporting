const User = require("../models/User");
const Badge = require("../models/Badge");

const getUserBadges = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("badges"); // populate badge info
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      badges: user.badges.map((b) => ({
        id: b._id,
        name: b.name,
        description: b.description,
        icon: b.icon,
        color: b.color,
      })),
    });
  } catch (error) {
    console.error("Error fetching user badges:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Seed fixed badges
// Seed badge from request body
const seedBadges = async (req, res) => {
  try {
    const badge = req.body; // get badge data from POST request

    // Validate required fields
    if (!badge.name || !badge.icon) {
      return res.status(400).json({ message: "Badge must have a name and icon" });
    }

    // Insert the badge
    const createdBadge = await Badge.create(badge);

    res.status(201).json({
      success: true,
      message: "Badge added successfully",
      badge: createdBadge
    });
  } catch (error) {
    console.error("Error seeding badge:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getUserBadges, seedBadges };

