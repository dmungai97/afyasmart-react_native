import { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Platform, Linking, FlatList, ScrollView
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

const TEAL  = '#0B6E6E';
const RED   = '#DC2626';
const GREEN = '#16A34A';

type Centre = {
  id: number;
  name: string;
  type: 'Hospital' | 'Pharmacy' | 'Clinic' | 'Doctor';
  lat: number;
  lng: number;
  open: boolean;
  closes: string;
  subscribed?: boolean;
};

// Fallback static centres (Nakuru area)
const STATIC_CENTRES: Centre[] = [
  { id: 1, name: 'Nakuru Level 5 Hospital',        type: 'Hospital',  lat: -0.2833, lng: 36.0667, open: true,  closes: '24/7',     subscribed: true },
  { id: 2, name: 'Rift Valley Provincial Hospital', type: 'Hospital',  lat: -0.2956, lng: 36.0731, open: true,  closes: '24/7',     subscribed: true },
  { id: 3, name: 'Goodlife Pharmacy',               type: 'Pharmacy',  lat: -0.2701, lng: 36.0598, open: true,  closes: '9:00 PM',  subscribed: true },
  { id: 4, name: 'Flamingo Health Clinic',          type: 'Clinic',    lat: -0.3012, lng: 36.0812, open: false, closes: '5:00 PM'  },
  { id: 5, name: 'Milimani Medical Centre',         type: 'Clinic',    lat: -0.2889, lng: 36.0521, open: true,  closes: '8:00 PM'  },
  { id: 6, name: 'Nakuru War Memorial Hospital',    type: 'Hospital',  lat: -0.2775, lng: 36.0743, open: true,  closes: '24/7',     subscribed: true },
  { id: 7, name: 'Dr. Mary Wanjiku',                type: 'Doctor',    lat: -0.2920, lng: 36.0680, open: true,  closes: '5:00 PM'  },
  { id: 8, name: 'Nairobi West Hospital',           type: 'Hospital',  lat: -0.2650, lng: 36.0550, open: true,  closes: '24/7'     },
];

const TYPE_CONFIG: Record<string, { color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  Hospital: { color: TEAL,     bg: '#E6F4F4', icon: 'business-outline' },
  Pharmacy: { color: '#2563EB', bg: '#EFF6FF', icon: 'medkit-outline' },
  Clinic:   { color: '#D97706', bg: '#FFF8E7', icon: 'medical-outline' },
  Doctor:   { color: '#7C3AED', bg: '#F5F3FF', icon: 'person-outline' },
};

const FILTER_TABS = ['All', 'Pharmacies', 'Doctors', 'Hospitals'];

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation]     = useState<{ latitude: number; longitude: number } | null>(null);
  const [centres, setCentres]               = useState<(Centre & { distance?: number })[]>([]);
  const [selected, setSelected]             = useState<Centre | null>(null);
  const [loading, setLoading]               = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [viewMode, setViewMode]             = useState<'map' | 'list'>('map');
  const [activeFilter, setActiveFilter]     = useState('All');

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionDenied(true);
        setLoading(false);
        // Still show static centres
        setCentres(STATIC_CENTRES);
        return;
      }
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setUserLocation(coords);

        // Sort centres by distance from user
        const withDistance = STATIC_CENTRES.map(c => ({
          ...c,
          distance: getDistance(coords.latitude, coords.longitude, c.lat, c.lng),
        })).sort((a, b) => a.distance - b.distance);

        setCentres(withDistance);

        mapRef.current?.animateToRegion({
          ...coords,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }, 1000);
      } catch {
        setCentres(STATIC_CENTRES);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = centres.filter(c => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Pharmacies') return c.type === 'Pharmacy';
    if (activeFilter === 'Doctors')    return c.type === 'Doctor';
    if (activeFilter === 'Hospitals')  return c.type === 'Hospital' || c.type === 'Clinic';
    return true;
  });

  const handleDirections = (centre: Centre) => {
    const url = Platform.select({
      ios:     `maps:0,0?q=${centre.name}@${centre.lat},${centre.lng}`,
      android: `geo:0,0?q=${centre.lat},${centre.lng}(${centre.name})`,
    });
    if (url) Linking.openURL(url);
  };

  const focusOnCentre = (centre: Centre) => {
    setSelected(centre);
    setViewMode('map');
    mapRef.current?.animateToRegion({
      latitude: centre.lat,
      longitude: centre.lng,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }, 800);
  };

  if (permissionDenied && centres.length === 0) {
    return (
      <View style={styles.centered}>
        <View style={styles.permIconWrap}>
          <Ionicons name="location-outline" size={36} color={TEAL} />
        </View>
        <Text style={styles.permTitle}>Location access needed</Text>
        <Text style={styles.permSub}>Enable location to find health centres near you.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={() => Linking.openSettings()}>
          <Text style={styles.permBtnText}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Nearby Services</Text>
            <Text style={styles.headerSub}>
              {userLocation ? 'Find care around you' : 'Showing centres in Nakuru'}
            </Text>
          </View>
          {/* Map / List toggle */}
          <View style={styles.toggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
              onPress={() => setViewMode('map')}
            >
              <Ionicons name="map-outline" size={16} color={viewMode === 'map' ? '#fff' : 'rgba(255,255,255,0.6)'} />
              <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>Map</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
              onPress={() => setViewMode('list')}
            >
              <Ionicons name="list-outline" size={16} color={viewMode === 'list' ? '#fff' : 'rgba(255,255,255,0.6)'} />
              <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>List</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTER_TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.filterChip, activeFilter === tab && styles.filterChipActive]}
              onPress={() => setActiveFilter(tab)}
            >
              <Text style={[styles.filterChipText, activeFilter === tab && styles.filterChipTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* MAP VIEW */}
      {viewMode === 'map' && (
        <View style={styles.mapWrap}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={
              userLocation
                ? { ...userLocation, latitudeDelta: 0.08, longitudeDelta: 0.08 }
                : { latitude: -0.2833, longitude: 36.0667, latitudeDelta: 0.08, longitudeDelta: 0.08 }
            }
            showsUserLocation
            showsMyLocationButton={false}
            onPress={() => setSelected(null)}
          >
            {/* User radius circle */}
            {userLocation && (
              <Circle
                center={userLocation}
                radius={3000}
                fillColor="rgba(11,110,110,0.05)"
                strokeColor="rgba(11,110,110,0.2)"
                strokeWidth={1}
              />
            )}

            {filtered.map((centre) => {
              const cfg = TYPE_CONFIG[centre.type];
              return (
                <Marker
                  key={centre.id}
                  coordinate={{ latitude: centre.lat, longitude: centre.lng }}
                  onPress={() => setSelected(centre)}
                  pinColor={cfg.color}
                />
              );
            })}
          </MapView>

          {/* Loading overlay */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={TEAL} />
              <Text style={styles.loadingText}>Finding centres near you...</Text>
            </View>
          )}

          {/* My Location button */}
          {userLocation && (
            <TouchableOpacity
              style={styles.myLocationBtn}
              onPress={() => mapRef.current?.animateToRegion({
                ...userLocation,
                latitudeDelta: 0.08,
                longitudeDelta: 0.08,
              }, 800)}
            >
              <Ionicons name="navigate" size={20} color={TEAL} />
            </TouchableOpacity>
          )}

          {/* Bottom sheet */}
          {selected ? (
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetInner}>
                <View style={[styles.sheetTypeIcon, { backgroundColor: TYPE_CONFIG[selected.type].bg }]}>
                  <Ionicons name={TYPE_CONFIG[selected.type].icon} size={22} color={TYPE_CONFIG[selected.type].color} />
                </View>
                <View style={styles.sheetInfo}>
                  <View style={styles.sheetTopRow}>
                    <Text style={styles.sheetName} numberOfLines={1}>{selected.name}</Text>
                    {(selected as any).subscribed && (
                      <View style={styles.subscribedBadge}>
                        <Text style={styles.subscribedText}>Subscribed</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.sheetMeta}>
                    <View style={[styles.openDot, { backgroundColor: selected.open ? GREEN : RED }]} />
                    <Text style={[styles.openText, { color: selected.open ? GREEN : RED }]}>
                      {selected.open ? 'Open' : 'Closed'}
                    </Text>
                    <Text style={styles.closesText}>· Closes {selected.closes}</Text>
                    {(selected as any).distance && (
                      <Text style={styles.distanceText}>· {(selected as any).distance.toFixed(1)} km</Text>
                    )}
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={styles.directionsBtn}
                onPress={() => handleDirections(selected)}
              >
                <Ionicons name="navigate-outline" size={16} color="#fff" />
                <Text style={styles.directionsBtnText}>Get Directions</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Legend */
            <View style={styles.legend}>
              {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
                <View key={type} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: cfg.color }]} />
                  <Text style={styles.legendText}>{type}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.listCount}>{filtered.length} centres found</Text>
          }
          renderItem={({ item }) => {
            const cfg = TYPE_CONFIG[item.type];
            const dist = (item as any).distance;
            return (
              <TouchableOpacity
                style={styles.listCard}
                onPress={() => focusOnCentre(item)}
                activeOpacity={0.8}
              >
                <View style={[styles.listIcon, { backgroundColor: cfg.bg }]}>
                  <Ionicons name={cfg.icon} size={22} color={cfg.color} />
                </View>
                <View style={styles.listInfo}>
                  <View style={styles.listTopRow}>
                    <Text style={styles.listName} numberOfLines={1}>{item.name}</Text>
                    {item.subscribed && (
                      <View style={styles.subscribedBadge}>
                        <Text style={styles.subscribedText}>Subscribed</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.listMeta}>
                    <View style={[styles.openDot, { backgroundColor: item.open ? GREEN : RED }]} />
                    <Text style={[styles.openText, { color: item.open ? GREEN : RED }]}>
                      {item.open ? 'Open' : 'Closed'}
                    </Text>
                    <Text style={styles.closesText}>· Closes {item.closes}</Text>
                  </View>
                </View>
                <View style={styles.listRight}>
                  {dist && (
                    <Text style={styles.distBadge}>{dist.toFixed(1)} km</Text>
                  )}
                  <Ionicons name="chevron-forward" size={16} color="#ccc" />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#F5F7FA' },

  permIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(11,110,110,0.08)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  permTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 },
  permSub:   { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  permBtn:   { backgroundColor: TEAL, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 12 },
  permBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Header
  header: {
    backgroundColor: TEAL,
    paddingTop: 52,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerSub:   { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },

  toggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    padding: 3,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  toggleBtnActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  toggleText:       { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600' },
  toggleTextActive: { color: '#fff' },

  filters: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  filterChipActive: { backgroundColor: '#fff' },
  filterChipText:   { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  filterChipTextActive: { color: TEAL },

  // Map
  mapWrap: { flex: 1 },
  map:     { flex: 1 },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245,247,250,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { fontSize: 14, color: TEAL, fontWeight: '500' },

  myLocationBtn: {
    position: 'absolute',
    bottom: 140,
    right: 16,
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },

  // Bottom sheet
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetInner:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  sheetTypeIcon: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  sheetInfo:   { flex: 1 },
  sheetTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  sheetName:   { fontSize: 16, fontWeight: '700', color: '#1a1a1a', flex: 1 },
  sheetMeta:   { flexDirection: 'row', alignItems: 'center', gap: 4 },

  openDot:     { width: 7, height: 7, borderRadius: 4 },
  openText:    { fontSize: 12, fontWeight: '600' },
  closesText:  { fontSize: 12, color: '#888' },
  distanceText:{ fontSize: 12, color: '#888' },

  subscribedBadge: {
    backgroundColor: 'rgba(11,110,110,0.1)',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10,
  },
  subscribedText: { fontSize: 10, color: TEAL, fontWeight: '700' },

  directionsBtn: {
    backgroundColor: TEAL,
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  directionsBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Legend
  legend: {
    position: 'absolute',
    bottom: 20, left: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    maxWidth: 220,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: '#555', fontWeight: '500' },

  // List view
  list:      { padding: 16, paddingBottom: 32, gap: 10 },
  listCount: { fontSize: 13, color: '#888', marginBottom: 4, fontWeight: '500' },
  listCard:  {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 0.5,
    borderColor: '#F0F0F0',
  },
  listIcon: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  listInfo:   { flex: 1 },
  listTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  listName:   { fontSize: 14, fontWeight: '700', color: '#1a1a1a', flex: 1 },
  listMeta:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  listRight:  { alignItems: 'flex-end', gap: 4 },
  distBadge:  {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8,
    fontSize: 11,
    color: '#555',
    fontWeight: '600',
    overflow: 'hidden',
  },
});