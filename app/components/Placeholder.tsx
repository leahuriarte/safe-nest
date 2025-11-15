// app/components/Placeholder.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function Placeholder({ title }: { title: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>UI coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  subtitle: {
    marginTop: 10,
    fontSize: 16,
    color: "gray",
  },
});