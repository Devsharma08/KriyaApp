import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Modal, Alert, TextInput, ScrollView } from 'react-native';
import { Note, NoteContentBlock } from '../types';
import { deleteNoteBlock as deleteNote, updateNoteBlock as updateBlock, fetchNoteBlocks as fetchBlocks, fetchSectionById } from '../database/queries';

export const NoteDetailScreen: React.FC<{ note: Note, onClose: () => void }> = ({ note, onClose }) => {
  const [noteContent, setNoteContent] = useState<NoteContentBlock[]>(note.contents || []);
  const [newContent, setNewContent] = useState<string>('');
  const [noteType, setNoteType] = useState<'text' | 'checklist' | 'image'>('text');
  const [sectionName, setSectionName] = useState<string>('');
  const [noteTitle, setNoteTitle] = useState<string>(note.title || '');
  const [label, setLabel] = useState<string>(note.label || 'General');
  const [updatedAt, setUpdatedAt] = useState<string>(note.updatedAt || new Date().toISOString());
  const [createdAt, setCreatedAt] = useState<string>(note.createdAt || new Date().toISOString());
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fetchNoteDetails = async () => {
      const [blocks, sectionDetail] = await Promise.all([
        fetchBlocks(note.id),
        fetchSectionById(note.sectionId)
      ]);
      setNoteContent(blocks);
      setNoteType((blocks[0]?.type as 'text' | 'checklist' | 'image') || 'text');
      setNoteTitle(note.title || '');
      setSectionName(sectionDetail?.name || '');
      setLabel(note.label || 'General');
      setUpdatedAt(note.updatedAt || new Date().toISOString());
      setCreatedAt(note.createdAt || new Date().toISOString());
    };

    fetchNoteDetails();
  }, [note.id]);

  const handleUpdateBlock = useCallback(async (blockId: string, content: string) => {
    await updateBlock(blockId, content, note.id);
  }, [updateBlock, note.id]);

  const handleDeleteNote = useCallback(() => {
    deleteNote(note.id);
    onClose();
  }, [note.id, deleteNote, onClose]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 3, backgroundColor: '#e8e7e7' }}>
        <Text>{note.title}</Text>
        <TouchableOpacity onPress={() => setVisible(true)} style={{ marginLeft: 'auto', padding: 5 }}>
          <Text style={{ color: 'red' }}>info</Text>
        </TouchableOpacity>
        <Modal
          visible={visible}
          animationType="slide"
          transparent
          onRequestClose={onClose}
        >
          <TouchableOpacity onPress={handleDeleteNote}>
            <Text style={{ color: 'red', marginLeft: 10 }}>Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: 'blue', marginLeft: 10 }}>Close</Text>
          </TouchableOpacity>
          <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Section: {sectionName}</Text>
          <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Label: {label}</Text>
          <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Created At: {createdAt}</Text>
          <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Updated At: {updatedAt}</Text>
        </Modal>
      </View>

      <View style={style.horizontalScale} />

      <View style={{
        flex: 1,
        padding: 10,
        backgroundColor: '#f9f9f9',
        borderRadius: 5,
        margin: 5
      }}>
        <ScrollView>
          {noteContent.map((block, index) => (
            <View key={block.id} style={{ marginBottom: 10 }}>
              <TextInput
                value={block.content}
                onChangeText={(text) => {
                  const updatedBlocks = [...noteContent];
                  updatedBlocks[index] = { ...updatedBlocks[index], content: text };
                  setNoteContent(updatedBlocks);
                }}
                multiline
                style={{
                  borderWidth: 1,
                  borderColor: '#ccc',
                  padding: 5,
                  borderRadius: 5,
                  backgroundColor: '#fff'
                }}
              />
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

const style = StyleSheet.create({
  horizontalScale: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 5
  }
})
