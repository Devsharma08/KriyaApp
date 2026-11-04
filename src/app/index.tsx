// src/app/index.tsx
import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { initDatabase } from '../database/db';
import { fetchSections } from '../database/queries';
import { Section } from '../types';
import { SectionFooter } from '../components/SectionFooter';
import { EventsScreen } from '../screens/EventScreen';
import { NotesScreen } from '../screens/NotesScreen';

export default function Index() {
  const [isReady, setIsReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'events' | 'notes'>('events');
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  useEffect(() => {
    async function setup() {
      try {
        await initDatabase();
        const loadedSections = await fetchSections();
        setSections(loadedSections);
        setIsReady(true);
      } catch (e) {
        console.error('Database setup failed', e);
      } finally {
        setIsReady(true);
      }
    }
    setup();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Navigation Switcher */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'events' && styles.activeTab]}
          onPress={() => setActiveTab('events')}
        >
          <Text style={[styles.tabText, activeTab === 'events' && styles.activeTabText]}>
            Tasks & Calendar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'notes' && styles.activeTab]}
          onPress={() => setActiveTab('notes')}
        >
          <Text style={[styles.tabText, activeTab === 'notes' && styles.activeTabText]}>
            Notes
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Screen Content */}
      <View style={styles.content}>
        {activeTab === 'events' ? (
          <EventsScreen selectedSectionId={selectedSectionId} />
        ) : (
          <NotesScreen selectedSectionId={selectedSectionId} />
        )}
      </View>

      {/* Bottom Section Filter */}
      <SectionFooter
        sections={sections}
        selectedSectionId={selectedSectionId}
        onSelectSection={setSelectedSectionId}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#E9ECEF',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
  },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  tabText: { fontWeight: '600', color: '#6C757D' },
  activeTabText: { color: '#007AFF' },
  content: { flex: 1 },
});