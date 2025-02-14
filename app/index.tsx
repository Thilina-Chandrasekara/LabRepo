import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import DropDownPicker from 'react-native-dropdown-picker'; // Dropdown component
import AsyncStorage from '@react-native-async-storage/async-storage';

type Faculty = {
  id: string;
  name: string;
};

export default function Index() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [faculty, setFaculty] = useState(null);
  const [faculties, setFaculties] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [open, setOpen] = useState(false); // Dropdown visibility
  const router = useRouter();

  // Fetch faculties from the database
  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const response = await fetch('https://beige-leese-44.tiiny.io/get_faculties.php');
        const data = await response.json();
        if (data.success) {
          setFaculties(data.faculties.map((fac: Faculty) => ({ label: fac.name, value: fac.name })));
        } else {
          Alert.alert('Error', 'Failed to load faculties.');
        }
      } catch (error) {
        Alert.alert('Error', 'Network error.');
      } finally {
        setLoading(false);
      }
    };
    fetchFaculties();
  }, []);

  const handlePress = async () => {
    const url = isLogin
      ? 'https://beige-leese-44.tiiny.io/login.php'
      : 'https://beige-leese-44.tiiny.io/signup.php';
  
    const payload = isLogin
      ? { email, password }
      : { email, password, first_name: firstName, last_name: lastName, phone, faculty };
  
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
  
      if (result.success) {
        await AsyncStorage.setItem('user', JSON.stringify(result.user)); // Store user details
        router.replace('/MainPage');
      } else {
        Alert.alert('Error', result.message || 'An error occurred.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.mainTitle}>Lab Inventory System</Text>

      <Image source={require('../assets/logo.png')} style={styles.logo} />

      <Text style={styles.title}>{isLogin ? 'Login' : 'Signup'}</Text>

      {!isLogin && (
        <>
          {/* Faculty Dropdown */}
          {loading ? (
            <ActivityIndicator size="large" color="#007BFF" />
          ) : (
            <View style={styles.dropdownWrapper}>
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
            </View>
          )}

          {/* First Name Input */}
          <TextInput
            placeholder="First Name"
            placeholderTextColor="#666"
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
          />

          {/* Last Name Input */}
          <TextInput
            placeholder="Last Name"
            placeholderTextColor="#666"
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
          />

          {/* Phone Number Input */}
          <TextInput
            placeholder="Phone Number"
            placeholderTextColor="#666"
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </>
      )}

      <TextInput
        placeholder="Email"
        placeholderTextColor="#666"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#666"
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.actionButton} onPress={handlePress}>
        <Text style={styles.actionButtonText}>{isLogin ? 'Login' : 'Signup'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.switchButton} onPress={() => setIsLogin(!isLogin)}>
        <Text style={styles.switchButtonText}>
          {isLogin ? 'Switch to Signup' : 'Switch to Login'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5FF', // Light blue theme
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007BFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 250,
    height: 140,
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF4D92',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#007BFF',
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    width: '90%',
    backgroundColor: '#FFF',
    fontSize: 16,
  },
  dropdownWrapper: {
    width: '90%', // Match input width
    marginBottom: 10,
  },
  dropdown: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#007BFF',
    borderRadius: 8,
  },
  dropdownContainer: {
    backgroundColor: '#FFF',
    borderColor: '#007BFF',
    width: '90%', // Ensure full width
    alignSelf: 'center',
  },
  actionButton: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 8,
    width: '90%',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 20,
    padding: 10,
  },
  switchButtonText: {
    color: '#FF4D92',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
