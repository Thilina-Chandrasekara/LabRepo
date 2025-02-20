import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
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

  // Parse component details passed via router params.
  const parsedComponent: ComponentData | null = component
    ? JSON.parse(component as string)
    : null;
  // Explicitly map state fields to booleans.
  const componentData: ComponentData | null = parsedComponent
    ? {
        ...parsedComponent,
        is_reserved: parsedComponent.is_reserved === true,
        request_to_reserve: parsedComponent.request_to_reserve === true,
      }
    : null;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRequested, setIsRequested] = useState(componentData?.request_to_reserve ?? false);

  useEffect(() => {
    loadUser();

    // Override hardware back button.
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBackPress();
      return true;
    });
    return () => backHandler.remove();
  }, []);

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        // Map keys from stored user.
        setUser({
          id: parsedUser.id,
          firstName: parsedUser.first_name,
          lastName: parsedUser.last_name,
          email: parsedUser.email,
          phone: parsedUser.phone,
          faculty: parsedUser.faculty,
          profilePicture: parsedUser.profilePicture,
        });
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  // Update router params (if main page needs to update state).
  const updateMainPage = (updatedStatus: boolean) => {
    router.setParams({
      component: JSON.stringify({ ...componentData, request_to_reserve: updatedStatus }),
    });
  };

  const handleReserve = async () => {
    if (!user || !componentData) {
      Alert.alert('Error', 'User or Component information is missing.');
      return;
    }
    setLoading(true);
    try {
      const userName = `${user.firstName} ${user.lastName}`;
      const response = await fetch('https://beige-leese-44.tiiny.io/request_reserve.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reg_no: componentData.reg_no,
          user_id: user.id,
          user_name: userName,
          email: user.email,
          phone_number: user.phone,
          faculty: user.faculty,
          profile_picture: user.profilePicture || '',
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
    if (!user || !componentData) {
      Alert.alert('Error', 'User or Component information is missing.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('https://beige-leese-44.tiiny.io/cancel_reserve.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reg_no: componentData.reg_no,
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

  // Handle Back Press (hardware and custom)
  const handleBackPress = () => {
    router.replace({
      pathname: '/MainPage',
      params: { refresh: 'true' },
    });
  };

  if (loading || !componentData) {
    return <ActivityIndicator size="large" color="#00ACC1" />;
  }

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: componentData.image || 'https://via.placeholder.com/300' }}
        style={styles.componentImage}
      />
      <Text style={styles.componentTitle}>{componentData.component_name}</Text>
      <Text style={styles.componentInfo}>Lab: {componentData.lab_name}</Text>
      {componentData.faculty_name && (
        <Text style={styles.componentInfo}>Faculty: {componentData.faculty_name}</Text>
      )}
      {componentData.department_name && (
        <Text style={styles.componentInfo}>Department: {componentData.department_name}</Text>
      )}

      {componentData.is_reserved ? (
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

      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        <Text style={styles.backButtonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F4FF',
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
    color: '#0277BD',
    textAlign: 'center',
  },
  componentInfo: {
    fontSize: 16,
    marginTop: 5,
    color: '#424242',
    textAlign: 'center',
  },
  borrowedLabel: {
    color: '#D32F2F',
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
  reserveButton: {
    backgroundColor: '#66BB6A', // Green for reserve
    padding: 15,
    borderRadius: 8,
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
    backgroundColor: '#FFA500', // Orange for cancel
    padding: 15,
    borderRadius: 8,
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
    backgroundColor: '#00ACC1', // Accent blue for navigation
    padding: 15,
    borderRadius: 8,
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
