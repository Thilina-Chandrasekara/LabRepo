import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import DropDownPicker from 'react-native-dropdown-picker';
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
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Fetch faculties from the database
  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const response = await fetch('https://beige-leese-44.tiiny.io/get_faculties.php');
        const data = await response.json();
        if (data.success) {
          setFaculties(
            data.faculties.map((fac: Faculty) => ({ label: fac.name, value: fac.name }))
          );
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
        await AsyncStorage.setItem('user', JSON.stringify(result.user));
        router.replace('/MainPage');
      } else {
        Alert.alert('Error', result.message || 'An error occurred.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.container}
          nestedScrollEnabled={true}
        >
          <Text style={styles.mainTitle}>Lab Inventory System</Text>

          {/* Logo image with curved edges */}
          <Image source={require('../assets/logo.png')} style={styles.logo} />

          <Text style={styles.title}>{isLogin ? 'Login' : 'Signup'}</Text>

          {!isLogin && (
            <>
              {loading ? (
                <ActivityIndicator size="large" color="#00ACC1" />
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
                    listMode="SCROLLVIEW" // Resolves nested VirtualizedLists error
                  />
                </View>
              )}

              <TextInput
                placeholder="First Name"
                placeholderTextColor="#666"
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
              />

              <TextInput
                placeholder="Last Name"
                placeholderTextColor="#666"
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
              />

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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E8F4FF',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#E8F4FF',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0277BD',
    textAlign: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 250,
    height: 140,
    marginBottom: 15,
    resizeMode: 'contain',
    borderRadius: 20, // Curved edges for logo
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00ACC1',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#00ACC1',
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    width: '90%',
    backgroundColor: '#FFFFFF',
    fontSize: 16,
  },
  dropdownWrapper: {
    width: '90%',
    marginBottom: 10,
    zIndex: 10,
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#00ACC1',
    borderRadius: 8,
  },
  dropdownContainer: {
    backgroundColor: '#FFFFFF',
    borderColor: '#00ACC1',
    width: '90%',
    alignSelf: 'center',
  },
  actionButton: {
    backgroundColor: '#00ACC1',
    padding: 15,
    borderRadius: 8,
    width: '90%',
    alignItems: 'center',
    marginVertical: 10,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 20,
    padding: 10,
  },
  switchButtonText: {
    color: '#0277BD',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
