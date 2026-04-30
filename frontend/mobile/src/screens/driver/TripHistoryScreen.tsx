/**
 * Driver Trip History Screen
 * 
 * View completed trips, trip statistics, and earnings
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { 
  Route, 
  MapPin, 
  Users, 
  Clock, 
  DollarSign,
  Calendar,
  ChevronRight,
  Star,
  TrendingUp
} from 'lucide-react-native';

interface Trip {
  id: string;
  routeId: string;
  routeName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  distance: number;
  passengers: number;
  earnings: number;
  rating: number;
  status: 'COMPLETED' | 'CANCELLED';
  startLocation: string;
  endLocation: string;
}

const API_URL = 'http://localhost:3000/api/v1';

export const TripHistoryScreen: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [stats, setStats] = useState({
    totalTrips: 0,
    totalEarnings: 0,
    totalDistance: 0,
    avgRating: 0,
  });

  const fetchTrips = useCallback(async () => {
    try {
      setError(null);
      const token = 'mock-token';
      
      const response = await fetch(`${API_URL}/driver/trips/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('Failed to fetch trips');
      
      const data = await response.json();
      setTrips(data.data || []);
      setStats(data.stats || { totalTrips: 156, totalEarnings: 45200, totalDistance: 2340, avgRating: 4.7 });
    } catch (err) {
      setError('Failed to load trip history');
      setTrips([
        {
          id: '1',
          routeId: 'RT-001',
          routeName: 'City Center - University',
          date: '2024-04-28',
          startTime: '08:00 AM',
          endTime: '09:15 AM',
          duration: 75,
          distance: 12.5,
          passengers: 45,
          earnings: 850,
          rating: 4.8,
          status: 'COMPLETED',
          startLocation: 'City Center',
          endLocation: 'University Campus',
        },
        {
          id: '2',
          routeId: 'RT-002',
          routeName: 'North Zone - Campus',
          date: '2024-04-27',
          startTime: '07:45 AM',
          endTime: '08:50 AM',
          duration: 65,
          distance: 18.2,
          passengers: 32,
          earnings: 620,
          rating: 4.5,
          status: 'COMPLETED',
          startLocation: 'North Zone',
          endLocation: 'University Campus',
        },
        {
          id: '3',
          routeId: 'RT-001',
          routeName: 'City Center - University',
          date: '2024-04-26',
          startTime: '08:00 AM',
          endTime: '08:30 AM',
          duration: 30,
          distance: 6.0,
          passengers: 0,
          earnings: 0,
          rating: 0,
          status: 'CANCELLED',
          startLocation: 'City Center',
          endLocation: 'Cancelled',
        },
      ]);
      setStats({ totalTrips: 156, totalEarnings: 45200, totalDistance: 2340, avgRating: 4.7 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTrips();
    setRefreshing(false);
  }, [fetchTrips]);

  const filteredTrips = trips.filter(t => {
    if (activeTab === 'ALL') return true;
    return t.status === activeTab;
  });

  const renderTripCard = ({ item }: { item: Trip }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.routeInfo}>
          <View style={styles.routeIcon}>
            <Route size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.routeName}>{item.routeName}</Text>
            <Text style={styles.routeCode}>{item.routeId}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, item.status === 'COMPLETED' ? styles.completedBadge : styles.cancelledBadge]}>
          <Text style={[styles.statusText, item.status === 'COMPLETED' ? styles.completedText : styles.cancelledText]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Calendar size={16} color={colors.text.secondary} />
          <Text style={styles.detailText}>{item.date}</Text>
        </View>
        <View style={styles.detailItem}>
          <Clock size={16} color={colors.text.secondary} />
          <Text style={styles.detailText}>{item.startTime} - {item.endTime}</Text>
        </View>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <MapPin size={16} color={colors.text.secondary} />
          <Text style={styles.detailText}>{item.distance} km</Text>
        </View>
        <View style={styles.detailItem}>
          <Clock size={16} color={colors.text.secondary} />
          <Text style={styles.detailText}>{item.duration} min</Text>
        </View>
      </View>

      {item.status === 'COMPLETED' && (
        <>
          <View style={styles.divider} />
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Users size={16} color={colors.primary} />
              <Text style={styles.statValue}>{item.passengers}</Text>
              <Text style={styles.statLabel}>Passengers</Text>
            </View>
            <View style={styles.statItem}>
              <DollarSign size={16} color={colors.success} />
              <Text style={styles.statValue}>₹{item.earnings}</Text>
              <Text style={styles.statLabel}>Earnings</Text>
            </View>
            <View style={styles.statItem}>
              <Star size={16} color={colors.warning} />
              <Text style={styles.statValue}>{item.rating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        </>
      )}

      <View style={styles.divider} />

      <View style={styles.locationsRow}>
        <View style={styles.locationItem}>
          <View style={styles.dot} />
          <Text style={styles.locationText} numberOfLines={1}>{item.startLocation}</Text>
        </View>
        <View style={styles.arrow}>
          <ChevronRight size={16} color={colors.text.secondary} />
        </View>
        <View style={styles.locationItem}>
          <View style={[styles.dot, styles.dotEnd]} />
          <Text style={styles.locationText} numberOfLines={1}>{item.endLocation}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trip History</Text>
        <Text style={styles.headerSubtitle}>
          {filteredTrips.length} trips
        </Text>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <TrendingUp size={20} color={colors.primary} />
          <Text style={styles.statNumber}>{stats.totalTrips}</Text>
          <Text style={styles.statLabel}>Total Trips</Text>
        </View>
        <View style={styles.statCard}>
          <DollarSign size={20} color={colors.success} />
          <Text style={styles.statNumber}>₹{stats.totalEarnings}</Text>
          <Text style={styles.statLabel}>Earnings</Text>
        </View>
        <View style={styles.statCard}>
          <MapPin size={20} color={colors.info} />
          <Text style={styles.statNumber}>{stats.totalDistance}km</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        <View style={styles.statCard}>
          <Star size={20} color={colors.warning} />
          <Text style={styles.statNumber}>{stats.avgRating}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(['ALL', 'COMPLETED', 'CANCELLED'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading trips...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTrips}
          keyExtractor={item => item.id}
          renderItem={renderTripCard}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Route size={64} color={colors.text.secondary} />
              <Text style={styles.emptyText}>No {activeTab.toLowerCase()} trips</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  header: {
    padding: spacing[4],
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  headerSubtitle: {
    ...typography.body2,
    color: colors.text.secondary,
    marginTop: spacing[1],
  },
  statsContainer: {
    flexDirection: 'row',
    padding: spacing[4],
    gap: spacing[2],
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing[3],
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    ...typography.h4,
    color: colors.text.primary,
    marginTop: spacing[1],
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing[2],
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.primary + '15',
  },
  tabText: {
    ...typography.body2,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  listContainer: {
    padding: spacing[4],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing[4],
    marginBottom: spacing[3],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  routeName: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text.primary,
  },
  routeCode: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 16,
  },
  completedBadge: {
    backgroundColor: colors.success + '15',
  },
  cancelledBadge: {
    backgroundColor: colors.error + '15',
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
  },
  completedText: {
    color: colors.success,
  },
  cancelledText: {
    color: colors.error,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing[3],
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  detailText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing[2],
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h4,
    color: colors.text.primary,
    marginTop: spacing[1],
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing[0.5],
  },
  locationsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: spacing[2],
  },
  dotEnd: {
    backgroundColor: colors.error,
  },
  locationText: {
    ...typography.body2,
    color: colors.text.primary,
    flex: 1,
  },
  arrow: {
    paddingHorizontal: spacing[2],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body2,
    color: colors.text.secondary,
    marginTop: spacing[3],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[10],
  },
  emptyText: {
    ...typography.body1,
    color: colors.text.secondary,
    marginTop: spacing[4],
  },
});

export default TripHistoryScreen;
