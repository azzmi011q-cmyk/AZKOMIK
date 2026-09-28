import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from './src/constants/theme';
import AnimatedSplashScreen from './src/components/AnimatedSplashScreen';
import { Ionicons } from './src/components/Icons';
import HomeScreen from './src/screens/HomeScreen';
import DetailScreen from './src/screens/DetailScreen';
import ReaderScreen from './src/screens/ReaderScreen';
import SearchScreen from './src/screens/SearchScreen';
import ComicListScreen from './src/screens/ComicListScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AuthScreen from './src/screens/AuthScreen';

const TABS = [
  ['Home', HomeScreen, 'home-outline', 'Home'],
  ['Search', SearchScreen, 'search-outline', 'Cari'],
  ['History', HistoryScreen, 'time-outline', 'Riwayat'],
  ['Profile', ProfileScreen, 'person-outline', 'Profil']
];

export default function App() {
  const [stack, setStack] = useState([{ name: 'Home', params: {} }]);
  const [splashDone, setSplashDone] = useState(false);
  const current = stack[stack.length - 1];
  const tab = TABS.find(([name]) => name === current.name);
  const Screen = tab?.[1] || ({ navigation, route }) => <View />;

  useEffect(() => {
    document.title = current.name === 'Home' ? 'AZKOM' : `${current.name} - AZKOM`;
  }, [current.name]);

  const navigation = {
    navigate(name, params = {}) {
      const tabName = name === 'Search' ? 'Search' : name === 'History' ? 'History' : name === 'Profile' ? 'Profile' : name === 'HomeTab' ? 'Home' : name === 'SearchTab' ? 'Search' : name === 'HistoryTab' ? 'History' : name === 'ProfileTab' ? 'Profile' : name;
      if (['Home', 'Search', 'History', 'Profile'].includes(tabName)) {
        setStack([{ name: tabName, params }]);
      } else {
        setStack(prev => [...prev, { name: name === 'MainTabs' ? 'Home' : name, params }]);
      }
    },
    goBack() {
      setStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <Screen navigation={navigation} route={{ params: current.params }} />
      </View>
      {tab && (
        <View style={styles.tabBar}>
          {TABS.map(([name, Component, icon, label]) => {
            const active = name === current.name;
            return (
              <TouchableOpacity key={name} style={styles.tabItem} onPress={() => navigation.navigate(name)}>
                <Ionicons name={icon} size={22} color={active ? COLORS.primary : COLORS.textMuted} />
                <Text style={[styles.tabLabel, { color: active ? COLORS.primary : COLORS.textMuted }]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      {!splashDone && <AnimatedSplashScreen onFinish={() => setSplashDone(true)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: '100vh', backgroundColor: COLORS.background },
  content: { flex: 1, minHeight: 0 },
  tabBar: {
    height: 64, flexDirection: 'row', backgroundColor: COLORS.background,
    borderTopWidth: 1, borderTopColor: COLORS.border, paddingBottom: 6, paddingTop: 6
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabLabel: { fontSize: 12, fontWeight: '600' }
});
