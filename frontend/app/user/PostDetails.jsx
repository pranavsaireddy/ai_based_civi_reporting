import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "@/config.js";
import { Modal } from "react-native";

export default function PostDetails({ route }) {
  const { postId } = route.params;
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, []);

  // Fetch post details
  const fetchPost = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_URL}/reports/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPost(data);
    } catch (err) {
      console.error("Error fetching post:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch comments
const fetchComments = async () => {
  const token = await AsyncStorage.getItem("token");
  const res = await fetch(`${API_URL}/reports/${postId}/getComments`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();

  if (data.success) {
    // Set post details from reportDetails
    setPost({
      title: data.reportDetails.title,
      description: data.reportDetails.description,
      status: data.reportDetails.status,
      priority: data.reportDetails.priority,
      location: data.reportDetails.location,
      user: { username: data.reportDetails.createdBy.username },
    });

    // Set comments
    const formattedComments = data.data.map((c) => ({
      _id: c._id,
      text: c.text,
      user: c.addedBy?.username || "Anonymous",
      createdAt: c.createdAt,
    }));
    setComments(formattedComments);
  }
};



  // Add comment
  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_URL}/reports/${postId}/addComment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: commentText }),
      });

      if (res.ok) {
        const newComment = await res.json();
        setComments((prev) => [
          {
            _id: newComment._id,
            text: newComment.text,
            user: newComment.addedBy?.username || "Anonymous",
            createdAt: newComment.createdAt,
          },
          ...prev,
        ]);
        setCommentText("");
      }
    } catch (err) {
      console.error("Error adding comment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4500" />
        <Text style={styles.loadingText}>Loading post...</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Post not found</Text>
      </View>
    );
  }

return (
  <KeyboardAvoidingView
    style={styles.container}
    behavior={Platform.OS === "ios" ? "padding" : undefined}
    keyboardVerticalOffset={80}
  >
    <View style={{ flex: 1 }}>
      <FlatList
        data={comments}
        keyExtractor={(item) => item._id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 80 }}
        ListHeaderComponent={() => (
          <View>
            {/* Post Card */}
            <View style={styles.postCard}>
              <View style={styles.postHeader}>
                <Text style={styles.postMeta}>
                  Posted by u/{post.user?.username || "anonymous"}
                </Text>
              </View>

              <Text style={styles.title}>{post.title}</Text>
              <Text style={styles.description}>{post.description}</Text>

              <View style={styles.tagsContainer}>
                <View
                  style={[
                    styles.tag,
                    {
                      backgroundColor:
                        post.status === "New"
                          ? "#FF4500"
                          : post.status === "In Progress"
                          ? "#FFA500"
                          : "#00C851",
                    },
                  ]}
                >
                  <Text style={styles.tagText}>{post.status}</Text>
                </View>
                <View
                  style={[
                    styles.tag,
                    {
                      backgroundColor:
                        post.priority === "High"
                          ? "#FF4444"
                          : post.priority === "Medium"
                          ? "#FFBB33"
                          : "#00C851",
                    },
                  ]}
                >
                  <Text style={styles.tagText}>{post.priority} Priority</Text>
                </View>
              </View>

              <View style={styles.postFooter}>
                <View style={styles.statItem}>
                  <Text style={styles.statIcon}>💬</Text>
                  <Text style={styles.statText}>
                    {comments.length} {comments.length === 1 ? "comment" : "comments"}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statIcon}>📍</Text>
                  <Text style={styles.statText}>
                    {post.location?.coordinates
                      ? `Lat:${post.location.coordinates[1]}, Lng:${post.location.coordinates[0]}`
                      : "Location"}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.commentsHeader}>
  <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>
  <TouchableOpacity
    style={styles.addCommentButton}
    onPress={() => setShowCommentModal(true)}
  >
    <Text style={styles.addCommentText}>➕ Add Comment</Text>
  </TouchableOpacity>
</View>

          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.commentCard}>
            <View style={styles.commentHeader}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {item.user ? item.user[0].toUpperCase() : "U"}
                </Text>
              </View>
              <View style={styles.commentMeta}>
                <Text style={styles.commentAuthor}>u/{item.user}</Text>
                <Text style={styles.commentTime}>
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString()
                    : "Just now"}
                </Text>
              </View>
            </View>
            <Text style={styles.commentText}>{item.text}</Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>No comments yet</Text>
            <Text style={styles.emptySubtext}>
              Be the first to share your thoughts!
            </Text>
          </View>
        )}
      />

      {/* Comment Input */}
      <View style={styles.commentInputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.commentInput}
            placeholder="What are your thoughts?"
            placeholderTextColor="#8E8E93"
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
           
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!commentText.trim() || submitting) && styles.sendButtonDisabled,
            ]}
            onPress={handleAddComment}
            disabled={!commentText.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.sendButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
<Modal
  visible={showCommentModal}
  animationType="slide"
  transparent={true}
  onRequestClose={() => setShowCommentModal(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Add a Comment</Text>

      <TextInput
        style={styles.modalInput}
        placeholder="Write your comment..."
        placeholderTextColor="#8E8E93"
        value={commentText}
        onChangeText={setCommentText}
        multiline
      />

      <View style={styles.modalActions}>
        <TouchableOpacity
          style={[styles.modalButton, styles.cancelButton]}
          onPress={() => setShowCommentModal(false)}
        >
          <Text style={styles.modalButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modalButton,
            (!commentText.trim() || submitting) && styles.modalButtonDisabled,
          ]}
          onPress={async () => {
            await handleAddComment();
            setShowCommentModal(false);
          }}
          disabled={!commentText.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.modalButtonText}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>


  </KeyboardAvoidingView>
);

}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#DAE0E6",
  },
  loadingContainer: {
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
  postCard: {
    backgroundColor: "white",
    padding: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EDEFF1",
  },
  postHeader: {
    marginBottom: 8,
  },
  postMeta: {
    fontSize: 12,
    color: "#7C7C7C",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    color: "#1A1A1B",
    lineHeight: 26,
  },
  description: {
    fontSize: 15,
    color: "#1A1A1B",
    lineHeight: 21,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  postFooter: {
    flexDirection: "row",
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EDEFF1",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statIcon: {
    fontSize: 16,
  },
  statText: {
    fontSize: 13,
    color: "#7C7C7C",
    fontWeight: "500",
  },
  commentsHeader: {
    backgroundColor: "white",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1B",
  },
  sortContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F6F7F8",
    borderRadius: 16,
  },
  sortText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A1B",
  },
  commentCard: {
    backgroundColor: "white",
    padding: 16,
    marginBottom: 1,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FF4500",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  avatarText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  commentMeta: {
    flex: 1,
  },
  commentAuthor: {
    fontWeight: "600",
    fontSize: 13,
    color: "#1A1A1B",
  },
  commentTime: {
    fontSize: 12,
    color: "#7C7C7C",
    marginTop: 2,
  },
  commentText: {
    fontSize: 15,
    color: "#1A1A1B",
    lineHeight: 21,
    marginBottom: 12,
  },
  commentActions: {
    flexDirection: "row",
    gap: 16,
  },
  actionButton: {
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
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    backgroundColor: "white",
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
  },
  commentInputContainer: {
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#EDEFF1",
    padding: 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#F6F7F8",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: "#1A1A1B",
  },
  sendButton: {
    backgroundColor: "#FF4500",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 60,
  },
  sendButtonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  sendButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  modalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.6)", // dark overlay
  justifyContent: "flex-end",
},

modalContent: {
  backgroundColor: "#FFFFFF", // solid background
  padding: 20,
  paddingTop: 40, // extra space for top header
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  minHeight: 280,
  elevation: 10,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.25,
  shadowRadius: 6,
},

modalTitle: {
  fontSize: 18,
  fontWeight: "700",
  color: "#1A1A1B",
  marginBottom: 12,
  textAlign: "center",
},

modalInput: {
  backgroundColor: "#F6F7F8",
  borderRadius: 12,
  paddingHorizontal: 12,
  paddingVertical: 10,
  fontSize: 15,
  color: "#1A1A1B",
  textAlignVertical: "top",
  minHeight: 100,
  marginBottom: 16,
  borderWidth: 1,
  borderColor: "#E0E0E0",
},

modalActions: {
  flexDirection: "row",
  justifyContent: "space-between",
},

modalButton: {
  flex: 1,
  backgroundColor: "#FF4500",
  paddingVertical: 12,
  borderRadius: 10,
  alignItems: "center",
  marginHorizontal: 4,
},

cancelButton: {
  backgroundColor: "#8E8E93",
},

modalButtonText: {
  color: "white",
  fontWeight: "700",
  fontSize: 15,
},

modalButtonDisabled: {
  backgroundColor: "#CCCCCC",
},

});