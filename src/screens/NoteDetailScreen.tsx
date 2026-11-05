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
import { Note, NoteContentBlock, MediaType } from '../types';
import {
  fetchNoteBlocks,
  addNoteBlock,
  updateNoteBlock,
  deleteNoteBlock,
  updateNoteMetadata,
} from '../database/queries';
import { SPACING, COLORS, RADIUS } from '../theme/spacing';

interface Props {
  visible: boolean;
  note: Note | null;
  onClose: () => void;
  onNoteUpdated: () => void;
}

const Divider = () => <View style={styles.divider} />;

export const NoteDetailScreen: React.FC<Props> = ({
  visible,
  note,
  onClose,
  onNoteUpdated,
}) => {
  const insets = useSafeAreaInsets();
  if (!note) return null;

  const [title, setTitle] = useState(note.title);
  const [label, setLabel] = useState(note.label);
  const [blocks, setBlocks] = useState<NoteContentBlock[]>([]);
  const [newBlockText, setNewBlockText] = useState('');
  const [newBlockType, setNewBlockType] = useState<MediaType>('text');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (note?.id) {
      setTitle(note.title);
      setLabel(note.label);
      loadBlocks();
    }
  }, [note?.id]);

  const loadBlocks = useCallback(async () => {
    if (!note?.id) return;
    const loaded = await fetchNoteBlocks(note.id);
    setBlocks(loaded);
  }, [note?.id]);

  const calculateLineCount = useCallback(
    (currentBlocks: NoteContentBlock[]) =>
      currentBlocks.reduce(
        (acc, b) => acc + (b.content ? b.content.split('\n').length : 0),
        0
      ),
    []
  );

  const handleSaveHeader = useCallback(async () => {
    const totalLines = calculateLineCount(blocks);
    setIsSaving(true);
    try {
      await updateNoteMetadata(
        note.id,
        title.trim() || 'Untitled Note',
        label.trim() || 'General',
        totalLines
      );
      onNoteUpdated();
      onClose();
    } catch (error) {
      console.error('Failed to save note metadata:', error);
      Alert.alert('Error', 'Failed to save note.');
    } finally {
      setIsSaving(false);
    }
  }, [note.id, title, label, blocks, calculateLineCount, onNoteUpdated, onClose]);

  const handleAddBlock = useCallback(async () => {
    if (!newBlockText.trim()) return;
    const nextOrder = blocks.length;
    await addNoteBlock(note.id, newBlockType, newBlockText.trim(), nextOrder);
    setNewBlockText('');
    await loadBlocks();
    onNoteUpdated();
  }, [note.id, newBlockText, newBlockType, blocks.length, loadBlocks, onNoteUpdated]);

  const handleUpdateBlockContent = useCallback(
    (blockId: string, text: string) => {
      setBlocks((prev) =>
        prev.map((b) => (b.id === blockId ? { ...b, content: text } : b))
      );
    },
    []
  );

  const handleDeleteBlock = async (blockId: string) => {
    Alert.alert('Delete Block', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteNoteBlock(note.id, blockId);
          await loadBlocks();
          onNoteUpdated();
        },
      },
    ]);
  };

  const blockTypes: MediaType[] = ['text', 'checklist'];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      {/* Backdrop tap closes modal */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        {/* Sheet — taps here should NOT close the modal */}
        <View
          style={[
            styles.sheetCard,
            { paddingBottom: Math.max(insets.bottom, SPACING.md) },
          ]}
          collapsable={false}
        >
          <View style={styles.headerSection}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Note Details</Text>
              <Text style={styles.headerSubtitle}>{title}</Text>
            </View>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => alert('Menu options coming soon')}
            >
              <Text style={styles.menuButtonText}>⋮</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mainContent}>
            <ScrollView
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
                <Text style={styles.emptyBlocks}>
                  No content blocks added yet.
                </Text>
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
                      onChangeText={(txt) =>
                        handleUpdateBlockContent(block.id, txt)
                      }
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
                      style={[
                        styles.typeBtn,
                        newBlockType === t && styles.activeTypeBtn,
                      ]}
                      onPress={() => setNewBlockType(t)}
                    >
                      <Text
                        style={[
                          styles.typeBtnText,
                          newBlockType === t && styles.activeTypeBtnText,
                        ]}
                      >
                        {t === 'text'
                          ? 'Text'
                          : t === 'checklist'
                          ? 'Checklist'
                          : t}
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
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={handleAddBlock}
                >
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

          <View style={styles.bottomNav}>
            <TouchableOpacity
              style={styles.navBtn}
              onPress={onClose}
            >
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.bottomNavTitle}>Note Details</Text>
            <TouchableOpacity
              style={[styles.navBtn, styles.saveBtn]}
              onPress={handleSaveHeader}
            >
              <Text style={[styles.saveText, isSaving && styles.saveTextDisabled]}>
                {isSaving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.dragHandle} />
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    maxHeight: '90%',
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  menuButton: {
    padding: SPACING.sm,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.md,
  },
  menuButtonText: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },
  mainContent: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  metaCard: {
    backgroundColor: COLORS.surfaceVariant,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  labelInput: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
    width: '100%',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptyBlocks: {
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginVertical: SPACING.xs,
  },
  blockCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.surfaceVariant,
  },
  blockTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  deleteBlockBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  deleteBlockText: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: '600',
  },
  blockInput: {
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 22,
    padding: SPACING.sm,
    textAlignVertical: 'top',
  },
  addBlockCard: {
    backgroundColor: COLORS.surfaceVariant,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  addBlockHeading: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
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
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeTypeBtn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeBtnText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  activeTypeBtnText: {
    color: COLORS.surface,
    fontWeight: '600',
  },
  addBlockInput: {
    fontSize: 15,
    color: COLORS.textPrimary,
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
    color: COLORS.surface,
    fontWeight: '600',
    fontSize: 15,
  },
  savingIndicator: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  savingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  navBtn: {
    padding: SPACING.xs,
  },
  saveBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
  },
  closeText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  bottomNavTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  saveText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  saveTextDisabled: {
    opacity: 0.7,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#CBD5E1',
    borderRadius: RADIUS.full,
    alignSelf: 'center',
    marginVertical: SPACING.xs,
  },
});
