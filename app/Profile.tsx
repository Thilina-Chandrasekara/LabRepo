import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; firstName: string; lastName: string; email: string; phone: string; faculty: string; profilePicture?: string } | null>(null);

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
          <Image source={user.profilePicture ? { uri: user.profilePicture } : require('@/assets/default-avatar.png')} style={styles.profileImage} />
          <Text style={styles.profileName}>{user.firstName} {user.lastName}</Text>
          <Text style={styles.profileDetails}>Email: {user.email}</Text>
          <Text style={styles.profileDetails}>Phone: {user.phone}</Text>
          <Text style={styles.profileDetails}>Faculty: {user.faculty}</Text>

          {/* ✅ FIXED: Use object-based navigation */}
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5FF',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    padding: 10,
    backgroundColor: '#007BFF',
    borderRadius: 5,
  },
  backText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  profileDetails: {
    fontSize: 16,
    color: '#555',
    marginTop: 5,
  },
  editButton: { 
    marginTop: 20,
    padding: 10,
    backgroundColor: '#28A745',
    borderRadius: 5,
  },
  editText: { 
    color: '#FFF',
    fontWeight: 'bold',
  },
});
