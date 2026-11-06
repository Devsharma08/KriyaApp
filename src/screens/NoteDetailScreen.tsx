import React, { useEffect, useState, useCallback } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Note, NoteContentBlock, MediaType } from '../types';
import {
  fetchNoteBlocks,
  fetchNoteById,
  addNoteBlock,
  updateNoteBlock,
  deleteNoteBlock,
  updateNoteMetadata,
} from '../database/queries';
import { SPACING, COLORS, RADIUS } from '../theme/spacing';

const Divider = () => <View style={styles.divider} />;

interface NoteDetailPageProps {
  noteId: string;
}

export const NoteDetailScreen: React.FC<NoteDetailPageProps> = ({ noteId }) => {
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [label, setLabel] = useState('');
  const [blocks, setBlocks] = useState<NoteContentBlock[]>([]);
  const [newBlockText, setNewBlockText] = useState('');
  const [newBlockType, setNewBlockType] = useState<MediaType>('text');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadNote = async () => {
      try {
        const [noteData, noteBlocks] = await Promise.all([
          fetchNoteById(noteId),
          fetchNoteBlocks(noteId),
        ]);
        if (noteData) {
          setNote(noteData);
          setTitle(noteData.title);
          setLabel(noteData.label);
        }
        setBlocks(noteBlocks);
      } catch (error) {
        console.error('Failed to load note:', error);
        Alert.alert('Error', 'Failed to load note details.');
      }
    };

    loadNote();
  }, [noteId]);

  const calculateLineCount = useCallback(
    (currentBlocks: NoteContentBlock[]) =>
      currentBlocks.reduce(
        (acc, b) => acc + (b.content ? b.content.split('\n').length : 0),
        0
      ),
    []
  );

  const handleSaveHeader = useCallback(async () => {
    if (!note) return;
    const totalLines = calculateLineCount(blocks);
    setIsSaving(true);
    try {
      await updateNoteMetadata(
        note.id,
        title.trim() || 'Untitled Note',
        label.trim() || 'General',
        totalLines
      );
      router.back();
    } catch (error) {
      console.error('Failed to save note metadata:', error);
      Alert.alert('Error', 'Failed to save note.');
    } finally {
      setIsSaving(false);
    }
  }, [note, title, label, blocks, calculateLineCount]);

  const handleAddBlock = useCallback(async () => {
    if (!note) return;
    if (!newBlockText.trim()) return;
    const nextOrder = blocks.length;
    await addNoteBlock(note.id, newBlockType, newBlockText.trim(), nextOrder);
    setNewBlockText('');
    setBlocks((prev) => [...prev]);
  }, [note, newBlockText, newBlockType, blocks.length]);

  const handleUpdateBlockContent = useCallback(
    (blockId: string, text: string) => {
      setBlocks((prev) =>
        prev.map((b) => (b.id === blockId ? { ...b, content: text } : b))
      );
    },
    []
  );

  const handleDeleteBlock = async (blockId: string) => {
    if (!note) return;
    Alert.alert('Delete Block', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteNoteBlock(note.id, blockId);
          setBlocks((prev) => prev.filter((b) => b.id !== blockId));
        },
      },
    ]);
  };

  const handleDeleteNote = async () => {
    if (!note) return;
    Alert.alert('Delete Note', 'Are you sure you want to delete this note? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteNoteBlock(note.id);
          router.back();
        },
      },
    ]);
  };

  if (!note) {
    return null;
  }

  const blockTypes: MediaType[] = ['text', 'checklist'];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.titleWrapper}>
          <Text style={styles.headerTitle}>{note.title || 'Untitled Note'}</Text>
          <Text style={styles.headerSubtitle}>{blocks.length} block{blocks.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteNote}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Metadata Card */}
      <View style={styles.metadataCard}>
        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>SECTION</Text>
          <Text style={styles.metadataValue}>{note.sectionId || '—'}</Text>
        </View>
        <View style={styles.metadataDivider} />
        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>LABEL</Text>
          <Text style={styles.metadataValue}>{note.label || 'General'}</Text>
        </View>
        <View style={styles.metadataDivider} />
        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>CREATED</Text>
          <Text style={styles.metadataValue}>{new Date(note.createdAt).toLocaleDateString()}</Text>
        </View>
        <View style={styles.metadataDivider} />
        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>UPDATED</Text>
          <Text style={styles.metadataValue}>{new Date(note.updatedAt).toLocaleDateString()}</Text>
        </View>
      </View>

      {/* Content Editor */}
      <View style={styles.contentContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.metaCard}>
            <Text style={styles.fieldLabel}>Title</Text>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Note Title"
            />
            <Text style={styles.fieldLabel}>Topic Label</Text>
            <TextInput
              style={styles.labelInput}
              value={label}
              onChangeText={setLabel}
              placeholder="e.g. Distributed Systems"
            />
          </View>
          <Divider />
          <Text style={styles.sectionHeading}>Content Blocks</Text>
          {blocks.length === 0 ? (
            <Text style={styles.emptyBlocks}>No content blocks added yet.</Text>
          ) : (
            blocks.map((block, idx) => (
              <View key={block.id} style={styles.blockCard}>
                <View style={styles.blockHeader}>
                  <Text style={styles.blockTypeLabel}>
                    Block #{idx + 1} • {block.type.toUpperCase()}
                  </Text>
                  <TouchableOpacity
                    style={styles.deleteBlockBtn}
                    onPress={() => handleDeleteBlock(block.id)}
                  >
                    <Text style={styles.deleteBlockText}>Delete</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.blockInput}
                  multiline
                  value={block.content}
                  onChangeText={(txt) => handleUpdateBlockContent(block.id, txt)}
                />
              </View>
            ))
          )}
          <Divider />
          <View style={styles.addBlockCard}>
            <Text style={styles.addBlockHeading}>Add Content Block</Text>
            <View style={styles.typeRow}>
              {blockTypes.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, newBlockType === t && styles.activeTypeBtn]}
                  onPress={() => setNewBlockType(t)}
                >
                  <Text
                    style={[
                      styles.typeBtnText,
                      newBlockType === t && styles.activeTypeBtnText,
                    ]}
                  >
                    {t === 'text' ? 'Text' : t === 'checklist' ? 'Checklist' : t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.blockInput, styles.addBlockInput]}
              multiline
              placeholder={
                newBlockType === 'text'
                  ? 'Enter paragraph text...'
                  : 'Enter checklist item...'
              }
              value={newBlockText}
              onChangeText={setNewBlockText}
            />
            <TouchableOpacity style={styles.addBtn} onPress={handleAddBlock}>
              <Text style={styles.addBtnText}>+ Add Block</Text>
            </TouchableOpacity>
          </View>
          {isSaving && (
            <View style={styles.savingIndicator}>
              <Text style={styles.savingText}>Saving...</Text>
            </View>
          )}
        </ScrollView>
      </View>

      <TouchableOpacity
        style={styles.saveFooter}
        onPress={handleSaveHeader}
        disabled={isSaving}
      >
        <Text style={[styles.saveText, isSaving && styles.saveTextDisabled]}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

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
  titleWrapper: {
    flex: 1,
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deleteText: {
    fontSize: 15,
    color: '#EF4444',
    fontWeight: '600',
  },
  metadataCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  metadataDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  metadataLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metadataValue: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  metaCard: {
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
    marginBottom: 2,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: SPACING.sm,
  },
  labelInput: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: SPACING.md,
    width: '100%',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: SPACING.sm,
  },
  emptyBlocks: {
    color: '#94A3B8',
    fontStyle: 'italic',
    marginVertical: SPACING.xs,
  },
  blockCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: '#F1F5F9',
  },
  blockTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  deleteBlockBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  deleteBlockText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  blockInput: {
    fontSize: 15,
    color: '#1E293B',
    lineHeight: 22,
    padding: SPACING.sm,
    textAlignVertical: 'top',
  },
  addBlockCard: {
    backgroundColor: '#F1F5F9',
    padding: SPACING.md,
    borderRadius: 12,
  },
  addBlockHeading: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: SPACING.sm,
  },
  typeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  typeBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeTypeBtn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeBtnText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  activeTypeBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  addBlockInput: {
    fontSize: 15,
    color: '#1E293B',
    lineHeight: 22,
    padding: SPACING.sm,
    textAlignVertical: 'top',
    marginBottom: SPACING.sm,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  savingIndicator: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  savingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  saveFooter: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  saveText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  saveTextDisabled: {
    opacity: 0.7,
  },
});
