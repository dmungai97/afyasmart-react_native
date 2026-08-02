import { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { View, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AffiliateEnrollScreen } from '@affiliate';
import { useAffiliateStore } from '@affiliate/services/affiliate.service';

const GREEN = '#0B6E6E';

function TabIcon({
  name,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
}) {
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
        width: 46,
        height: 34,
        borderRadius: 14,
        backgroundColor: focused
          ? 'rgba(11,110,110,0.12)'
          : 'transparent',
      }}
    >
      <Ionicons
        name={name}
        size={22}
        color={focused ? GREEN : '#9aa0a6'}
      />
    </View>
  );
}

export default function AffiliateLayout() {
  const insets = useSafeAreaInsets();
  const enrolled = useAffiliateStore((s) => s.enrolled);
  const load = useAffiliateStore((s) => s.load);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    load().finally(() => setChecked(true));
  }, [load]);

  if (!checked) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F7FA' }}>
        <ActivityIndicator size="large" color={GREEN} />
      </View>
    );
  }

  if (!enrolled) {
    return <AffiliateEnrollScreen />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: GREEN,
        tabBarInactiveTintColor: '#9aa0a6',
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#edf0f2',
          height: Platform.OS === 'android' ? 72 + insets.bottom : 82 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 10) : insets.bottom,
          marginHorizontal: 14,
          marginBottom: Platform.OS === 'android' ? 10 : 0,
          borderRadius: 22,
          elevation: 10,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: -2,
          paddingBottom: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'apps' : 'apps-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="referrals"
        options={{
          title: 'Referrals',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'people' : 'people-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: 'Earnings',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'stats-chart' : 'stats-chart-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="withdraw"
        options={{
          title: 'Withdraw',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'wallet' : 'wallet-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
