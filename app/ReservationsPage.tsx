import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TextInput } from 'react-native';

type Reservation = {
    reg_no: string; // Component ID
    component_name: string; // Component Name
    user_name: string;
    email: string;
    request_date: string;
  };
  

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]); // ✅ New state for filtering
  const [searchQuery, setSearchQuery] = useState<string>(''); // ✅ Search input state
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
        setFilteredReservations(result.reservations); // ✅ Set initial filtered data
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

  // ✅ Filter reservations based on search query
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredReservations(reservations); // Reset to full list if query is empty
      return;
    }

    const filtered = reservations.filter((item) =>
      item.component_name.toLowerCase().includes(query.toLowerCase())
    );

    setFilteredReservations(filtered);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reservation Requests</Text>

      {/* ✅ Search Bar */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search by component name..."
        value={searchQuery}
        onChangeText={handleSearch}
      />

      {loading && <ActivityIndicator size="large" color="#00695C" />}

      <FlatList
        data={filteredReservations}
        keyExtractor={(item) => item.reg_no}
        renderItem={({ item }) => (
            <View style={styles.itemContainer}>
            <Text style={styles.itemText}>Component: {item.component_name} (ID: {item.reg_no})</Text>
            <Text style={styles.itemText}>Requested By: {item.user_name}</Text>
            <Text style={styles.itemText}>Email: {item.email}</Text>
            <Text style={styles.itemText}>Date: {new Date(item.request_date).toLocaleString()}</Text>
            </View>
        )}
        ListEmptyComponent={loading ? null : <Text style={styles.emptyText}>No reservations found.</Text>} // ✅ Fixed
        />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F5F5FF' },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  searchInput: { 
    height: 40, 
    borderColor: '#ccc', 
    borderWidth: 1, 
    borderRadius: 5, 
    paddingHorizontal: 10, 
    fontSize: 16, 
    marginBottom: 10,
    backgroundColor: '#FFF',
  },
  itemContainer: { padding: 15, marginBottom: 10, backgroundColor: '#FFF', borderRadius: 5 },
  itemText: { fontSize: 16, marginBottom: 5 },
  emptyText: { textAlign: 'center', fontSize: 16, color: '#777', marginTop: 20 }
});
