import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TextInput,
} from 'react-native';

type Reservation = {
  reg_no: string; // Component ID
  component_name: string; // Component Name
  user_name: string;
  email: string;
  request_date: string;
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://beige-leese-44.tiiny.io/fetch_reservations.php');
      const result = await response.json();
      if (result.success) {
        setReservations(result.reservations);
        setFilteredReservations(result.reservations);
      } else {
        setReservations([]);
        setFilteredReservations([]);
      }
    } catch (error) {
      console.error('Failed to fetch reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredReservations(reservations);
      return;
    }
    const filtered = reservations.filter((item) =>
      item.component_name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredReservations(filtered);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Reservation Requests</Text>
        
        <TextInput
          style={styles.searchInput}
          placeholder="Search by component name..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={handleSearch}
        />

        {loading && <ActivityIndicator size="large" color="#00ACC1" />}

        <FlatList
          data={filteredReservations}
          keyExtractor={(item) => item.reg_no}
          renderItem={({ item }) => (
            <View style={styles.itemContainer}>
              <Text style={styles.itemText}>
                Component: {item.component_name} (ID: {item.reg_no})
              </Text>
              <Text style={styles.itemText}>Requested By: {item.user_name}</Text>
              <Text style={styles.itemText}>Email: {item.email}</Text>
              <Text style={styles.itemText}>
                Date: {new Date(item.request_date).toLocaleString()}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            loading ? null : <Text style={styles.emptyText}>No reservations found.</Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E8F4FF',
    paddingTop: 40, // Additional top padding to prevent notch clashes
  },
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#E8F4FF' 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 20,
    color: '#0277BD'
  },
  searchInput: { 
    height: 45, 
    borderColor: '#00ACC1', 
    borderWidth: 1, 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    fontSize: 16, 
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    color: '#424242',
  },
  itemContainer: { 
    padding: 15, 
    marginBottom: 12, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  itemText: { 
    fontSize: 16, 
    marginBottom: 5, 
    color: '#424242' 
  },
  emptyText: { 
    textAlign: 'center', 
    fontSize: 16, 
    color: '#757575', 
    marginTop: 20 
  }
});
