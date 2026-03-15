import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';

export default function PlayerTab() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Reproductor</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' },
  title: { color: colors.textPrimary, fontSize: 24, fontWeight: '600' },
});
