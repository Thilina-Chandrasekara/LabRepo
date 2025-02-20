import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<{ 
    id: string; 
    firstName: string; 
    lastName: string; 
    email: string; 
    phone: string; 
    faculty: string; 
    profilePicture?: string 
  } | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    };
    loadUser();
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      {user && (
        <>
          <Image 
            source={user.profilePicture ? { uri: user.profilePicture } : require('@/assets/default-avatar.png')}
            style={styles.profileImage}
          />
          <Text style={styles.profileName}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={styles.profileDetails}>Email: {user.email}</Text>
          <Text style={styles.profileDetails}>Phone: {user.phone}</Text>
          <Text style={styles.profileDetails}>Faculty: {user.faculty}</Text>

          <TouchableOpacity 
            style={styles.editButton} 
            onPress={() => router.push({
              pathname: "/edit-profile/[id]",
              params: { id: user.id }
            })}
          >
            <Text style={styles.editText}>Edit Profile</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#00ACC1',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  backText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#00ACC1',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0277BD',
    marginBottom: 10,
  },
  profileDetails: {
    fontSize: 16,
    color: '#424242',
    marginBottom: 5,
  },
  editButton: { 
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#7E57C2',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  editText: { 
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
