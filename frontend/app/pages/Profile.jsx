import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../config";

export default function Profile() {
  const { user, logout } = useAuth();
  const [userData, setUserData] = useState(null);
  const [reports, setReports] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("reports"); // 'reports' or 'badges'

  useEffect(() => {
    const fetchProfileAndBadges = async () => {
      try {
        // Fetch profile & reports
        const profileRes = await fetch(`${API_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const profileData = await profileRes.json();
        setUserData(profileData.user);
        setReports(profileData.reports || []);

        // Fetch badges
        const badgeRes = await fetch(`${API_URL}/api/badges`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const badgeData = await badgeRes.json();
        if (badgeData.success) {
          setBadges(badgeData.badges);
        }
      } catch (err) {
        console.error("Error fetching profile or badges:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) fetchProfileAndBadges();
  }, [user?.token]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF4500" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.center}>
        <Text style={styles.noDataText}>No profile data found</Text>
      </View>
    );
  }

  const renderBadgeCard = ({ item }) => (
    <View style={styles.badgeCardFull}>
      <View style={[styles.badgeIconContainer, { backgroundColor: item.color || '#FFD700' }]}>
        {item.icon ? (
          <Image source={{ uri: item.icon }} style={styles.badgeIcon} />
        ) : (
          <Text style={styles.badgeIconText}>🏆</Text>
        )}
      </View>
      <View style={styles.badgeInfoFull}>
        <Text style={styles.badgeNameFull}>{item.name}</Text>
        <Text style={styles.badgeDescriptionFull}>{item.description}</Text>
      </View>
    </View>
  );

  const renderReportCard = ({ item }) => (
    <View style={styles.postCard}>
      <View style={styles.postContainer}>
        {/* Left voting section */}
        <View style={styles.leftSection}>
          <View style={styles.votePlaceholder}>
            <Text style={styles.voteIcon}>⬆</Text>
            <Text style={styles.voteCount}>-</Text>
            <Text style={styles.voteIcon}>⬇</Text>
          </View>
        </View>

        {/* Content section */}
        <View style={styles.contentSection}>
          <View style={styles.postHeader}>
            <Text style={styles.subredditText}>r/UrbanIssues</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.timeText}>
              {item.createdAt
                ? new Date(item.createdAt).toLocaleDateString()
                : "Recently"}
            </Text>
          </View>

          <Text style={styles.postTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.postText} numberOfLines={3}>
            {item.description}
          </Text>

          <View style={styles.tagsRow}>
            <View
              style={[
                styles.statusTag,
                {
                  backgroundColor:
                    item.status === "Open"
                      ? "#FFE5E5"
                      : item.status === "In Progress"
                      ? "#FFF4E5"
                      : "#E5F8E5",
                },
              ]}
            >
              <Text
                style={[
                  styles.tagText,
                  {
                    color:
                      item.status === "Open"
                        ? "#FF4500"
                        : item.status === "In Progress"
                        ? "#FFA500"
                        : "#00C851",
                  },
                ]}
              >
                {item.status}
              </Text>
            </View>
            <View
              style={[
                styles.priorityTag,
                {
                  backgroundColor:
                    item.priority === "High"
                      ? "#FFE5E5"
                      : item.priority === "Medium"
                      ? "#FFF9E5"
                      : "#E5F3FF",
                },
              ]}
            >
              <Text
                style={[
                  styles.tagText,
                  {
                    color:
                      item.priority === "High"
                        ? "#FF4444"
                        : item.priority === "Medium"
                        ? "#FFBB33"
                        : "#0079D3",
                  },
                ]}
              >
                {item.priority} Priority
              </Text>
            </View>
          </View>

          {/* Action bar */}
          <View style={styles.actionBar}>
            <View style={styles.actionItem}>
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionText}>
                {item.comments || 0} Comments
              </Text>
            </View>
            <View style={styles.actionItem}>
              <Text style={styles.actionIcon}>🔗</Text>
              <Text style={styles.actionText}>Share</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Text style={styles.header}>Profile</Text>

          {/* User Avatar & Name */}
          <View style={styles.userCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {userData.username ? userData.username[0].toUpperCase() : "U"}
                </Text>
              </View>
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.username}>u/{userData.username}</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{reports.length}</Text>
                  <Text style={styles.statLabel}>Reports</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{badges.length}</Text>
                  <Text style={styles.statLabel}>Badges</Text>
                </View>
              </View>
            </View>
          </View>

          {/* User Details Card */}
          <View style={styles.userInfoCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{userData.email}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Role</Text>
              <View
                style={[
                  styles.roleBadge,
                  {
                    backgroundColor:
                      userData.role === "admin" ? "#FF4500" : "#0079D3",
                  },
                ]}
              >
                <Text style={styles.roleText}>
                  {userData.role?.toUpperCase() || "USER"}
                </Text>
              </View>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutButtonText}>🚪 Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "reports" && styles.activeTab]}
            onPress={() => setActiveTab("reports")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "reports" && styles.activeTabText,
              ]}
            >
              📋 My Reports
            </Text>
            {activeTab === "reports" && <View style={styles.tabIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "badges" && styles.activeTab]}
            onPress={() => setActiveTab("badges")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "badges" && styles.activeTabText,
              ]}
            >
              🏆 My Badges
            </Text>
            {activeTab === "badges" && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === "reports" ? (
            reports.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📝</Text>
                <Text style={styles.emptyText}>No reports yet</Text>
                <Text style={styles.emptySubtext}>
                  Start reporting urban issues to help your community!
                </Text>
              </View>
            ) : (
              reports.map((item, index) => (
                <View key={item._id}>
                  {renderReportCard({ item })}
                  {index < reports.length - 1 && <View style={styles.separator} />}
                </View>
              ))
            )
          ) : (
            badges.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🏆</Text>
                <Text style={styles.emptyText}>No badges yet</Text>
                <Text style={styles.emptySubtext}>
                  Earn badges by being active in the community!
                </Text>
              </View>
            ) : (
              <View style={styles.badgesGrid}>
                {badges.map((item) => (
                  <View key={item._id}>
                    {renderBadgeCard({ item })}
                  </View>
                ))}
              </View>
            )
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#DAE0E6",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#DAE0E6",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#1A1A1B",
  },
  noDataText: {
    fontSize: 16,
    color: "#7C7C7C",
  },

  // Profile Header Section
  profileHeader: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
    marginBottom: 8,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#1A1A1B",
  },

  // User Card with Avatar
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FF4500",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A1B",
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF4500",
  },
  statLabel: {
    fontSize: 12,
    color: "#7C7C7C",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#EDEFF1",
    marginHorizontal: 16,
  },

  // User Info Card
  userInfoCard: {
    backgroundColor: "#F6F7F8",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: "#7C7C7C",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    color: "#1A1A1B",
    fontWeight: "600",
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  // Logout Button
  logoutButton: {
    backgroundColor: "#FF4500",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  // Tabs
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EDEFF1",
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    position: "relative",
  },
  activeTab: {
    // Active tab styling
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#7C7C7C",
  },
  activeTabText: {
    color: "#FF4500",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "#FF4500",
  },

  // Tab Content
  tabContent: {
    backgroundColor: "#FFFFFF",
    minHeight: 400,
  },

  // Empty State
  emptyState: {
    paddingVertical: 80,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1B",
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#7C7C7C",
    textAlign: "center",
    paddingHorizontal: 40,
  },

  // Badges Grid (Full Width Cards)
  badgesGrid: {
    padding: 16,
  },
  badgeCardFull: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EDEFF1",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  badgeIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    resizeMode: 'cover',
  },
  badgeIconText: {
    fontSize: 48,
  },
  badgeInfoFull: {
    flex: 1,
  },
  badgeNameFull: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1B",
    marginBottom: 4,
  },
  badgeDescriptionFull: {
    fontSize: 14,
    color: "#7C7C7C",
    lineHeight: 20,
  },

  // Post Cards
  postCard: {
    backgroundColor: "#FFFFFF",
  },
  postContainer: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  // Left voting section
  leftSection: {
    width: 32,
    alignItems: "center",
    marginRight: 12,
  },
  votePlaceholder: {
    alignItems: "center",
  },
  voteIcon: {
    fontSize: 16,
    color: "#C8CBCD",
    fontWeight: "bold",
  },
  voteCount: {
    fontSize: 12,
    color: "#C8CBCD",
    marginVertical: 2,
  },

  // Content section
  contentSection: {
    flex: 1,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  subredditText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1A1A1B",
  },
  dot: {
    fontSize: 12,
    color: "#7C7C7C",
    marginHorizontal: 4,
  },
  timeText: {
    fontSize: 12,
    color: "#7C7C7C",
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1B",
    marginBottom: 6,
    lineHeight: 22,
  },
  postText: {
    fontSize: 14,
    color: "#1A1A1B",
    lineHeight: 20,
    marginBottom: 8,
     
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  priorityTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
  },
  actionBar: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionIcon: {
    fontSize: 14,
  },
  actionText: {
    fontSize: 13,
    color: "#7C7C7C",
    fontWeight: "600",
  },
  separator: {
    height: 1,
    backgroundColor: "#EDEFF1",
    marginLeft: 60,
  },
});