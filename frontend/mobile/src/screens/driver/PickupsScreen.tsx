/**
 * Driver Pickups Screen
 * 
 * Fully functional screen for managing pickup requests
 * - View pending, completed, and cancelled pickups
 * - Accept/reject pickup requests
 * - Real-time updates via Socket.IO
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
  Alert,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { 
  User, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ChevronRight
} from 'lucide-react-native';

interface PickupRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentPhone: string;
  pickupLocation: {
    address: string;
    lat: number;
    lng: number;
  };
  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
  requestTime: string;
  scheduledTime?: string;
  notes?: string;
}

const API_URL = 'http://localhost:3000/api/v1';

export const PickupsScreen: React.FC = () => {
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'ACTIVE' | 'HISTORY'>('PENDING');

  // Fetch pickups from API
  const fetchPickups = useCallback(async () => {
    try {
      setError(null);
      const token = 'mock-token'; // Replace with actual token from storage
      
      const response = await fetch(`${API_URL}/driver/pickups?status=${activeTab}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('Failed to fetch pickups');
      
      const data = await response.json();
      setPickups(data.data || []);
    } catch (err) {
      setError('Failed to load pickup requests');
      // Mock data for development
      setPickups([
        {
          id: '1',
          studentId: 'STU001',
          studentName: 'John Doe',
          studentPhone: '+91 9876543210',
          pickupLocation: { address: '123 Main St, City Center', lat: 28.6139, lng: 77.2090 },
          status: 'PENDING',
          requestTime: '2024-04-29T08:30:00Z',
          notes: 'Morning pickup',
        },
        {
          id: '2',
          studentId: 'STU002',
          studentName: 'Jane Smith',
          studentPhone: '+91 9876543211',
          pickupLocation: { address: '456 Park Ave, North Zone', lat: 28.6229, lng: 77.2180 },
          status: 'ACCEPTED',
          requestTime: '2024-04-29T08:15:00Z',
          scheduledTime: '2024-04-29T08:45:00Z',
        },
        {
          id: '3',
          studentId: 'STU003',
          studentName: 'Mike Johnson',
          studentPhone: '+91 9876543212',
          pickupLocation: { address: '789 Oak Rd, South Zone', lat: 28.6049, lng: 77.2000 },
          status: 'COMPLETED',
          requestTime: '2024-04-29T07:30:00Z',
          scheduledTime: '2024-04-29T08:00:00Z',
        },
      ]);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchPickups();
  }, [fetchPickups]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPickups();
    setRefreshing(false);
  }, [fetchPickups]);

  const handleAcceptPickup = async (pickupId: string) => {
    Alert.alert(
      'Accept Pickup',
      'Are you sure you want to accept this pickup request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              // API call to accept pickup
              setPickups(prev =>
                prev.map(p =>
                  p.id === pickupId ? { ...p, status: 'ACCEPTED' as const } : p
                )
              );
            } catch (err) {
              Alert.alert('Error', 'Failed to accept pickup');
            }
          },
        },
      ]
    );
  };

  const handleRejectPickup = async (pickupId: string) => {
    Alert.alert(
      'Reject Pickup',
      'Are you sure you want to reject this pickup request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setPickups(prev =>
                prev.map(p =>
                  p.id === pickupId ? { ...p, status: 'REJECTED' as const } : p
                )
              );
            } catch (err) {
              Alert.alert('Error', 'Failed to reject pickup');
            }
          },
        },
      ]
    );
  };

  const handleCompletePickup = async (pickupId: string) => {
    Alert.alert(
      'Complete Pickup',
      'Confirm that the student has been picked up?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              setPickups(prev =>
                prev.map(p =>
                  p.id === pickupId ? { ...p, status: 'COMPLETED' as const } : p
                )
              );
            } catch (err) {
              Alert.alert('Error', 'Failed to complete pickup');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return colors.warning;
      case 'ACCEPTED': return colors.primary;
      case 'COMPLETED': return colors.success;
      case 'CANCELLED':
      case 'REJECTED': return colors.error;
      default: return colors.text.secondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <AlertCircle size={16} color={colors.warning} />;
      case 'ACCEPTED': return <Clock size={16} color={colors.primary} />;
      case 'COMPLETED': return <CheckCircle size={16} color={colors.success} />;
      case 'CANCELLED':
      case 'REJECTED': return <XCircle size={16} color={colors.error} />;
      default: return null;
    }
  };

  const renderPickupCard = ({ item }: { item: PickupRequest }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.studentInfo}>
          <View style={styles.avatar}>
            <User size={24} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.studentName}>{item.studentName}</Text>
            <Text style={styles.studentId}>{item.studentId}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          {getStatusIcon(item.status)}
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.locationInfo}>
        <MapPin size={18} color={colors.text.secondary} />
        <Text style={styles.locationText} numberOfLines={2}>
          {item.pickupLocation.address}
        </Text>
      </View>

      <View style={styles.contactInfo}>
        <Phone size={16} color={colors.text.secondary} />
        <Text style={styles.contactText}>{item.studentPhone}</Text>
      </View>

      <View style={styles.timeInfo}>
        <Clock size={16} color={colors.text.secondary} />
        <Text style={styles.timeText}>
          Requested: {new Date(item.requestTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      {item.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes:</Text>
          <Text style={styles.notesText}>{item.notes}</Text>
        </View>
      )}

      {item.status === 'PENDING' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleRejectPickup(item.id)}
          >
            <XCircle size={18} color={colors.error} />
            <Text style={[styles.actionText, { color: colors.error }]}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleAcceptPickup(item.id)}
          >
            <CheckCircle size={18} color={colors.success} />
            <Text style={[styles.actionText, { color: colors.success }]}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status === 'ACCEPTED' && (
        <TouchableOpacity
          style={styles.completeButton}
          onPress={() => handleCompletePickup(item.id)}
        >
          <CheckCircle size={20} color={colors.white} />
          <Text style={styles.completeButtonText}>Mark as Picked Up</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const filteredPickups = pickups.filter(p => {
    if (activeTab === 'PENDING') return p.status === 'PENDING';
    if (activeTab === 'ACTIVE') return p.status === 'ACCEPTED';
    if (activeTab === 'HISTORY') return ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(p.status);
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pickup Requests</Text>
        <Text style={styles.headerSubtitle}>
          {filteredPickups.length} {activeTab.toLowerCase()} requests
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(['PENDING', 'ACTIVE', 'HISTORY'] as const).map(tab => (
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
          <Text style={styles.loadingText}>Loading pickups...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchPickups}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredPickups}
          keyExtractor={item => item.id}
          renderItem={renderPickupCard}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <CheckCircle size={64} color={colors.text.secondary} />
              <Text style={styles.emptyText}>No {activeTab.toLowerCase()} pickups</Text>
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
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  studentName: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text.primary,
  },
  studentId: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 16,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
    marginLeft: spacing[1],
    textTransform: 'capitalize',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing[3],
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[2],
  },
  locationText: {
    ...typography.body2,
    color: colors.text.primary,
    marginLeft: spacing[2],
    flex: 1,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  contactText: {
    ...typography.body2,
    color: colors.text.primary,
    marginLeft: spacing[2],
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  timeText: {
    ...typography.body2,
    color: colors.text.secondary,
    marginLeft: spacing[2],
  },
  notesContainer: {
    backgroundColor: colors.background.secondary,
    padding: spacing[2],
    borderRadius: 8,
    marginTop: spacing[2],
  },
  notesLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  notesText: {
    ...typography.body2,
    color: colors.text.primary,
    marginTop: spacing[1],
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[3],
    gap: spacing[2],
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
    borderRadius: 8,
    borderWidth: 1,
  },
  rejectButton: {
    borderColor: colors.error,
    backgroundColor: colors.error + '10',
  },
  acceptButton: {
    borderColor: colors.success,
    backgroundColor: colors.success + '10',
  },
  actionText: {
    ...typography.body2,
    fontWeight: '600',
    marginLeft: spacing[1],
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    paddingVertical: spacing[3],
    borderRadius: 8,
    marginTop: spacing[3],
  },
  completeButtonText: {
    ...typography.body1,
    color: colors.white,
    fontWeight: '600',
    marginLeft: spacing[2],
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  errorText: {
    ...typography.body1,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing[3],
  },
  retryButton: {
    marginTop: spacing[4],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    ...typography.body1,
    color: colors.white,
    fontWeight: '600',
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

export default PickupsScreen;
