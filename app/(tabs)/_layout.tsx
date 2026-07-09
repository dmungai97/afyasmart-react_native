import { Tabs } from 'expo-router';
import { View, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';
import { isSubscriptionActive } from '../../src/services/subscription.model';

const TEAL = '#005454'; // Match the exact dark teal primary color

function TabItem({
  name,
  label,
  focused,
  badge,
}: {
  name: keyof typeof Ionicons.glyphMap;
  label: string;
  focused: boolean;
  badge?: boolean;
}) {
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 22,
        paddingVertical: 10,
        borderRadius: 24,
        backgroundColor: focused ? TEAL : 'transparent',
        minWidth: 76,
        height: 52,
        gap: 2,
      }}
    >
      <View style={{ position: 'relative' }}>
        <Ionicons
          name={name}
          size={20}
          color={focused ? '#ffffff' : '#718096'}
        />
        {badge && !focused && (
          <View
            style={{
              position: 'absolute',
              right: -4,
              top: -2,
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#ba1a1a', // red badge dot
            }}
          />
        )}
      </View>
      <Text
        style={{
          fontSize: 10,
          fontWeight: '700',
          color: focused ? '#ffffff' : '#718096',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const hasFullAccess = isSubscriptionActive(user);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, // Custom tabs handle the label inside TabItem
        tabBarActiveTintColor: TEAL,
        tabBarInactiveTintColor: '#A0AEC0',
        tabBarHideOnKeyboard: true,

        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#edf0f2',

          // Dynamic height based on safe area insets
          height: Platform.OS === 'android' ? 72 : 64 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'android' ? 12 : insets.bottom + 6,

          // Premium soft shadow at the top of the bar
          elevation: 8,
          shadowColor: '#000000',
          shadowOpacity: 0.05,
          shadowRadius: 10,
          shadowOffset: {
            width: 0,
            height: -4,
          },
        },

        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabItem
              name={focused ? 'home' : 'home-outline'}
              label="Home"
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="doctors"
        options={{
          href: hasFullAccess ? undefined : null,
          title: 'Doctors',
          tabBarIcon: ({ focused }) => (
            <TabItem
              name={focused ? 'people' : 'people-outline'}
              label="Doctors"
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="map"
        options={{
          href: hasFullAccess ? undefined : null,
          title: 'Map',
          tabBarIcon: ({ focused }) => (
            <TabItem
              name={focused ? 'location' : 'location-outline'}
              label="Map"
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ focused }) => (
            <TabItem
              name={focused ? 'chatbubble' : 'chatbubble-outline'}
              label="Chat"
              focused={focused}
              badge={true}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabItem
              name={focused ? 'person' : 'person-outline'}
              label="Profile"
              focused={focused}
            />
          ),
        }}
      />

      {/* Hidden routes */}
      <Tabs.Screen
        name="drugs"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="pharmacy"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="subscription"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="symptoms"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="diagnosis-results"
        options={{ href: null }}
      />
    </Tabs>
  );
}
