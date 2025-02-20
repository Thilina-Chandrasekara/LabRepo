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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  faculty_name?: string;
  department_name?: string;
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
        const updatedComponents = result.components.map((item: ComponentData) => ({
          reg_no: item.reg_no,
          component_name: item.component_name,
          is_reserved: Boolean(item.is_reserved),
          request_to_reserve: Boolean(item.request_to_reserve),
          lab_name: item.lab_name,
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
      setFilteredComponents(components);
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
            ...item,
            is_reserved: Boolean(item.is_reserved),
            request_to_reserve: existingComponent 
              ? existingComponent.request_to_reserve 
              : Boolean(item.request_to_reserve),
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
          user_id: user.id,
          user_name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          phone_number: user.phone,
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
          user_id: user.id,
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          {user && (
            <TouchableOpacity style={styles.profileTab} onPress={() => router.push('/Profile')}>
              <Image
                source={
                  user.profilePicture
                    ? { uri: user.profilePicture }
                    : require('../assets/default-avatar.png')
                }
                style={styles.profileImage}
              />
              <Text style={styles.profileText}>Hi, {user.firstName}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <Text style={styles.title}>Lab Inventory Management</Text>

        {loading && <ActivityIndicator size="large" color="#00ACC1" />}

        {/* Faculty Selection */}
        <View style={styles.selectionContainer}>
          <Text style={styles.sectionTitle}>Select Faculty:</Text>
          <FlatList
            horizontal
            data={faculties}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => {
              const isSelected = selectedFaculty?.id === item.id;
              return (
                <TouchableOpacity
                  style={[
                    styles.selectionButton,
                    {
                      backgroundColor: isSelected ? '#00ACC1' : '#B2EBF2',
                      borderColor: '#00ACC1',
                    },
                  ]}
                  onPress={() => {
                    setSelectedFaculty(item);
                    setSelectedDepartment(null);
                    setSelectedLab(null);
                  }}
                >
                  <Text style={[styles.selectionButtonText, { color: isSelected ? '#FFFFFF' : '#007C91' }]}>{item.name}</Text>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={<Text style={styles.emptyText}>No faculties available.</Text>}
          />
        </View>

        {/* Department Selection */}
        {selectedFaculty && (
          <View style={styles.selectionContainer}>
            <Text style={styles.sectionTitle}>Select Department:</Text>
            <FlatList
              horizontal
              data={departments.filter((dept) => dept.faculty_id === selectedFaculty.id)}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => {
                const isSelected = selectedDepartment?.id === item.id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.selectionButton,
                      {
                        backgroundColor: isSelected ? '#00ACC1' : '#B2EBF2',
                        borderColor: '#00ACC1',
                      },
                    ]}
                    onPress={() => {
                      setSelectedDepartment(item);
                      setSelectedLab(null);
                    }}
                  >
                    <Text style={[styles.selectionButtonText, { color: isSelected ? '#FFFFFF' : '#007C91' }]}>{item.name}</Text>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={styles.emptyText}>No departments available.</Text>}
            />
          </View>
        )}

        {/* Lab Selection */}
        {selectedDepartment && (
          <View style={styles.selectionContainer}>
            <Text style={styles.sectionTitle}>Select Lab:</Text>
            <FlatList
              horizontal
              data={labs.filter((lab) => lab.department_id === selectedDepartment.id)}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => {
                const isSelected = selectedLab?.id === item.id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.selectionButton,
                      {
                        backgroundColor: isSelected ? '#00ACC1' : '#B2EBF2',
                        borderColor: '#00ACC1',
                      },
                    ]}
                    onPress={() => setSelectedLab(item)}
                  >
                    <Text style={[styles.selectionButtonText, { color: isSelected ? '#FFFFFF' : '#007C91' }]}>{item.name}</Text>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={styles.emptyText}>No labs available.</Text>}
            />
          </View>
        )}

        {/* Fetch Components & View Requests */}
        {selectedLab && (
          <TouchableOpacity style={[styles.fetchButton, { backgroundColor: '#7E57C2' }]} onPress={fetchComponents}>
            <Text style={styles.fetchButtonText}>Search Components</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.fetchButton, { backgroundColor: '#00ACC1' }]}
          onPress={() => router.push('/ReservationsPage')}
        >
          <Text style={styles.fetchButtonText}>View Requests</Text>
        </TouchableOpacity>

        {/* Components & Search */}
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

              {item.is_reserved ? (
                <Text style={styles.borrowedLabel}>Borrowed</Text>
              ) : item.request_to_reserve ? (
                <TouchableOpacity style={styles.cancelButton} onPress={() => cancelReserve(item.reg_no)}>
                  <Text style={styles.cancelButtonText}>Cancel Request</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.reserveButton} onPress={() => requestReserve(item.reg_no)}>
                  <Text style={styles.reserveButtonText}>Request to Reserve</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.viewDetailsButton}
                onPress={() =>
                  router.push({
                    pathname: '/ComponentDetails',
                    params: { component: JSON.stringify(item) },
                  })
                }
              >
                <Text style={styles.viewDetailsText}>View Details</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No components available.</Text>}
        />

        {/* Bottom Scanner Button */}
        <View style={styles.bottomButtonsContainer}>
          <TouchableOpacity style={styles.scannerButton} onPress={handleQRCodeScan}>
            <Text style={styles.scannerButtonText}>QR Code Scanner</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E8F4FF',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: '#E8F4FF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#0277BD',
    textAlign: 'center',
    marginVertical: 10,
  },
  profileTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  profileText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0277BD',
  },
  logoutButton: {
    backgroundColor: '#FF5252',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
    marginVertical: 8,
  },
  selectionContainer: {
    marginVertical: 6,
  },
  selectionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginHorizontal: 4,
    borderWidth: 1,
  },
  selectionButtonText: {
    fontWeight: '500',
    fontSize: 12,
  },
  fetchButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 10,
  },
  fetchButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  searchContainer: {
    marginVertical: 8,
  },
  searchInput: {
    height: 40,
    borderColor: '#B0BEC5',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
  itemContainer: {
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  itemText: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 4,
  },
  reserveButton: {
    backgroundColor: '#66BB6A',
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 6,
    alignItems: 'center',
  },
  reserveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  borrowedLabel: {
    color: '#D32F2F',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
  },
  cancelButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 6,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  viewDetailsButton: {
    backgroundColor: '#00ACC1',
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 6,
    alignItems: 'center',
  },
  viewDetailsText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#757575',
    fontSize: 14,
    marginTop: 10,
  },
  bottomButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  scannerButton: {
    backgroundColor: '#00ACC1',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  scannerButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
