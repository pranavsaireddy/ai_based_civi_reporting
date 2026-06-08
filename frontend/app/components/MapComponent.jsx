import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";

const getMarkerIcon = (category) => {
  switch (category) {
    case "Road": return "construct-outline";
    case "Water": return "water-outline";
    case "Electricity": return "flash-outline";
    case "Waste": return "trash-outline";
    case "Parks": return "leaf-outline";
    case "Traffic": return "car-outline";
    case "Health": return "medkit-outline";
    case "Construction": return "hammer-outline";
    case "Safety": return "shield-outline";
    default: return "alert-circle-outline";
  }
};

const getMarkerColor = (category) => {
  switch (category) {
    case "Road": return "#E74C3C";
    case "Water": return "#3498DB";
    case "Electricity": return "#F1C40F";
    case "Waste": return "#27AE60";
    case "Parks": return "#2ECC71";
    case "Traffic": return "#E67E22";
    case "Health": return "#9B59B6";
    case "Construction": return "#BDC3C7";
    case "Safety": return "#34495E";
    default: return "#FF0000";
  }
};

export default function MapComponent({ coords, isFullScreen, setIsFullScreen, markers }) {
  const [selectedReport, setSelectedReport] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapRef.current && coords) {
      mapRef.current.animateToRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: isFullScreen ? 0.08 : 0.01,
        longitudeDelta: isFullScreen ? 0.08 : 0.01,
      }, 500);
    }
  }, [coords, isFullScreen]);

  const renderReportMarker = (report) => (
    <View style={[styles.customMarker, { backgroundColor: getMarkerColor(report.category) }]}>
      <Ionicons name={getMarkerIcon(report.category)} size={20} color="white" />
    </View>
  );

  return (
    <View style={isFullScreen ? StyleSheet.absoluteFill : styles.floatingMapContainer}>
      <MapView
        ref={mapRef}
        style={isFullScreen ? StyleSheet.absoluteFill : styles.floatingMap}
        initialRegion={{
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: isFullScreen ? 0.08 : 0.01,
          longitudeDelta: isFullScreen ? 0.08 : 0.01,
        }}
        showsUserLocation
      >
        {markers.map((report) => (
          <Marker
            key={report._id}
            coordinate={{ latitude: report.location.coordinates[1], longitude: report.location.coordinates[0] }}
            title={report.title}
            description={report.description}
            onPress={() => setSelectedReport(report)}
          >
            {renderReportMarker(report)}
          </Marker>
        ))}
      </MapView>

      {/* Expand Button (when minimized) */}
      {!isFullScreen && (
        <TouchableOpacity style={styles.expandButton} onPress={() => { setIsFullScreen(true);}}>
          <Text style={styles.expandText}>Expand Map</Text>
        </TouchableOpacity>
      )}

      {/* Back Button (when fullscreen) */}
      {isFullScreen && (
        <TouchableOpacity style={styles.backButton} onPress={() => { setIsFullScreen(false);}}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Info Panel */}
      {selectedReport && (
        <View style={styles.infoPanel}>
          <View style={styles.infoPanelHeader}>
            <Ionicons
              name={getMarkerIcon(selectedReport.type)}
              size={24}
              color={getMarkerColor(selectedReport.type)}
            />
            <Text style={styles.infoPanelTitle}>{selectedReport.title}</Text>
            <TouchableOpacity onPress={() => setSelectedReport(null)}>
              <Ionicons name="close" size={24} color="#95A5A6" />
            </TouchableOpacity>
          </View>
          <Text style={styles.infoPanelDescription}>{selectedReport.description}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  floatingMapContainer: {
    position: "absolute",
    bottom: 80,
    left: 20,
    right: 20,
    height: 150,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  floatingMap: {
    width: "100%",
    height: "100%",
  },
  expandButton: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "#6C63FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  expandText: { color: "#fff", fontWeight: "bold" },
backButton: {
  position: "absolute",
  top: "5%",         // middle of the screen
  left: "3%",        // middle-ish horizontally
  backgroundColor: "red",  // bright color for testing
  padding: 12,
  borderRadius: 8,
  zIndex: 999,
  elevation: 5,
},
  customMarker: { padding: 6, borderRadius: 6 },
  infoPanel: {
    position: "absolute",
    bottom: 240,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  infoPanelHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  infoPanelTitle: { flex: 1, marginLeft: 8, fontWeight: "bold", fontSize: 16 },
  infoPanelDescription: { fontSize: 14, color: "#555" },
});
