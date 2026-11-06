import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Section } from '../../types';
import { createNote, fetchSections } from '../../database/queries';
import { SPACING, COLORS, RADIUS } from '../../theme/spacing';

export default function NewNotePage() {
  const [title, setTitle] = useState('');
  const [label, setLabel] = useState('');
  const [content, setContent] = useState('');
  const [sectionId, setSectionId] = useState<string>('');
  const [sections, setSections] = useState<Section[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadSections = async () => {
      const data = await fetchSections();
      setSections(data);
      if (data.length > 0 && !sectionId) {
        setSectionId(data[0].id);
      }
    };
    loadSections();
  }, [sectionId]);

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required.');
      return;
    }
    if (!sectionId) {
      Alert.alert('Error', 'Please select a section.');
      return;
    }
    setIsSaving(true);
    try {
      await createNote({
        title: title.trim(),
        label: label.trim() || 'General',
        sectionId,
        initialText: content,
      });
      router.back();
    } catch (error) {
      console.error('Failed to create note:', error);
      Alert.alert('Error', 'Failed to create note.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Note</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Note title"
          />
          <Text style={styles.fieldLabel}>Topic Label</Text>
          <TextInput
            style={styles.input}
            value={label}
            onChangeText={setLabel}
            placeholder="e.g. Distributed Systems"
          />
          <Text style={styles.fieldLabel}>Section</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sectionScroll}
          >
            {sections.map((sec) => (
              <TouchableOpacity
                key={sec.id}
                style={[
                  styles.chip,
                  sectionId === sec.id && styles.activeChip,
                ]}
                onPress={() => setSectionId(sec.id)}
              >
                <Text style={[styles.chipText, sectionId === sec.id && styles.activeChipText]}>
                  {sec.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={styles.fieldLabel}>Content</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={6}
            placeholder="Start typing your note here..."
          />
        </View>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleCreate}
          disabled={isSaving}
        >
          <Text style={[styles.saveButtonText, isSaving && styles.saveButtonTextDisabled]}>
            {isSaving ? 'Saving...' : 'Create Note'}
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
  scrollView: {
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
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 8,
    fontSize: 15,
    color: '#1E293B',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  sectionScroll: {
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  activeChip: {
    backgroundColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  activeChipText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButtonTextDisabled: {
    color: '#FFFFFF',
  },
});
