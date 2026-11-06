import { useLocalSearchParams } from 'expo-router';
import { NoteDetailScreen } from '../../screens/NoteDetailScreen';

export default function NoteDetailPage() {
  const { noteId } = useLocalSearchParams();

  if (!noteId || typeof noteId !== 'string') {
    return null;
  }

  return <NoteDetailScreen noteId={noteId} />;
}
