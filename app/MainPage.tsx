import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'react-native';

type Faculty = {
  id: number;
  name: string;
};

type Department = {
  id: number;
  name: string;
  faculty_id: number;
};

type Lab = {
  id: number;
  name: string;
  department_id: number;
};

type ComponentData = {
  reg_no: string;
  component_name: string;
  is_reserved: boolean;
  request_to_reserve: boolean;
  lab_name: string;
  faculty_name?: string; // Optional for selection path
  department_name?: string; // Optional for selection path
};



export default function MainPage() {
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
  
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [components, setComponents] = useState<ComponentData[]>([]);
  const [filteredComponents, setFilteredComponents] = useState<ComponentData[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchHierarchy();
    loadUser();
  }, []);

  const fetchHierarchy = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://beige-leese-44.tiiny.io/fetch_hierarchy.php');
      const result = await response.json();
      setFaculties(result.faculties);
      setDepartments(result.departments);
      setLabs(result.labs);
    } catch (error) {
      Alert.alert('Error', 'Failed to load hierarchy.');
    } finally {
      setLoading(false);
    }
  };

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser({
          id: parsedUser.id,
          firstName: parsedUser.first_name, // ✅ Fix mapping
          lastName: parsedUser.last_name,   // ✅ Fix mapping
          email: parsedUser.email,
          phone: parsedUser.phone,
          faculty: parsedUser.faculty,
          profilePicture: parsedUser.profilePicture, // Optional
        });
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };
  
  
  

  const fetchComponents = async () => {
    if (!selectedLab) {
      Alert.alert('Error', 'Please select a lab to view components.');
      return;
    }
    setLoading(true);
    try {
      const labId = selectedLab.id;
      const response = await fetch(`https://beige-leese-44.tiiny.io/search_components.php?lab_id=${labId}`);
      const result = await response.json();
  
      if (result.success) {
        // Remove faculty and department info for selection path
        const updatedComponents = result.components.map((item: ComponentData) => ({
          reg_no: item.reg_no,
          component_name: item.component_name,
          is_reserved: Boolean(item.is_reserved),
          request_to_reserve: Boolean(item.request_to_reserve),
          lab_name: item.lab_name, // Keep lab name
        }));
  
        setComponents(updatedComponents);
        setFilteredComponents(updatedComponents);
      } else {
        setComponents([]);
        setFilteredComponents([]);
        Alert.alert('Info', 'No components found for the selected lab.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch components.');
    } finally {
      setLoading(false);
    }
  };
  

  const fetchSearchResults = async (query: string) => {
    if (!query.trim()) {
      setFilteredComponents(components); // Reset to full list when search is empty
      return;
    }
  
    setLoading(true);
    try {
      const response = await fetch(`https://beige-leese-44.tiiny.io/search.php?component_name=${query}`);
      const result = await response.json();
  
      if (result.success) {
        const updatedComponents = result.components.map((item: ComponentData) => {
          const existingComponent = components.find((comp) => comp.reg_no === item.reg_no);
          return {
            ...item, // Include faculty and department from API
            is_reserved: Boolean(item.is_reserved), // Ensure boolean conversion
            request_to_reserve: existingComponent ? existingComponent.request_to_reserve : Boolean(item.request_to_reserve),
          };
        });
  
        setFilteredComponents(updatedComponents);
      } else {
        setFilteredComponents([]);
        Alert.alert('Info', 'No components found.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to search components.');
    } finally {
      setLoading(false);
    }
  };
  
    
  const requestReserve = async (regNo: string) => {
    if (!user) {
      Alert.alert('Error', 'User information is missing.');
      return;
    }
  
    setLoading(true);
    try {
      const response = await fetch('https://beige-leese-44.tiiny.io/request_reserve.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reg_no: regNo,
          user_id: user.id, // Send user ID
          user_name: `${user.firstName} ${user.lastName}`, // Send full name
          email: user.email, // Send email
          phone_number: user.phone, // 
        }),
      });
  
      const result = await response.json();
      if (result.success) {
        Alert.alert('Success', 'Request to reserve submitted.');
        updateLocalReserveState(regNo, true);
      } else {
        Alert.alert('Error', 'Failed to submit request.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };
  

  const cancelReserve = async (regNo: string) => {
    if (!user) {
      Alert.alert('Error', 'User information is missing.');
      return;
    }
  
    setLoading(true);
    try {
      const response = await fetch('https://beige-leese-44.tiiny.io/cancel_reserve.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reg_no: regNo,
          user_id: user.id, // ✅ Send the user's ID
        }),
      });
  
      const result = await response.json();
      if (result.success) {
        Alert.alert('Success', 'Reservation request canceled.');
        updateLocalReserveState(regNo, false);
      } else {
        Alert.alert('Error', result.message || 'Failed to cancel request.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel request.');
    } finally {
      setLoading(false);
    }
  };
  

  const updateLocalReserveState = (regNo: string, requestToReserve: boolean) => {
    setComponents((prevComponents) =>
      prevComponents.map((item) =>
        item.reg_no === regNo ? { ...item, request_to_reserve: requestToReserve } : item
      )
    );
  
    setFilteredComponents((prevFiltered) =>
      prevFiltered.map((item) =>
        item.reg_no === regNo ? { ...item, request_to_reserve: requestToReserve } : item
      )
    );
  };
  

  const handleLogout = async () => {
    await AsyncStorage.removeItem('user');
    router.replace('/');
  };

  const handleQRCodeScan = () => {
    router.push('/QRCodeScanner');
  };

  return (
    <View style={styles.container}>
            {/* Profile Tab */}
            {user && (
        <TouchableOpacity style={styles.profileTab} onPress={() => router.push('/Profile')}>
          <Image
            source={user.profilePicture ? { uri: user.profilePicture } : require('../assets/default-avatar.png')}
            style={styles.profileImage}
          />
          <Text style={styles.profileText}>Hi, {user.firstName}</Text>
        </TouchableOpacity>
      )}

      
      <Text style={styles.title}>Lab Inventory Management</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#00695C" />}

      <View style={styles.selectionContainer}>
        <Text style={styles.sectionTitle}>Select Faculty:</Text>
        <FlatList
          horizontal
          data={faculties}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.selectionButton,
                selectedFaculty?.id === item.id && styles.selectedButton,
              ]}
              onPress={() => setSelectedFaculty(item)}
            >
              <Text style={styles.selectionButtonText}>{item.name}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No faculties available.</Text>}
        />
      </View>

      {selectedFaculty && (
        <View style={styles.selectionContainer}>
          <Text style={styles.sectionTitle}>Select Department:</Text>
          <FlatList
            horizontal
            data={departments.filter((dept) => dept.faculty_id === selectedFaculty.id)}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.selectionButton,
                  selectedDepartment?.id === item.id && styles.selectedButton,
                ]}
                onPress={() => setSelectedDepartment(item)}
              >
                <Text style={styles.selectionButtonText}>{item.name}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No departments available.</Text>}
          />
        </View>
      )}

      {selectedDepartment && (
        <View style={styles.selectionContainer}>
          <Text style={styles.sectionTitle}>Select Lab:</Text>
          <FlatList
            horizontal
            data={labs.filter((lab) => lab.department_id === selectedDepartment.id)}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.selectionButton,
                  selectedLab?.id === item.id && styles.selectedButton,
                ]}
                onPress={() => setSelectedLab(item)}
              >
                <Text style={styles.selectionButtonText}>{item.name}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No labs available.</Text>}
          />
        </View>
      )}

      {selectedLab && (
        <TouchableOpacity style={styles.fetchButton} onPress={fetchComponents}>
          <Text style={styles.fetchButtonText}>Search Components</Text>
        </TouchableOpacity>
        
      )}
      <TouchableOpacity style={styles.fetchButton} onPress={() => router.push('/ReservationsPage')}>
        <Text style={styles.fetchButtonText}>View Requests</Text>
      </TouchableOpacity>


      <Text style={styles.sectionTitle}>Available Components:</Text>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search components..."
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            fetchSearchResults(text);
          }}
        />
      </View>

      <FlatList
  data={filteredComponents}
  keyExtractor={(item) => item.reg_no}
  renderItem={({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>Component: {item.component_name}</Text>
      {item.faculty_name && <Text style={styles.itemText}>Faculty: {item.faculty_name}</Text>}
      {item.department_name && <Text style={styles.itemText}>Department: {item.department_name}</Text>}
      <Text style={styles.itemText}>Lab: {item.lab_name}</Text>

      {/* Display "Borrowed" if reserved */}
      {item.is_reserved ? (
        <Text style={styles.borrowedLabel}>Borrowed</Text>
      ) : item.request_to_reserve ? (
        // If the user requested to reserve, show "Cancel Request" button
        <TouchableOpacity style={styles.cancelButton} onPress={() => cancelReserve(item.reg_no)}>
          <Text style={styles.cancelButtonText}>Cancel Request</Text>
        </TouchableOpacity>
      ) : (
        // If not reserved or requested, show "Request to Reserve" button
        <TouchableOpacity style={styles.reserveButton} onPress={() => requestReserve(item.reg_no)}>
          <Text style={styles.reserveButtonText}>Request to Reserve</Text>
        </TouchableOpacity>
      )}
    </View>
  )}
  ListEmptyComponent={<Text style={styles.emptyText}>No components available.</Text>}
/>


      <View style={styles.bottomButtonsContainer}>
        <TouchableOpacity style={styles.scannerButton} onPress={handleQRCodeScan}>
          <Text style={styles.scannerButtonText}>QR Code Scanner</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#F5F5FF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#004D40',
  },
  profileTab: {
    position: 'absolute',
    top: 40,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  profileText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: '#D32F2F',
    padding: 10,
    borderRadius: 5,
  },
  logoutButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#333',
  },
  selectionContainer: {
    marginVertical: 5,
  },
  selectionButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#007BFF',
    borderRadius: 5,
    marginHorizontal: 5,
  },
  selectedButton: {
    backgroundColor: '#0056b3',
  },
  selectionButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  fetchButton: {
    backgroundColor: '#28A745',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10,
  },
  fetchButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  searchContainer: {
    marginVertical: 10,
    marginBottom: 15,
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  itemContainer: {
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#FFF',
    borderRadius: 5,
  },
  itemText: {
    fontSize: 16,
    marginBottom: 5,
  },
  reserveButton: {
    backgroundColor: '#28A745',
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  reserveButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#777',
    fontSize: 16,
    marginTop: 10,
  },
  bottomButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
  },
  scannerButton: {
    backgroundColor: '#00695C',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    width: '50%',
  },
  scannerButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  borrowedLabel: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 5,
  },
  cancelButton: {
    backgroundColor: '#FFA500', // Orange for cancel request
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});
