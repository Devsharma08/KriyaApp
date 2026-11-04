// src/screens/EventsScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { AppEvent } from '../types';
import { fetchEventsBySection } from '../database/queries';

export const EventsScreen = ({ selectedSectionId }: { selectedSectionId: string | null }) => {
  const [events, setEvents] = useState<AppEvent[]>([]);

  useEffect(() => {
    loadEvents();
  }, [selectedSectionId]);

  const loadEvents = async () => {
    const data = await fetchEventsBySection(selectedSectionId || undefined);
    setEvents(data);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Tasks & Calendar Events</Text>
      {events.length === 0 ? (
        <Text style={styles.empty}>No events found for this section.</Text>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>Priority: {item.priority.toUpperCase()} | Status: {item.status}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#FFF' },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  empty: { color: '#8E8E93', marginTop: 20, textAlign: 'center' },
  card: { padding: 14, borderRadius: 8, backgroundColor: '#F2F2F7', marginBottom: 10 },
  title: { fontSize: 16, fontWeight: '600' },
  meta: { fontSize: 12, color: '#6C757D', marginTop: 4 },
});