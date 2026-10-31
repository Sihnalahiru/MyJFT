import React, { useState, createContext, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Audio } from 'expo-av';

// ඔබ ලබා දුන් JSON දත්ත ගොනු App එකට load කිරීම[cite: 1]
const alphabetData = require('./MyJFT-main/public/data/Alphabet/Alphabet.json');
const starterGrammarData = require('./MyJFT-main/public/data/Grammar/irodori_starter_grammar_36patterns.json');

// XP Points ගබඩා කිරීම සඳහා Context එකක් සෑදීම
const XpContext = createContext();

// 1. Dashboard Screen (මුල් පිටුව)
function DashboardScreen({ navigation }) {
  const { xp } = useContext(XpContext);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MyJFT අධ්‍යාපනික App</Text>
        <View style={styles.xpBadge}>
          <Text style={styles.xpText}>{xp} XP</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>ඔබගේ පාඩම්</Text>
        
        <TouchableOpacity 
          style={styles.card} 
          onPress={() => navigation.navigate('Lesson', { title: 'Alphabet (හෝඩිය)', data: alphabetData, xpReward: 50 })}
        >
          <Text style={styles.cardTitle}>Alphabet පාඩම</Text>
          <Text style={styles.cardSub}>ලබාගත හැකි XP: 50</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.card} 
          onPress={() => navigation.navigate('Lesson', { title: 'Starter Grammar', data: starterGrammarData, xpReward: 100 })}
        >
          <Text style={styles.cardTitle}>Grammar (ව්‍යාකරණ)</Text>
          <Text style={styles.cardSub}>ලබාගත හැකි XP: 100</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// 2. Lesson Screen (පාඩම් කරන පිටුව - Audio සහ Images සහිතව)
function LessonScreen({ route, navigation }) {
  const { title, data, xpReward } = route.params;
  const { setXp } = useContext(XpContext);
  const [sound, setSound] = useState();

  // App එක ඇතුළෙන්ම Audio play කිරීමේ function එක
  async function playAudio() {
    try {
      const { sound } = await Audio.Sound.createAsync(
        // උදාහරණයක් ලෙස local file එකක් හෝ JSON එකේ එන URL එකක් යෙදිය හැක
        require('./assets/favicon.png') // Note: මෙහි Audio file එකක path එක ලබා දෙන්න
      );
      setSound(sound);
      await sound.playAsync();
    } catch (error) {
      console.log("Audio load කිරීමේ දෝෂයක්:", error);
    }
  }

  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  const finishLesson = () => {
    setXp(prevXp => prevXp + xpReward);
    Alert.alert(
      "නියමයි!", 
      `ඔබ මෙම පාඩම අවසන් කර ${xpReward} XP ලබා ගත්තා.`,
      [{ text: "Dashboard එකට යන්න", onPress: () => navigation.goBack() }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.lessonHeader}>
        <Text style={styles.lessonTitle}>{title}</Text>
      </View>

      <View style={styles.content}>
        {/* App එක ඇතුළත Image එකක් Load කිරීම */}
        <Image 
          source={require('./assets/adaptive-icon.png')} 
          style={styles.lessonImage} 
        />
        
        <Text style={styles.lessonText}>
          මෙම පාඩමට අදාළ සියලුම දත්ත JSON ගොනුවෙන් load වී ඇත. සම්පූර්ණ දත්ත ප්‍රමාණය: {data ? Object.keys(data).length : 0} items.
        </Text>

        <TouchableOpacity style={styles.audioButton} onPress={playAudio}>
          <Text style={styles.buttonText}>🔊 Audio අසන්න</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.finishButton} onPress={finishLesson}>
          <Text style={styles.buttonText}>පාඩම අවසන් කරන්න (+{xpReward} XP)</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const Stack = createNativeStackNavigator();

// 3. Main App Component
export default function App() {
  const [xp, setXp] = useState(0); // මුළු XP ප්‍රමාණය

  return (
    <XpContext.Provider value={{ xp, setXp }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Lesson" component={LessonScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </XpContext.Provider>
  );
}

// 4. Styles (UI සැකසුම)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { padding: 25, paddingTop: 60, backgroundColor: '#2563EB', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 22, color: '#fff', fontWeight: 'bold' },
  xpBadge: { backgroundColor: '#F59E0B', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  xpText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  content: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 15 },
  card: { backgroundColor: '#ffffff', padding: 20, borderRadius: 12, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#3B82F6' },
  cardSub: { fontSize: 14, color: '#6B7280', marginTop: 5 },
  lessonHeader: { padding: 20, paddingTop: 50, backgroundColor: '#10B981', alignItems: 'center' },
  lessonTitle: { fontSize: 24, color: '#fff', fontWeight: 'bold' },
  lessonImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 20, resizeMode: 'contain', backgroundColor: '#e5e7eb' },
  lessonText: { fontSize: 16, color: '#4B5563', marginBottom: 20, lineHeight: 24, textAlign: 'center' },
  audioButton: { backgroundColor: '#8B5CF6', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
  finishButton: { backgroundColor: '#10B981', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
