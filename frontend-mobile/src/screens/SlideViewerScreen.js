import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { api } from '../api';

export default function SlideViewerScreen({ route, navigation }) {
  const { presentationId, title } = route.params || {};
  const [slides, setSlides] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title });
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/presentations/${presentationId}/slides`);
      setSlides(res.data.data || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6b46c1"/></View>;
  if (!slides || slides.length === 0) return <View style={styles.center}><Text>No slides</Text></View>;

  const next = () => setIndex(i => Math.min(i + 1, slides.length - 1));
  const prev = () => setIndex(i => Math.max(i - 1, 0));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Image source={{ uri: slides[index].url }} style={styles.image} resizeMode="contain" />
      <View style={styles.controls}>
        <TouchableOpacity onPress={prev} style={styles.controlBtn}><Text>Prev</Text></TouchableOpacity>
        <Text>{index + 1} / {slides.length}</Text>
        <TouchableOpacity onPress={next} style={styles.controlBtn}><Text>Next</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, paddingTop: 40, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  image: { width: '100%', height: '70%' },
  controls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  controlBtn: { padding: 12 }
});
