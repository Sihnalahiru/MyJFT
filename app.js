import React, { useState, createContext, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// JSON Data - App එක ආරම්භයේදීම load කරගැනීම (Freeze වීම වැලැක්වීමට)
const alphabetData = require('./MyJFT-main/public/data/Alphabet/Alphabet.json');
const grammarData = require('./MyJFT-main/public/data/Grammar/irodori_starter_grammar_36patterns.json');

const XpContext = createContext();

// 1. Dashboard Screen (මුල් පිටුව)
function DashboardScreen({ navigation }) {
  const { xp } = useContext(XpContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Screen එක freeze වීම වැලැක්වීමට තත්පර භාගයක loading screen එකක් පෙන්වීම
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>App එක Load වෙමින් පවතී...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MyJFT Education App</Text>
        <View style={styles.xpBadge}>
          <Text style={styles.xpText}>{xp} XP</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
          onPress={() => navigation.navigate('Lesson', { title: 'Grammar (ව්‍යාකරණ)', data: grammarData, xpReward: 100 })}
        >
          <Text style={styles.cardTitle}>Grammar පාඩම</Text>
          <Text style={styles.cardSub}>ලබාගත හැකි XP: 100</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// 2. Lesson Screen (පාඩම් කරන පිටුව)
function LessonScreen({ route, navigation }) {
  const { title, data, xpReward } = route.params;
  const { setXp } = useContext(XpContext);

  function playAudio() {
    // සැබෑ Audio file එකක් සකසන තුරු Error එකක් නොපෙන්වා Alert එකක් ලබාදීම
    Alert.alert("Audio Play", "මෙතැනින් Audio එක Play වේ.");
  }

  const finishLesson = () => {
    setXp(prevXp => prevXp + xpReward);
    Alert.alert(
      "සුබ පැතුම්!", 
      `ඔබ මෙම පාඩම අවසන් කර ${xpReward} XP ලබා ගත්තා.`,
      [{ text: "මුල් පිටුවට යන්න", onPress: () => navigation.goBack() }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.lessonHeader}>
        <Text style={styles.lessonTitle}>{title}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Placeholder image එකක් භාවිතා කිරීම (App එක crash වීම වැලැක්වීමට) */}
        <Image 
          source={{ uri: 'https://via.placeholder.com/400x200?text=Lesson+Image' }} 
          style={styles.lessonImage} 
        />
        
        <Text style={styles.lessonText}>
          මෙම පාඩමට අදාළ දත්ත ප්‍රමාණය: {data ? Object.keys(data).length : 0} items.
        </Text>

        <TouchableOpacity style={styles.audioButton} onPress={playAudio}>
          <Text style={styles.buttonText}>🔊 Audio අසන්න</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.finishButton} onPress={finishLesson}>
          <Text style={styles.buttonText}>පාඩම අවසන් කරන්න (+{xpReward} XP)</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const Stack = createNativeStackNavigator();

// 3. Main Root App
export default function App() {
  const [xp, setXp] = useState(0);

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

// 4. Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  loadingText: { marginTop: 15, fontSize: 16, color: '#4B5563', fontWeight: 'bold' },
  header: { padding: 20, paddingTop: 40, backgroundColor: '#2563EB', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 20, color: '#fff', fontWeight: 'bold' },
  xpBadge: { backgroundColor: '#F59E0B', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  xpText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  content: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 15 },
  card: { backgroundColor: '#ffffff', padding: 20, borderRadius: 12, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#3B82F6' },
  cardSub: { fontSize: 14, color: '#6B7280', marginTop: 5 },
  lessonHeader: { padding: 20, paddingTop: 40, backgroundColor: '#10B981', alignItems: 'center' },
  lessonTitle: { fontSize: 24, color: '#fff', fontWeight: 'bold' },
  lessonImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 20, backgroundColor: '#e5e7eb' },
  lessonText: { fontSize: 16, color: '#4B5563', marginBottom: 20, textAlign: 'center' },
  audioButton: { backgroundColor: '#8B5CF6', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
  finishButton: { backgroundColor: '#10B981', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
