/**
 * Socket Service
 * 
 * Socket.IO client for real-time communication.
 */

import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../constants/api';
import { SOCKET_EVENTS } from '../constants/api';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  /**
   * Connect to socket server
   */
  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(API_CONFIG.BASE_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on(SOCKET_EVENTS.CONNECT, () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on(SOCKET_EVENTS.CONNECT_ERROR, (error) => {
      console.error('Socket connection error:', error);
    });

    // Re-register listeners after reconnect
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        this.socket?.on(event, callback as any);
      });
    });
  }

  /**
   * Disconnect from socket server
   */
  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.listeners.clear();
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Emit event to server
   */
  emit(event: string, data: any): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot emit:', event);
      return;
    }

    this.socket.emit(event, data);
  }

  /**
   * Listen to event
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    this.listeners.get(event)?.push(callback);
    this.socket?.on(event, callback as any);
  }

  /**
   * Remove listener
   */
  off(event: string, callback?: (data: any) => void): void {
    if (callback) {
      this.socket?.off(event, callback as any);
      const callbacks = this.listeners.get(event) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    } else {
      this.socket?.off(event);
      this.listeners.delete(event);
    }
  }

  // ==================== STUDENT EVENTS ====================

  /**
   * Join bus room for tracking
   */
  joinBusTracking(busId: string): void {
    this.emit('join:bus', { busId });
  }

  /**
   * Leave bus room
   */
  leaveBusTracking(busId: string): void {
    this.emit('leave:bus', { busId });
  }

  /**
   * Listen for bus location updates
   */
  onBusLocation(callback: (data: any) => void): void {
    this.on(SOCKET_EVENTS.STUDENT.BUS_LOCATION, callback);
  }

  /**
   * Listen for ETA updates
   */
  onETAUpdate(callback: (data: any) => void): void {
    this.on(SOCKET_EVENTS.STUDENT.ETA_UPDATE, callback);
  }

  /**
   * Listen for bus arrival
   */
  onBusArrival(callback: (data: any) => void): void {
    this.on(SOCKET_EVENTS.STUDENT.BUS_ARRIVAL, callback);
  }

  /**
   * Listen for pickup confirmation
   */
  onPickupConfirmed(callback: (data: any) => void): void {
    this.on(SOCKET_EVENTS.STUDENT.PICKUP_CONFIRMED, callback);
  }

  /**
   * Listen for attendance marked
   */
  onAttendanceMarked(callback: (data: any) => void): void {
    this.on(SOCKET_EVENTS.STUDENT.ATTENDANCE_MARKED, callback);
  }

  /**
   * Emit pin location (for students requesting pickup)
   */
  emitPinLocation(lat: number, lng: number, address?: string): void {
    this.emit('student:pin-location', { lat, lng, address });
  }

  /**
   * Emit cancel pin (for students cancelling pickup request)
   */
  emitCancelPin(pickupId?: string): void {
    this.emit('student:cancel-pin', { pickupId });
  }

  /**
   * Listen for pickup expiry
   */
  onPickupExpired(callback: (data: any) => void): void {
    this.on('pickup:expired', callback);
  }

  // ==================== DRIVER EVENTS ====================

  /**
   * Send location update (for drivers)
   */
  updateLocation(lat: number, lng: number, speed?: number): void {
    this.emit(SOCKET_EVENTS.DRIVER.LOCATION_UPDATE, {
      lat,
      lng,
      speed,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Accept pickup request (for drivers)
   */
  acceptPickup(pickupId: string): void {
    this.emit(SOCKET_EVENTS.DRIVER.PICKUP_ACCEPT, { pickupId });
  }

  /**
   * Reject pickup request (for drivers)
   */
  rejectPickup(pickupId: string, reason?: string): void {
    this.emit(SOCKET_EVENTS.DRIVER.PICKUP_REJECT, { pickupId, reason });
  }

  /**
   * Start trip (for drivers)
   */
  startTrip(tripId: string): void {
    this.emit(SOCKET_EVENTS.DRIVER.TRIP_START, { tripId });
  }

  /**
   * End trip (for drivers)
   */
  endTrip(tripId: string): void {
    this.emit(SOCKET_EVENTS.DRIVER.TRIP_END, { tripId });
  }

  /**
   * Listen for pickup clusters
   */
  onPickupClusters(callback: (data: any) => void): void {
    this.on(SOCKET_EVENTS.DRIVER.PICKUP_CLUSTER_UPDATED, callback);
  }

  /**
   * Listen for route optimization
   */
  onRouteOptimized(callback: (data: any) => void): void {
    this.on(SOCKET_EVENTS.DRIVER.ROUTE_OPTIMIZED, callback);
  }

  // ==================== COMMON EVENTS ====================

  /**
   * Listen for notifications
   */
  onNotification(callback: (data: any) => void): void {
    this.on(SOCKET_EVENTS.NOTIFICATION, callback);
  }
}

export const socketService = new SocketService();
export default socketService;
