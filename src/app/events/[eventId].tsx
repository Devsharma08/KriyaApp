import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppEvent } from '../../types';
import { fetchEventById, updateEventStatus } from '../../database/queries';
import { SPACING, COLORS, RADIUS } from '../../theme/spacing';

export default function EventDetailPage() {
  const { eventId } = useLocalSearchParams();
  const [event, setEvent] = useState<AppEvent | null>(null);

  useEffect(() => {
    const loadEvent = async () => {
      if (!eventId || typeof eventId !== 'string') return;
      const eventData = await fetchEventById(eventId);
      setEvent(eventData);
    };
    loadEvent();
  }, [eventId]);

  const handleToggleComplete = async () => {
    if (!event) return;
    if (event.status === 'completed') {
      await updateEventStatus(event.id, 'not-started');
    } else {
      const remark = await new Promise<string | undefined>((resolve) => {
        Alert.prompt(
          'Complete Event',
          'Add a completion remark before closing this item:',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Done',
              onPress: (remarkText) => resolve(remarkText?.trim() || undefined),
            },
          ],
          'plain-text'
        );
      });
      if (remark === undefined) return;
      await updateEventStatus(event.id, 'completed', remark);
    }
    const updated = await fetchEventById(event.id);
    setEvent(updated);
  };

  if (!event) return null;

  const priorityColors: Record<string, string> = {
    low: COLORS.success,
    mid: COLORS.warning,
    high: COLORS.danger,
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{event.title}</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.metaRow}>
            <Text style={styles.label}>Type</Text>
            <Text style={styles.value}>{event.type}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metaRow}>
            <Text style={styles.label}>Priority</Text>
            <TouchableOpacity style={[styles.chip, { backgroundColor: priorityColors[event.priority] }]}>
              <Text style={[styles.chipText, { color: '#FFFFFF' }]}>{event.priority}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />
          <View style={styles.metaRow}>
            <Text style={styles.label}>Status</Text>
            <TouchableOpacity style={styles.chip} onPress={handleToggleComplete}>
              <Text style={styles.chipText}>{event.status}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />
          <View style={styles.metaRow}>
            <Text style={styles.label}>Section</Text>
            <Text style={styles.value}>{event.sectionId || '—'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metaRow}>
            <Text style={styles.label}>Start Time</Text>
            <Text style={styles.value}>{new Date(event.startTime).toLocaleString()}</Text>
          </View>
          {event.endTime && (
            <>
              <View style={styles.divider} />
              <View style={styles.metaRow}>
                <Text style={styles.label}>End Time</Text>
                <Text style={styles.value}>{new Date(event.endTime).toLocaleString()}</Text>
              </View>
            </>
          )}
          {event.remark && (
            <>
              <View style={styles.divider} />
              <Text style={styles.fieldLabel}>Remark</Text>
              <Text style={styles.remarkText}>{event.remark}</Text>
            </>
          )}
        </View>

        <TouchableOpacity style={styles.toggleButton} onPress={handleToggleComplete}>
          <Text style={styles.toggleText}>
            {event.status === 'completed' ? 'Reopen Event' : 'Mark as Completed'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 22,
    color: '#64748B',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 8,
  },
  spacer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  value: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  chipText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 12,
  },
  remarkText: {
    fontSize: 14,
    color: '#1E293B',
    fontStyle: 'italic',
  },
  toggleButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  toggleText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
