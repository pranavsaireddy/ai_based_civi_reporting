const User = require('../models/User');
const Badge = require('../models/Badge');
const Report = require('../models/Report');

/**
 * Add points to a user and assign all relevant badges
 */
async function addPoints(userId, points = 0) {
  const user = await User.findById(userId);
  if (!user) return;

  // Add points
  user.points += points;

  // Assign all badges
  await checkAndAssignBadges(user);

  // Save once
  await user.save();
}

/**
 * Dynamically check and assign badges based on user activity
 * - Points
 * - Number of reports
 * - Number of comments (notes)
 */
async function checkAndAssignBadges(user) {
  const badges = await Badge.find({});

  // Get number of reports
  const reportCount = await Report.countDocuments({ user: user._id });

  // Get total number of comments (notes) across all user's reports
  const reports = await Report.find({ user: user._id }, 'notes');
  const commentCount = reports.reduce((sum, r) => sum + (r.notes?.length || 0), 0);

  for (const badge of badges) {
    let earned = false;

    // Badge by points
    if (badge.pointsRequired && user.points >= badge.pointsRequired) earned = true;

    // Badge by number of reports
    if (badge.reportCountRequired && reportCount >= badge.reportCountRequired) earned = true;

    // Badge by number of comments/notes
    if (badge.commentCountRequired && commentCount >= badge.commentCountRequired) earned = true;

    // Assign badge if not already assigned
    if (earned && !user.badges.includes(badge._id)) {
      user.badges.push(badge._id);
    }
  }
}

/**
 * Only update badges without changing points
 */
async function updateUserBadges(userId) {
  const user = await User.findById(userId);
  if (!user) return;

  // Fetch all badges once
  const badges = await Badge.find({});

  // Reset badges array (optional: or keep old badges)
  // user.badges = [];

  // Count reports
  const totalReports = await Report.countDocuments({ user: user._id });
  const resolvedReports = await Report.countDocuments({ user: user._id, status: 'Resolved' });

  // Count comments (notes)
  const reportsWithNotes = await Report.find({ 'notes.addedBy': user._id });
  let totalComments = 0;
  reportsWithNotes.forEach(report => {
    totalComments += report.notes.filter(n => n.addedBy.toString() === user._id.toString()).length;
  });

  // Loop through badges and assign
  for (const badge of badges) {
    switch (badge.name) {
      case 'New Beginner':
        if (totalReports >= 1 && !user.badges.includes(badge._id)) {
          user.badges.push(badge._id);
        }
        break;

      case 'Civic Hero':
        if (resolvedReports >= 5 && !user.badges.includes(badge._id)) {
          user.badges.push(badge._id);
        }
        break;

      case 'Community Commenter':
        if (totalComments >= 10 && !user.badges.includes(badge._id)) {
          user.badges.push(badge._id);
        }
        break;

      default:
        // handle point-based badges if needed
        if (badge.pointsRequired && user.points >= badge.pointsRequired && !user.badges.includes(badge._id)) {
          user.badges.push(badge._id);
        }
    }
  }

  await user.save();
}
module.exports = { addPoints, checkAndAssignBadges, updateUserBadges };
