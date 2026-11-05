import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  Alert,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { Note, NoteContentBlock } from '../types';
import {
  deleteNoteBlock as deleteNote,
  updateNoteBlock as updateBlock,
  fetchNoteBlocks as fetchBlocks,
  fetchSectionById,
} from '../database/queries';

export const NoteDetailScreen: React.FC<{ note: Note; onClose: () => void }> = ({
  note,
  onClose,
}) => {
  const [blocks, setBlocks] = useState<NoteContentBlock[]>(note.contents || []);
  const [sectionName, setSectionName] = useState<string>('');
  const [label, setLabel] = useState<string>(note.label || 'General');
  const [updatedAt, setUpdatedAt] = useState<string>(note.updatedAt || new Date().toISOString());
  const [createdAt, setCreatedAt] = useState<string>(note.createdAt || new Date().toISOString());
  const [isSaving, setIsSaving] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const loadNoteDetails = async () => {
      try {
        const [noteBlocks, sectionDetail] = await Promise.all([
          fetchBlocks(note.id),
          fetchSectionById(note.sectionId),
        ]);
        setBlocks(noteBlocks);
        setSectionName(sectionDetail?.name || 'Unknown Section');
        setLabel(note.label || 'General');
        setUpdatedAt(note.updatedAt || new Date().toISOString());
        setCreatedAt(note.createdAt || new Date().toISOString());
      } catch (error) {
        console.error('Failed to load note details:', error);
        Alert.alert('Error', 'Failed to load note details.');
      }
    };

    loadNoteDetails();
  }, [note.id]);

  const debouncedSave = useCallback(
    (blockId: string, content: string) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          await updateBlock(blockId, content, note.id);
          setUpdatedAt(new Date().toISOString());
        } catch (error) {
          console.error('Failed to save block:', error);
          Alert.alert('Error', 'Failed to save changes.');
        } finally {
          setIsSaving(false);
        }
      }, 500);
    },
    [updateBlock, note.id]
  );

  const handleBlockTextChange = useCallback(
    (index: number, text: string) => {
      const updatedBlocks = [...blocks];
      updatedBlocks[index] = { ...updatedBlocks[index], content: text };
      setBlocks(updatedBlocks);
      debouncedSave(updatedBlocks[index].id, text);
    },
    [blocks, debouncedSave]
  );

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteNote(note.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete note:', error);
      Alert.alert('Error', 'Failed to delete note.');
    } finally {
      setIsDeleting(false);
      setDeleteVisible(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteVisible(false);
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const blockCount = blocks.length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.titleWrapper}>
          <Text style={styles.headerTitle}>{note.title || 'Untitled Note'}</Text>
          <Text style={styles.headerSubtitle}>{blockCount} block{blockCount !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={styles.moreButton} onPress={() => setDeleteVisible(true)}>
          <Text style={styles.moreText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Metadata Card */}
      <View style={styles.metadataCard}>
        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>SECTION</Text>
          <Text style={styles.metadataValue}>{sectionName}</Text>
        </View>
        <View style={styles.metadataDivider} />
        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>LABEL</Text>
          <Text style={styles.metadataValue}>{label}</Text>
        </View>
        <View style={styles.metadataDivider} />
        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>CREATED</Text>
          <Text style={styles.metadataValue}>{new Date(createdAt).toLocaleDateString()}</Text>
        </View>
        <View style={styles.metadataDivider} />
        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>UPDATED</Text>
          <Text style={styles.metadataValue}>{new Date(updatedAt).toLocaleDateString()}</Text>
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
          {blocks.map((block, index) => (
            <View key={block.id} style={styles.blockWrapper}>
              <TextInput
                value={block.content}
                onChangeText={(text) => handleBlockTextChange(index, text)}
                multiline
                numberOfLines={block.type === 'checklist' ? 3 : 6}
                style={styles.textInput}
                placeholder={block.type === 'checklist' ? 'Add checklist item...' : 'Write something...'}
                placeholderTextColor="#9AA0A6"
              />
              {index < blocks.length - 1 && (
                <View style={styles.blockDivider} />
              )}
            </View>
          ))}
          {isSaving && (
            <View style={styles.savingIndicator}>
              <Text style={styles.savingText}>Saving...</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteVisible}
        animationType="slide"
        transparent
        onRequestClose={handleCancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete Note</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete "{note.title || 'this note'}"? This action cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={handleCancelDelete}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalDeleteButton, isDeleting && styles.modalDeleteButtonDisabled]}
                onPress={handleConfirmDelete}
              >
                <Text style={[styles.modalDeleteText, isDeleting && styles.modalDeleteTextDisabled]}>
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  moreButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  moreText: {
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
  blockWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  blockDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  textInput: {
    fontSize: 16,
    color: '#1E293B',
    lineHeight: 24,
    padding: 16,
    textAlignVertical: 'top',
    ...(Platform.OS === 'ios' && {
      textAlignVertical: 'top',
    }),
  },
  savingIndicator: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  savingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    width: '85%',
    maxWidth: 340,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalCancelText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '600',
  },
  modalDeleteButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#EF4444',
    borderRadius: 8,
  },
  modalDeleteButtonDisabled: {
    opacity: 0.6,
  },
  modalDeleteText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalDeleteTextDisabled: {
    color: '#FFFFFF',
  },
});
