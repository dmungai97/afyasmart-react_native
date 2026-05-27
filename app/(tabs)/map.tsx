import { useEffect, useMemo, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Platform, Linking, FlatList, ScrollView
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { fetchNearbyDoctors } from '../../src/services/doctor.service';
import { getPharmacies } from '../../src/services/pharmacy.service';

const TEAL  = '#0B6E6E';
const RED   = '#DC2626';
const GREEN = '#16A34A';

type Centre = {
  id: number | string;
  name: string;
  type: 'Hospital' | 'Pharmacy' | 'Clinic' | 'Doctor';
  lat: number;
  lng: number;
  open: boolean;
  closes: string;
  subscribed?: boolean;
  source?: 'osm' | 'seed';
};

type OsmElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: Record<string, string>;
};

type NominatimPlace = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
};

const TYPE_CONFIG: Record<string, { color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  Hospital: { color: TEAL,     bg: '#E6F4F4', icon: 'business-outline' },
  Pharmacy: { color: '#2563EB', bg: '#EFF6FF', icon: 'medkit-outline' },
  Clinic:   { color: '#D97706', bg: '#FFF8E7', icon: 'medical-outline' },
  Doctor:   { color: '#7C3AED', bg: '#F5F3FF', icon: 'person-outline' },
};

const FILTER_TABS = ['Care', 'Hospitals', 'Clinics', 'All', 'Pharmacies', 'Doctors'];

const SEARCH_RADIUS_METRES = 25000;
const DEFAULT_LOCATION = { latitude: -1.286389, longitude: 36.817223 };
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function classifyCentre(tags: Record<string, string> = {}): Centre['type'] {
  const value = `${tags.amenity ?? ''} ${tags.healthcare ?? ''}`.toLowerCase();

  if (value.includes('pharmacy')) return 'Pharmacy';
  if (value.includes('doctor')) return 'Doctor';
  if (value.includes('clinic')) return 'Clinic';
  return 'Hospital';
}

function centreName(tags: Record<string, string> = {}, type: Centre['type']) {
  return tags.name || tags['official_name'] || tags['operator'] || `Nearby ${type}`;
}

async function fetchNearbyHealthCentres(
  coords: { latitude: number; longitude: number }
): Promise<Centre[]> {
  const { latitude, longitude } = coords;
  const query = `
    [out:json][timeout:12];
    (
      node["amenity"~"hospital|clinic|doctors|pharmacy"](around:${SEARCH_RADIUS_METRES},${latitude},${longitude});
      way["amenity"~"hospital|clinic|doctors|pharmacy"](around:${SEARCH_RADIUS_METRES},${latitude},${longitude});
      relation["amenity"~"hospital|clinic|doctors|pharmacy"](around:${SEARCH_RADIUS_METRES},${latitude},${longitude});
      node["healthcare"~"hospital|clinic|doctor|pharmacy"](around:${SEARCH_RADIUS_METRES},${latitude},${longitude});
      way["healthcare"~"hospital|clinic|doctor|pharmacy"](around:${SEARCH_RADIUS_METRES},${latitude},${longitude});
      relation["healthcare"~"hospital|clinic|doctor|pharmacy"](around:${SEARCH_RADIUS_METRES},${latitude},${longitude});
    );
    out center tags;
  `;

  let data: { elements?: OsmElement[] } | null = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      let response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (!response.ok) {
        response = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`);
      }

      if (response.ok) {
        data = await response.json();
        break;
      }
    } catch {
      // Try the next public Overpass endpoint.
    }
  }

  if (!data) {
    throw new Error('Could not load nearby health centres');
  }

  const seen = new Set<string>();

  return (data.elements ?? [])
    .map<Centre | null>((element) => {
      const lat = element.lat ?? element.center?.lat;
      const lng = element.lon ?? element.center?.lon;

      if (lat == null || lng == null) return null;

      const tags = element.tags ?? {};
      const type = classifyCentre(tags);
      const name = centreName(tags, type);
      const key = `${name.toLowerCase()}-${lat.toFixed(4)}-${lng.toFixed(4)}`;

      if (seen.has(key)) return null;
      seen.add(key);

      return {
        id: `osm-${element.type}-${element.id}`,
        name,
        type,
        lat,
        lng,
        open: true,
        closes: tags.opening_hours ?? 'Hours vary',
        source: 'osm' as const,
      };
    })
    .filter((centre): centre is Centre => Boolean(centre));
}

async function fetchNominatimHealthCentres(
  coords: { latitude: number; longitude: number }
): Promise<Centre[]> {
  const { latitude, longitude } = coords;
  const latSpan = 0.18;
  const lngSpan = 0.18;
  const viewbox = [
    longitude - lngSpan,
    latitude + latSpan,
    longitude + lngSpan,
    latitude - latSpan,
  ].join(',');
  const searches = [
    { query: 'hospital', type: 'Hospital' as const },
    { query: 'clinic', type: 'Clinic' as const },
  ];
  const seen = new Set<string>();
  const centres: Centre[] = [];

  for (const search of searches) {
    try {
      const params = new URLSearchParams({
        q: search.query,
        format: 'json',
        limit: '25',
        bounded: '1',
        viewbox,
        addressdetails: '0',
      });
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        headers: {
          'Accept-Language': 'en',
        },
      });

      if (!response.ok) continue;

      const places: NominatimPlace[] = await response.json();

      for (const place of places) {
        const lat = Number(place.lat);
        const lng = Number(place.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

        const name = place.display_name.split(',')[0]?.trim() || `Nearby ${search.type}`;
        const key = `${name.toLowerCase()}-${lat.toFixed(4)}-${lng.toFixed(4)}`;
        if (seen.has(key)) continue;
        seen.add(key);

        centres.push({
          id: `nominatim-${place.place_id}`,
          name,
          type: search.type,
          lat,
          lng,
          open: true,
          closes: 'Hours vary',
          source: 'osm',
        });
      }
    } catch {
      // Continue with the next search term.
    }
  }

  return centres;
}

async function fetchSeededHealthCentres(
  coords?: { latitude: number; longitude: number } | null,
): Promise<Centre[]> {
  const [doctorsResult, pharmaciesResult] = await Promise.all([
    fetchNearbyDoctors('', {
      ...(coords
        ? {
            lat: coords.latitude,
            lng: coords.longitude,
            radius: 500,
          }
        : {}),
    }),
    getPharmacies(''),
  ]);

  const doctors: Centre[] = doctorsResult.data
    .filter((doctor) => doctor.latitude && doctor.longitude)
    .map((doctor) => ({
      id: `doctor-${doctor.id}`,
      name: doctor.name,
      type: 'Doctor' as const,
      lat: doctor.latitude,
      lng: doctor.longitude,
      open: doctor.available,
      closes: doctor.availability || 'Availability varies',
      subscribed: true,
      source: 'seed' as const,
    }));

  const pharmacies: Centre[] = pharmaciesResult.data
    .filter((pharmacy: any) => pharmacy.latitude && pharmacy.longitude)
    .map((pharmacy: any) => ({
      id: `pharmacy-${pharmacy.id}`,
      name: pharmacy.name,
      type: 'Pharmacy' as const,
      lat: pharmacy.latitude,
      lng: pharmacy.longitude,
      open: pharmacy.open,
      closes: pharmacy.opening_hours || 'Hours vary',
      subscribed: true,
      source: 'seed' as const,
    }));

  return [...doctors, ...pharmacies];
}

function mergeCentres(primary: Centre[], fallback: Centre[]) {
  const seen = new Set<string>();

  return [...primary, ...fallback].filter((centre) => {
    const key = `${centre.name.toLowerCase()}-${centre.lat.toFixed(4)}-${centre.lng.toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation]     = useState<{ latitude: number; longitude: number } | null>(null);
  const [centres, setCentres]               = useState<(Centre & { distance?: number })[]>([]);
  const [selected, setSelected]             = useState<Centre | null>(null);
  const [loading, setLoading]               = useState(true);
  const [loadingLabel, setLoadingLabel]     = useState('Finding centres near you...');
  const [lookupError, setLookupError]       = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [viewMode, setViewMode]             = useState<'map' | 'list'>('map');
  const [activeFilter, setActiveFilter]     = useState('Care');

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        const seedCentres = await fetchSeededHealthCentres(DEFAULT_LOCATION);
        const withDistance = seedCentres.map(c => ({
          ...c,
          distance: getDistance(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude, c.lat, c.lng),
        })).sort((a, b) => a.distance - b.distance);

        setPermissionDenied(true);
        setUserLocation(DEFAULT_LOCATION);
        setLookupError('Location permission is off. Showing seeded Kenya services.');
        setLoading(false);
        setCentres(withDistance);
        return;
      }
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setUserLocation(coords);

        setLoadingLabel('Loading nearby hospitals and clinics...');

        let nearbyCentres: Centre[] = [];
        let nearbyLookupFailed = false;
        try {
          nearbyCentres = await fetchNearbyHealthCentres(coords);
        } catch {
          nearbyLookupFailed = true;
          nearbyCentres = [];
        }

        if (nearbyCentres.length === 0) {
          const nominatimCentres = await fetchNominatimHealthCentres(coords);
          nearbyCentres = nominatimCentres;
        }

        const seedCentres = await fetchSeededHealthCentres(coords);
        nearbyCentres = mergeCentres(nearbyCentres, seedCentres);

        setLookupError(
          nearbyCentres.length > 0
            ? null
            : nearbyLookupFailed
            ? 'Live nearby lookup failed. Showing seeded Kenya services.'
            : nearbyCentres.length === 0
            ? 'No seeded or mapped health centres were found.'
            : null
        );

        const withDistance = nearbyCentres.map(c => ({
          ...c,
          distance: getDistance(coords.latitude, coords.longitude, c.lat, c.lng),
        })).sort((a, b) => a.distance - b.distance);

        setCentres(withDistance);

        mapRef.current?.animateToRegion({
          ...coords,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 1000);
      } catch {
        const seedCentres = await fetchSeededHealthCentres(DEFAULT_LOCATION);
        const withDistance = seedCentres.map(c => ({
          ...c,
          distance: getDistance(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude, c.lat, c.lng),
        })).sort((a, b) => a.distance - b.distance);

        setUserLocation(DEFAULT_LOCATION);
        setLookupError('Could not get your current location. Showing seeded Kenya services.');
        setCentres(withDistance);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => centres.filter(c => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Care') return c.type === 'Hospital' || c.type === 'Clinic';
    if (activeFilter === 'Pharmacies') return c.type === 'Pharmacy';
    if (activeFilter === 'Doctors')    return c.type === 'Doctor';
    if (activeFilter === 'Hospitals')  return c.type === 'Hospital';
    if (activeFilter === 'Clinics')    return c.type === 'Clinic';
    return true;
  }), [activeFilter, centres]);

  useEffect(() => {
    if (loading || viewMode !== 'map' || filtered.length === 0) return;

    const coordinates = filtered.map((centre) => ({
      latitude: centre.lat,
      longitude: centre.lng,
    }));

    if (userLocation) {
      coordinates.push(userLocation);
    }

    setSelected(null);

    if (coordinates.length === 1) {
      mapRef.current?.animateToRegion({
        ...coordinates[0],
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      }, 600);
      return;
    }

    setTimeout(() => {
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: { top: 80, right: 60, bottom: 170, left: 60 },
        animated: true,
      });
    }, 250);
  }, [filtered, loading, userLocation, viewMode]);

  const getFilterCount = (tab: string) => {
    if (tab === 'All') return centres.length;
    if (tab === 'Care') return centres.filter(c => c.type === 'Hospital' || c.type === 'Clinic').length;
    if (tab === 'Pharmacies') return centres.filter(c => c.type === 'Pharmacy').length;
    if (tab === 'Doctors') return centres.filter(c => c.type === 'Doctor').length;
    if (tab === 'Hospitals') return centres.filter(c => c.type === 'Hospital').length;
    if (tab === 'Clinics') return centres.filter(c => c.type === 'Clinic').length;
    return 0;
  };

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
              {lookupError
                ? lookupError
                : userLocation
                  ? `${filtered.length} ${activeFilter.toLowerCase()} nearby`
                  : 'Finding your location'}
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
              <Text style={[styles.filterCount, activeFilter === tab && styles.filterCountActive]}>
                {getFilterCount(tab)}
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
                : { ...DEFAULT_LOCATION, latitudeDelta: 0.25, longitudeDelta: 0.25 }
            }
            showsUserLocation={Boolean(userLocation)}
            showsMyLocationButton={false}
            onPress={() => setSelected(null)}
          >
            {/* User radius circle */}
            {userLocation && (
              <Circle
                center={userLocation}
                radius={SEARCH_RADIUS_METRES}
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
                  title={centre.name}
                  description={`${centre.type}${centre.distance ? ` · ${centre.distance.toFixed(1)} km away` : ''}`}
                  pinColor={cfg.color}
                  onPress={() => setSelected(centre)}
                />
              );
            })}
          </MapView>

          {/* Loading overlay */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={TEAL} />
              <Text style={styles.loadingText}>{loadingLabel}</Text>
            </View>
          )}

          {!loading && filtered.length === 0 && (
            <View style={styles.emptyOverlay}>
              <Ionicons name="medical-outline" size={22} color={TEAL} />
              <Text style={styles.emptyTitle}>No {activeFilter.toLowerCase()} found nearby</Text>
              <Text style={styles.emptySub}>Try Care or All to broaden the results.</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  filterChipActive: { backgroundColor: '#fff' },
  filterChipText:   { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  filterChipTextActive: { color: TEAL },
  filterCount: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '800',
  },
  filterCountActive: { color: TEAL },

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

  emptyOverlay: {
    position: 'absolute',
    top: 18,
    left: 18,
    right: 18,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  emptyTitle: { flex: 1, fontSize: 13, color: '#1a1a1a', fontWeight: '800' },
  emptySub: { display: 'none' },

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
