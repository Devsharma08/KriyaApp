// Update src/screens/NotesScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Note, Section } from '../types';
import { fetchNotesBySection, createNote } from '../database/queries';
import { CreateNoteModal } from '../components/CreateNoteModal';
import { NoteDetailScreen } from './NoteDetailScreen';
import { SPACING, COLORS, RADIUS } from '../theme/spacing';

interface Props {
  selectedSectionId: string | null;
  sections: Section[];
}

export const NotesScreen: React.FC<Props> = ({ selectedSectionId, sections }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  useEffect(() => {
    loadNotes();
  }, [selectedSectionId]);

  const loadNotes = async () => {
    const data = await fetchNotesBySection(selectedSectionId || undefined);
    setNotes(data);
  };

  const handleCreateNote = async (data: {
    title: string;
    label: string;
    sectionId: string;
    initialText: string;
  }) => {
    await createNote(data);
    loadNotes();
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.empty}>No notes found for this section.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => setSelectedNote(item)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.title}>{item.title}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.label || 'General'}</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.meta}>
                {item.lineCount} {item.lineCount === 1 ? 'line' : 'lines'}
              </Text>
              <Text style={styles.meta}>
                {new Date(item.updatedAt).toLocaleDateString()}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setIsCreateModalOpen(true)}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <CreateNoteModal
        visible={isCreateModalOpen}
        sections={sections}
        selectedSectionId={selectedSectionId}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateNote}
      />

      {selectedNote && (
        <NoteDetailScreen
          visible={true}
          note={selectedNote}
          onClose={() => setSelectedNote(null)}
          onNoteUpdated={loadNotes}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl * 2,
  },
  empty: { color: COLORS.textSecondary, marginTop: SPACING.xl, textAlign: 'center' },
  card: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.sm + 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, flex: 1, marginRight: SPACING.sm },
  badge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.sm, backgroundColor: COLORS.surfaceVariant },
  badgeText: { color: COLORS.primary, fontSize: 12, fontWeight: '600' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.sm },
  meta: { fontSize: 12, color: COLORS.textSecondary },
  fab: {
    position: 'absolute',
    bottom: SPACING.md,
    right: SPACING.md,
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabIcon: { fontSize: 32, color: COLORS.surface, marginTop: -2 },
});