import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Alert, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import DropDownPicker from "react-native-dropdown-picker"; // Dropdown component
import AsyncStorage from "@react-native-async-storage/async-storage";

type Faculty = {
  id: string;
  name: string;
};

export default function EditProfile() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // Get user ID from URL params

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [faculty, setFaculty] = useState<string | null>(null);
  const [faculties, setFaculties] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false); // Dropdown visibility

  // Fetch faculties from the database
  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const response = await fetch("https://beige-leese-44.tiiny.io/get_faculties.php");
        const data = await response.json();
        if (data.success) {
          setFaculties(data.faculties.map((fac: Faculty) => ({ label: fac.name, value: fac.name })));
        } else {
          Alert.alert("Error", "Failed to load faculties.");
        }
      } catch (error) {
        Alert.alert("Error", "Network error.");
      }
    };

    const loadUserData = async () => {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setFirstName(userData.firstName);
        setLastName(userData.lastName);
        setPhone(userData.phone);
        setFaculty(userData.faculty); // Set the faculty to current user's value
      }
      setLoading(false);
    };

    fetchFaculties();
    loadUserData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("https://beige-leese-44.tiiny.io/edit_user.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: id,
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          faculty: faculty,
        }),
      });

      const result = await response.json();
      if (result.success) {
        await AsyncStorage.setItem("user", JSON.stringify({ firstName, lastName, phone, faculty }));
        Alert.alert("Success", "Profile updated successfully!");
        router.back(); // Go back to profile page
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>

      {/* First Name Input */}
      <Text style={styles.label}>First Name:</Text>
      <TextInput
        style={styles.input}
        value={firstName}
        onChangeText={setFirstName}
      />

      {/* Last Name Input */}
      <Text style={styles.label}>Last Name:</Text>
      <TextInput
        style={styles.input}
        value={lastName}
        onChangeText={setLastName}
      />

      {/* Phone Number Input */}
      <Text style={styles.label}>Phone:</Text>
      <TextInput
        style={styles.input}
        value={phone}
        keyboardType="phone-pad"
        onChangeText={setPhone}
      />

      {/* Faculty Dropdown */}
      <Text style={styles.label}>Faculty:</Text>
      <DropDownPicker
        open={open}
        setOpen={setOpen}
        value={faculty}
        setValue={setFaculty}
        items={faculties}
        placeholder="Select Faculty"
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
      />

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveText}>Save Changes</Text>}
      </TouchableOpacity>

      {/* Cancel Button */}
      <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#F5F5FF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#007BFF",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  input: {
    height: 40,
    borderColor: "#CCC",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: "#FFF",
  },
  dropdown: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#007BFF",
    borderRadius: 8,
  },
  dropdownContainer: {
    backgroundColor: "#FFF",
    borderColor: "#007BFF",
  },
  saveButton: {
    backgroundColor: "#28A745",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  saveText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "#DC3545",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  cancelText: {
    color: "#FFF",
    fontWeight: "bold",
  },
});

