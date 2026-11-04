import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function TabTwoScreen() {
  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.body}>This starter app includes example code to help you get started.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  container: { padding: 24 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  body: { fontSize: 16, color: '#666' },
});
