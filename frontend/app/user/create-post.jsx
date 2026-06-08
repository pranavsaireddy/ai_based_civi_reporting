import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
  Image
} from "react-native";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "@/config.js";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get('window');

export default function CreatePost() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const [selectedImages, setSelectedImages] = useState([]);

  // Get user location automatically
  useEffect(() => {
    (async () => {
      try {
        setLocationLoading(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Required", "Location permission is required to submit a report.");
          setLocationLoading(false);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        setCoords({ 
          longitude: loc.coords.longitude, 
          latitude: loc.coords.latitude 
        });
      } catch (err) {
        console.error("Location error:", err);
        Alert.alert("Location Error", "Unable to get your current location.");
      } finally {
        setLocationLoading(false);
      }
    })();
  }, []);

  // Pick an image from gallery
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Permission to access gallery is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setSelectedImages([...selectedImages, result.assets[0].uri]);
    }
  };

  // Remove image
  const removeImage = (index) => {
    const updated = [...selectedImages];
    updated.splice(index, 1);
    setSelectedImages(updated);
  };

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert("Missing Information", "Please enter a title for your report.");
      return false;
    }
    if (!description.trim()) {
      Alert.alert("Missing Information", "Please provide a description of the issue.");
      return false;
    }
    if (!coords) {
      Alert.alert("Location Required", "Location information is required to submit the report.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");

      const postData = {
        title: title.trim(),
        description: description.trim(),
        location: {
          type: "Point",
          coordinates: [coords.longitude, coords.latitude],
        },
        // Category, priority, and image are handled by backend AI
      };

      const res = await fetch(`${API_URL}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(postData),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert(
          "Success",
          "Your report has been submitted successfully!",
          [
            {
              text: "OK",
              onPress: () => {
                setTitle("");
                setDescription("");
                setSelectedImages([]);
              }
            }
          ]
        );
      } else {
        Alert.alert("Submission Failed", data.message || "Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error("Submit error:", err);
      Alert.alert("Network Error", "Unable to submit report. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (locationLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Post</Text>
        <TouchableOpacity 
          style={styles.postButton} 
          onPress={handleSubmit}
          disabled={loading || !title.trim() || !description.trim()}
        >
          <Text style={[
            styles.postButtonText, 
            (!title.trim() || !description.trim()) && styles.disabledText
          ]}>
            {loading ? "Posting..." : "Post"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title Input */}
        <View style={styles.inputCard}>
          <TextInput
            style={styles.titleInput}
            placeholder="What's the issue?"
            value={title}
            onChangeText={setTitle}
            maxLength={200}
            multiline
          />
          <Text style={styles.charCount}>{title.length}/200</Text>
        </View>

        {/* Description Input */}
        <View style={styles.inputCard}>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Provide more details about the issue..."
            value={description}
            onChangeText={setDescription}
            maxLength={1000}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{description.length}/1000</Text>
        </View>

        {/* Photo Upload */}
        <View style={styles.imageContainer}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
            Upload Photos
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedImages.map((uri, index) => (
              <View key={index} style={{ marginRight: 12, position: 'relative' }}>
                <Image
                  source={{ uri }}
                  style={styles.selectedImagePreview}
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Text style={{ padding: 4, fontWeight: '600', color: '#FF3B30' }}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
              <Ionicons name="camera-outline" size={24} color="#8E8E93" />
              <Text style={styles.addImageText}>Add Photo</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Location Info */}
        <View style={styles.locationCard}>
          <Text style={styles.locationText}>
            📍 Current location will be used
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F7" },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: "#F2F2F7" },
  loadingText: { marginTop: 16, fontSize: 16, color: "#8E8E93" },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, backgroundColor: "white", borderBottomWidth: 0.5, borderBottomColor: "#C7C7CC" },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#1C1C1E" },
  postButton: { alignItems: 'flex-end' },
  postButtonText: { fontSize: 16, fontWeight: "600", color: "#007AFF" },
  disabledText: { color: "#C7C7CC" },
  content: { flex: 1, padding: 16 },
  inputCard: { backgroundColor: "white", borderRadius: 12, padding: 16, marginBottom: 16 },
  titleInput: { fontSize: 16, color: "#1C1C1E", minHeight: 50, maxHeight: 100, textAlignVertical: 'top' },
  descriptionInput: { fontSize: 15, color: "#1C1C1E", height: 120, textAlignVertical: 'top' },
  charCount: { fontSize: 12, color: "#8E8E93", textAlign: 'right', marginTop: 8 },
  locationCard: { backgroundColor: "white", borderRadius: 12, padding: 16, marginBottom: 32 },
  locationText: { fontSize: 14, color: "#34C759" },

  /* Image Upload Styles */
  imageContainer: { marginBottom: 16 },
  selectedImagePreview: { width: 120, height: 120, borderRadius: 12, backgroundColor: "#F2F2F7" },
  removeImageButton: { position: 'absolute', top: 6, right: 6, backgroundColor: "white", borderRadius: 12, padding: 2, zIndex: 1 },
  addImageButton: { width: 120, height: 120, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: "#E5E5EA", justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  addImageText: { fontSize: 12, color: "#8E8E93", marginTop: 4, textAlign: 'center' },
});
