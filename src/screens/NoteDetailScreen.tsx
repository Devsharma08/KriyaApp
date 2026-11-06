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
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Note, NoteContentBlock } from '../types';
import {
  fetchNoteById,
  fetchNoteBlocks,
  updateNoteMetadata,
  updateNoteBlock,
  addNoteBlock,
} from '../database/queries';
import { SPACING, COLORS, RADIUS } from '../theme/spacing';

interface NoteDetailPageProps {
  noteId: string;
}

export const NoteDetailScreen: React.FC<NoteDetailPageProps> = ({ noteId }) => {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [label, setLabel] = useState('');
  const [blockId, setBlockId] = useState<string | null>(null);
  const [infoVisible, setInfoVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const loadNote = async () => {
      try {
        const [noteData, blocks] = await Promise.all([
          fetchNoteById(noteId),
          fetchNoteBlocks(noteId),
        ]);
        if (noteData) {
          setNote(noteData);
          setTitle(noteData.title);
          setLabel(noteData.label);
        }
        if (blocks.length > 0) {
          setContent(blocks[0].content);
          setBlockId(blocks[0].id);
        } else {
          setContent('');
          setBlockId(null);
        }
      } catch (error) {
        console.error('Failed to load note:', error);
        Alert.alert('Error', 'Failed to load note.');
      }
    };

    loadNote();
  }, [noteId]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSave = useCallback(async () => {
    if (!note) return;
    setIsSaving(true);
    try {
      await updateNoteMetadata(
        note.id,
        title.trim() || 'Untitled Note',
        label.trim() || 'General',
        content,
        content ? content.split('\n').length : 0,
      );
      if (blockId) {
        await updateNoteBlock(blockId, content, note.id);
      } else if (content.trim()) {
        await addNoteBlock(note.id, 'text', content.trim(), 0);
      }
      router.back();
    } catch (error) {
      console.error('Failed to save note:', error);
      Alert.alert('Error', 'Failed to save note.');
    } finally {
      setIsSaving(false);
    }
  }, [note, title, label, content, blockId]);

  const handleUploadMedia = () => {
    Alert.alert('Upload Media', 'File/media upload coming soon.', [
      { text: 'OK', style: 'cancel' },
    ]);
  };

  const renderInfoModal = () => {
    if (!note) return null;
    return (
      <Modal
        visible={infoVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setInfoVisible(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setInfoVisible(false)}
        >
          <View style={[styles.infoCard, { marginBottom: insets.bottom + SPACING.md }]}>
            <TouchableOpacity
              style={styles.infoCloseBtn}
              onPress={() => setInfoVisible(false)}
            >
              <Text style={styles.infoCloseText}>×</Text>
            </TouchableOpacity>
            <Text style={styles.infoTitle}>Note Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Title</Text>
              <Text style={styles.infoValue}>{note.title}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Section</Text>
              <Text style={styles.infoValue}>{note.sectionId || '—'}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Label</Text>
              <Text style={styles.infoValue}>{note.label || 'General'}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Created</Text>
              <Text style={styles.infoValue}>{new Date(note.createdAt).toLocaleDateString()}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Updated</Text>
              <Text style={styles.infoValue}>{new Date(note.updatedAt).toLocaleDateString()}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  if (!note) return null;

  const effectiveHeight = screenHeight - keyboardHeight;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 70 : 0}
    >
      <View style={styles.container}>
        {renderInfoModal()}

        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Untitled Note"
          />
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => setInfoVisible(true)}
          >
            <Text style={styles.infoText}>i</Text>
          </TouchableOpacity>
        </View>

        {/* Main Content Area */}
        <View style={styles.contentArea}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { minHeight: effectiveHeight, paddingBottom: keyboardHeight },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.contentCard}>
              <TextInput
                style={styles.contentInput}
                value={content}
                onChangeText={setContent}
                multiline
                placeholder="Start writing your note..."
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </ScrollView>
        </View>

        {/* Footer / Action Section */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={[styles.saveText, isSaving && styles.saveTextDisabled]}>
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleUploadMedia}
          >
            <Text style={styles.uploadText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    width: '85%',
    maxWidth: 340,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  infoCloseBtn: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
  },
  infoCloseText: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  infoDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.xs,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: 15,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 22,
    color: COLORS.textSecondary,
  },
  titleInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginHorizontal: 8,
  },
  infoButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  infoText: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: '600',
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    flexGrow: 1,
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  contentInput: {
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  saveTextDisabled: {
    color: '#FFFFFF',
  },
  uploadButton: {
    padding: SPACING.sm,
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 20,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
