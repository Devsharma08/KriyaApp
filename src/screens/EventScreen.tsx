// src/screens/EventsScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { AppEvent, Section } from '../types';
import { fetchEventsBySection, createEvent, updateEventStatus } from '../database/queries';
import { CreateEventModal } from '../components/CreateEventModal';
import { router } from 'expo-router';
import { SPACING, COLORS, RADIUS } from '../theme/spacing';
interface Props {
  selectedSectionId: string | null;
  sections: Section[];
}

export const EventsScreen: React.FC<Props> = ({ selectedSectionId, sections }) => {
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [selectedSectionId]);

  const loadEvents = async () => {
    const data = await fetchEventsBySection(selectedSectionId || undefined);
    setEvents(data);
  };

  const handleAddEvent = async (data: {
    title: string;
    type: 'todo' | 'calendar';
    priority: 'low' | 'mid' | 'high';
    sectionId?: string;
  }) => {
    await createEvent({
      ...data,
      status: 'not-started',
      startTime: new Date().toISOString(),
    });
    loadEvents();
  };

  const handleToggleComplete = (event: AppEvent) => {
    if (event.status === 'completed') {
      updateEventStatus(event.id, 'not-started').then(loadEvents);
      return;
    }

    // Require completion remark
    Alert.prompt(
      'Complete Event',
      'Add a completion remark before closing this item:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Done',
          onPress: async (remarkText) => {
            if (!remarkText?.trim()) {
              Alert.alert('Required', 'Completion remark cannot be empty.');
              return;
            }
            await updateEventStatus(event.id, 'completed', remarkText.trim());
            loadEvents();
          },
        },
      ],
      'plain-text'
    );
  };

  const handleOpenEvent = (eventId: string) => {
    router.push(`/events/${eventId}`);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>No events or tasks found for this section.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, item.status === 'completed' && styles.completedCard]}
            onPress={() => handleOpenEvent(item.id)}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.title, item.status === 'completed' && styles.completedText]}>
                {item.title}
              </Text>
              <View style={[styles.badge, styles[`priority_${item.priority}`]]}>
                <Text style={styles.badgeText}>{item.priority}</Text>
              </View>
            </View>

            <Text style={styles.meta}>
              Type: {item.type} | Status: {item.status}
            </Text>

            {item.remark && (
              <Text style={styles.remarkText}>Remark: "{item.remark}"</Text>
            )}
          </TouchableOpacity>
        )}
      />

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setIsModalOpen(true)}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <CreateEventModal
        visible={isModalOpen}
        sections={sections}
        selectedSectionId={selectedSectionId}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddEvent}
      />
    </View>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl * 2, // Extra room for FAB
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
  completedCard: { opacity: 0.6, backgroundColor: COLORS.surfaceVariant },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, flex: 1, marginRight: SPACING.sm },
  completedText: { textDecorationLine: 'line-through', color: COLORS.textSecondary },
  badge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.sm },
  priority_high: { backgroundColor: COLORS.danger },
  priority_mid: { backgroundColor: COLORS.warning },
  priority_low: { backgroundColor: COLORS.success },
  badgeText: { color: COLORS.surface, fontSize: 11, fontWeight: 'bold' },
  meta: { fontSize: 12, color: COLORS.textSecondary, marginTop: SPACING.xs },
  remarkText: { fontSize: 12, fontStyle: 'italic', color: COLORS.primary, marginTop: SPACING.xs },
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