import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setAuthToken } from '../api';

export default function PresentationsScreen({ navigation }) {
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) return navigation.replace('Login');
      setAuthToken(token);
      fetchPresentations();
    })();
  }, []);

  const fetchPresentations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/presentations');
      setPresentations(res.data.data || res.data || []);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load presentations');
    } finally {
      setLoading(false);
    }
  };

  const openPresentation = (presentation) => {
    navigation.navigate('Slides', { presentationId: presentation.id, title: presentation.title });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Presentations</Text>
      {loading ? <ActivityIndicator size="large" color="#6b46c1" /> : (
        <FlatList
          data={presentations}
          keyExtractor={(i) => String(i.id)}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.item} onPress={() => openPresentation(item)}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemMeta}>{item.status}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 40 },
  header: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  item: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee', marginBottom: 10, backgroundColor: '#fff' },
  itemTitle: { fontSize: 16, fontWeight: '600' },
  itemMeta: { marginTop: 6, color: '#666', fontSize: 12 }
});
