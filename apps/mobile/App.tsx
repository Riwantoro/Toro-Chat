import React from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Toro Chat Mobile</Text>
        <Text style={styles.subtitle}>UI mobile akan diimplementasikan setelah backend stabil.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center"
  },
  card: {
    backgroundColor: "#111827",
    padding: 24,
    borderRadius: 16,
    width: "80%"
  },
  title: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 12
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 14
  }
});
