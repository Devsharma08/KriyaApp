// src/screens/NotesScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Note } from '../types';
import { fetchNotesBySection } from '../database/queries';

export const NotesScreen = ({ selectedSectionId }: { selectedSectionId: string | null }) => {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    loadNotes();
  }, [selectedSectionId]);

  const loadNotes = async () => {
    const data = await fetchNotesBySection(selectedSectionId || undefined);
    setNotes(data);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Daily Notes</Text>
      {notes.length === 0 ? (
        <Text style={styles.empty}>No notes found for this section.</Text>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>Topic: {item.label || 'General'} | Lines: {item.lineCount}</Text>
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