import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, BackHandler } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ComponentData = {
  reg_no: string;
  component_name: string;
  is_reserved: boolean;
  request_to_reserve: boolean;
  lab_name: string;
  faculty_name?: string;
  department_name?: string;
  image?: string;
};

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  faculty: string;
  profilePicture?: string;
};

export default function ComponentDetails() {
  const router = useRouter();
  const { component } = useLocalSearchParams();

  // Parse component details received from MainPage
  const parsedComponent: ComponentData | null = component ? JSON.parse(component as string) : null;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRequested, setIsRequested] = useState(parsedComponent?.request_to_reserve ?? false);

  useEffect(() => {
    loadUser();

    // ✅ Override hardware back button to refresh MainPage
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBackPress();
      return true; // Prevents default back action
    });

    return () => backHandler.remove(); // Cleanup event listener
  }, []);

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const updateMainPage = (updatedStatus: boolean) => {
    router.setParams({
      component: JSON.stringify({ ...parsedComponent, request_to_reserve: updatedStatus }),
    });
  };

  const handleReserve = async () => {
    if (!user || !parsedComponent) {
      Alert.alert('Error', 'User or Component information is missing.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://beige-leese-44.tiiny.io/request_reserve.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reg_no: parsedComponent.reg_no,
          user_id: user.id,
          user_name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          phone_number: user.phone,
        }),
      });

      const result = await response.json();
      if (result.success) {
        Alert.alert('Success', 'Request to reserve submitted.');
        setIsRequested(true);
        updateMainPage(true);
      } else {
        Alert.alert('Error', 'Failed to submit request.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReserve = async () => {
    if (!user || !parsedComponent) {
      Alert.alert('Error', 'User or Component information is missing.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://beige-leese-44.tiiny.io/cancel_reserve.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reg_no: parsedComponent.reg_no,
          user_id: user.id,
        }),
      });

      const result = await response.json();
      if (result.success) {
        Alert.alert('Success', 'Reservation request canceled.');
        setIsRequested(false);
        updateMainPage(false);
      } else {
        Alert.alert('Error', result.message || 'Failed to cancel request.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel request.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle Back Press (Hardware & Custom Button)
  const handleBackPress = () => {
    router.replace({
      pathname: '/MainPage', // ✅ Ensure MainPage refreshes
      params: { refresh: 'true' }, // Send a signal to refresh
    });
  };

  if (loading || !parsedComponent) {
    return <ActivityIndicator size="large" color="#00695C" />;
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: parsedComponent.image || 'https://via.placeholder.com/300' }} style={styles.componentImage} />
      <Text style={styles.componentTitle}>{parsedComponent.component_name}</Text>
      <Text style={styles.componentInfo}>Lab: {parsedComponent.lab_name}</Text>
      {parsedComponent.faculty_name && <Text style={styles.componentInfo}>Faculty: {parsedComponent.faculty_name}</Text>}
      {parsedComponent.department_name && <Text style={styles.componentInfo}>Department: {parsedComponent.department_name}</Text>}
      
      {parsedComponent.is_reserved ? (
        <Text style={styles.borrowedLabel}>Already Borrowed</Text>
      ) : isRequested ? (
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancelReserve}>
          <Text style={styles.cancelButtonText}>Cancel Request</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.reserveButton} onPress={handleReserve}>
          <Text style={styles.reserveButtonText}>Request to Reserve</Text>
        </TouchableOpacity>
      )}

      {/* ✅ Custom Back Button with Refresh */}
      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        <Text style={styles.backButtonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5FF',
    padding: 20,
    alignItems: 'center',
  },
  componentImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  componentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#004D40',
    textAlign: 'center',
  },
  componentInfo: {
    fontSize: 16,
    marginTop: 5,
    color: '#555',
    textAlign: 'center',
  },
  borrowedLabel: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
  reserveButton: {
    backgroundColor: '#28A745',
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
    width: '80%',
    alignItems: 'center',
  },
  reserveButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#FFA500',
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
    width: '80%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#D32F2F',
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
    width: '80%',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
});
