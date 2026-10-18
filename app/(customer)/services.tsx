// ============================================================
// CoopConnect – Customer Services Screen
// ============================================================

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';
import * as Icons from 'lucide-react-native';
import { Colors, Spacing, Typography, Radius, Shadows, SERVICE_CATEGORIES } from '@/constants';
import { MOCK_SERVICES } from '@/services/mockData';

const { width } = Dimensions.get('window');

export default function ServicesScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = SERVICE_CATEGORIES.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const serviceDetail = selected ? MOCK_SERVICES.find((s) => s.category === selected) : null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Services</Text>
        <Text style={styles.subtitle}>Find skilled professionals for any task</Text>
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Search size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services…"
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {filtered.map((cat) => {
            const IconComp = (Icons as any)[cat.icon.charAt(0).toUpperCase() + cat.icon.slice(1)] ?? Icons.Wrench;
            const isSelected = selected === cat.id;
            const svc = MOCK_SERVICES.find((s) => s.category === cat.id);

            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => setSelected(isSelected ? null : cat.id)}
                activeOpacity={0.85}
              >
                <View style={[styles.iconWrap, isSelected && styles.iconWrapSelected]}>
                  <IconComp size={28} color={isSelected ? Colors.textInverse : Colors.primary} />
                </View>
                <Text style={[styles.cardName, isSelected && styles.cardNameSelected]}>{cat.name}</Text>
                <Text style={[styles.cardDesc, isSelected && styles.cardDescSelected]} numberOfLines={2}>
                  {cat.description}
                </Text>
                {svc && (
                  <Text style={[styles.cardPrice, isSelected && styles.cardPriceSelected]}>
                    from ₹{svc.basePrice}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Detail Panel */}
        {selected && serviceDetail && (
          <View style={styles.detailPanel}>
            <Text style={styles.detailTitle}>{serviceDetail.name}</Text>
            <Text style={styles.detailDesc}>{serviceDetail.description}</Text>
            <View style={styles.detailMeta}>
              <View style={styles.detailMetaItem}>
                <Text style={styles.detailMetaLabel}>Starting Price</Text>
                <Text style={styles.detailMetaValue}>₹{serviceDetail.basePrice}</Text>
              </View>
              <View style={styles.detailMetaItem}>
                <Text style={styles.detailMetaLabel}>Avg. Response</Text>
                <Text style={styles.detailMetaValue}>30 min</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.bookBtn}
              onPress={() => router.push(`/booking/create?service=${selected}`)}
              activeOpacity={0.85}
            >
              <Text style={styles.bookBtnText}>Book Now</Text>
            </TouchableOpacity>
          </View>
        )}

        {filtered.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No services found for &ldquo;{search}&rdquo;</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_W = (width - Spacing.base * 2 - Spacing.md) / 2;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.base, paddingBottom: 0 },
  title: { fontSize: Typography.fontSize.xxl, fontWeight: Typography.fontWeight.extraBold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  searchWrap: { padding: Spacing.base, paddingTop: Spacing.md },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.cardBackground, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, height: 46,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: Typography.fontSize.md, color: Colors.textPrimary },
  scroll: { padding: Spacing.base, paddingTop: 0, paddingBottom: Spacing.xxxl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.lg },
  card: {
    width: CARD_W, backgroundColor: Colors.cardBackground,
    borderRadius: Radius.lg, padding: Spacing.md, gap: 6, ...Shadows.sm,
  },
  cardSelected: { backgroundColor: Colors.primary },
  iconWrap: {
    width: 52, height: 52, borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  iconWrapSelected: { backgroundColor: 'rgba(255,255,255,0.25)' },
  cardName: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  cardNameSelected: { color: Colors.textInverse },
  cardDesc: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary, lineHeight: 16 },
  cardDescSelected: { color: 'rgba(255,255,255,0.85)' },
  cardPrice: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semiBold, color: Colors.secondary },
  cardPriceSelected: { color: 'rgba(255,255,255,0.9)' },
  detailPanel: {
    backgroundColor: Colors.cardBackground, borderRadius: Radius.xl,
    padding: Spacing.lg, ...Shadows.lg, gap: Spacing.md,
  },
  detailTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  detailDesc: { fontSize: Typography.fontSize.md, color: Colors.textSecondary, lineHeight: 22 },
  detailMeta: { flexDirection: 'row', gap: Spacing.xl },
  detailMetaItem: { gap: 2 },
  detailMetaLabel: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary },
  detailMetaValue: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  bookBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: 13, alignItems: 'center',
  },
  bookBtnText: { color: Colors.textInverse, fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.bold },
  emptyWrap: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  emptyText: { fontSize: Typography.fontSize.md, color: Colors.textSecondary },
});
