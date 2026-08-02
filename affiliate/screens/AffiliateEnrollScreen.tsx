import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAffiliateStore } from '../services/affiliate.service';

const GREEN = '#0B6E6E';
const GREEN_DARK = '#053E3E';
const LIGHT_BG = '#F5F7FA';

export function AffiliateEnrollScreen() {
  const router = useRouter();
  const enroll = useAffiliateStore((s) => s.enroll);
  const [loading, setLoading] = useState(false);

  const handleEnroll = async () => {
    setLoading(true);
    const result = await enroll();
    setLoading(false);

    if (!result.success) {
      Alert.alert('Could not enroll', result.message ?? 'Please try again.');
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.iconWrap}>
        <Ionicons name="people-circle-outline" size={64} color={GREEN} />
      </View>
      <Text style={styles.title}>Become an AfyaSmart Affiliate</Text>
      <Text style={styles.desc}>
        Get your own referral link and earn 30% commission every time someone you refer
        subscribes.
      </Text>

      <TouchableOpacity
        style={[styles.cta, loading && styles.ctaDisabled]}
        onPress={handleEnroll}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.ctaText}>Get My Referral Code</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.backLink} onPress={() => router.replace('/(tabs)/profile' as any)}>
        <Text style={styles.backLinkText}>Back to my profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: LIGHT_BG,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(11,110,110,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    color: GREEN_DARK,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  desc: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  cta: {
    backgroundColor: GREEN,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    minWidth: 220,
  },
  ctaDisabled: {
    opacity: 0.7,
  },
  ctaText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  backLink: {
    marginTop: 20,
  },
  backLinkText: {
    color: GREEN,
    fontSize: 13,
    fontWeight: '600',
  },
});
