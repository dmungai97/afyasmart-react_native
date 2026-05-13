import { Tabs } from 'expo-router';
import { View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TEAL = '#0B6E6E';

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
        color={focused ? TEAL : '#9aa0a6'}
      />
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: TEAL,
        tabBarInactiveTintColor: '#9aa0a6',

        // Keep the floating tab bar out of the keyboard path.
        tabBarHideOnKeyboard: true,

        tabBarStyle: {
          position: 'absolute',

          backgroundColor: '#ffffff',

          borderTopWidth: 1,
          borderTopColor: '#edf0f2',

          // better height handling
          height:
            Platform.OS === 'android'
              ? 72 + insets.bottom
              : 82 + insets.bottom,

          paddingTop: 8,

          // important fix
          paddingBottom:
            Platform.OS === 'android'
              ? Math.max(insets.bottom, 10)
              : insets.bottom,

          // floating modern look
          marginHorizontal: 14,
          marginBottom:
            Platform.OS === 'android'
              ? 10
              : 0,

          borderRadius: 22,

          // shadow
          elevation: 10,

          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 12,
          shadowOffset: {
            width: 0,
            height: 4,
          },
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
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={
                focused
                  ? 'home'
                  : 'home-outline'
              }
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="doctors"
        options={{
          title: 'Doctors',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={
                focused
                  ? 'people'
                  : 'people-outline'
              }
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={
                focused
                  ? 'location'
                  : 'location-outline'
              }
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
            <TabIcon
              name={
                focused
                  ? 'chatbubble'
                  : 'chatbubble-outline'
              }
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={
                focused
                  ? 'person'
                  : 'person-outline'
              }
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
