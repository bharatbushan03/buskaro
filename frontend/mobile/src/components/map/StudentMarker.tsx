/**
 * Student Marker Component
 * 
 * Student's current location marker on the map.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

interface StudentMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title?: string;
}

export const StudentMarker: React.FC<StudentMarkerProps> = ({
  coordinate,
  title = 'You',
}) => {
  return (
    <Marker
      coordinate={coordinate}
      title={title}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={styles.container}>
        {/* Accuracy ring */}
        <View style={styles.accuracyRing} />
        
        {/* Main marker */}
        <View style={styles.marker}>
          <Ionicons name="person" size={14} color={colors.text.inverse} />
        </View>
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  accuracyRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.map.userMarker,
    opacity: 0.2,
  },
  marker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.map.userMarker,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.text.inverse,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
});

export default StudentMarker;
