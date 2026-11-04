// src/components/SectionFooter.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { Section } from '../types';

interface Props {
  sections: Section[];
  selectedSectionId: string | null;
  onSelectSection: (id: string | null) => void;
}

export const SectionFooter: React.FC<Props> = ({
  sections,
  selectedSectionId,
  onSelectSection,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <TouchableOpacity
          style={[styles.chip, selectedSectionId === null && styles.activeChip]}
          onPress={() => onSelectSection(null)}
        >
          <Text style={[styles.chipText, selectedSectionId === null && styles.activeText]}>
            All
          </Text>
        </TouchableOpacity>

        {sections.map((sec) => {
          const isActive = selectedSectionId === sec.id;
          return (
            <TouchableOpacity
              key={sec.id}
              style={[styles.chip, isActive && styles.activeChip]}
              onPress={() => onSelectSection(sec.id)}
            >
              <Text style={[styles.chipText, isActive && styles.activeText]}>
                {sec.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#F8F9FA',
    paddingVertical: 10,
  },
  scroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E9ECEF',
  },
  activeChip: {
    backgroundColor: '#007AFF',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  activeText: {
    color: '#FFFFFF',
  },
});