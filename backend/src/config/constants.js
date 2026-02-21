export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  DRIVER: 'driver',
  VIEWER: 'viewer',
};

export const VEHICLE_STATUS = {
  AVAILABLE: 'available',
  IN_USE: 'in_use',
  MAINTENANCE: 'maintenance',
  RETIRED: 'retired',
};

export const DRIVER_STATUS = {
  AVAILABLE: 'available',
  ON_TRIP: 'on_trip',
  OFF_DUTY: 'off_duty',
  SUSPENDED: 'suspended',
};

export const TRIP_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DELAYED: 'delayed',
};

export const VEHICLE_TYPES = [
  'Truck',
  'Van',
  'Car',
  'Motorcycle',
  'Bus',
  'Pickup',
  'Trailer',
  'Heavy Equipment',
];

export const FUEL_TYPES = ['petrol', 'diesel', 'electric', 'hybrid', 'cng'];

export const MAINTENANCE_TYPES = [
  'Oil Change',
  'Tire Rotation',
  'Brake Inspection',
  'Engine Tune-up',
  'Transmission Service',
  'Battery Replacement',
  'Air Filter',
  'Coolant Flush',
  'Wheel Alignment',
  'General Inspection',
  'Other',
];

export const MAINTENANCE_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const EXPENSE_TYPES = [
  'Fuel',
  'Maintenance',
  'Toll',
  'Parking',
  'Insurance',
  'Registration',
  'Accident',
  'Other',
];

export const NOTIFICATION_TYPES = {
  TRIP_STARTED: 'trip_started',
  TRIP_COMPLETED: 'trip_completed',
  TRIP_DELAYED: 'trip_delayed',
  TRIP_CANCELLED: 'trip_cancelled',
  MAINTENANCE_DUE: 'maintenance_due',
  MAINTENANCE_OVERDUE: 'maintenance_overdue',
  DRIVER_ASSIGNED: 'driver_assigned',
  VEHICLE_STATUS_CHANGE: 'vehicle_status_change',
  FUEL_LOG_ADDED: 'fuel_log_added',
  EXPENSE_ADDED: 'expense_added',
  SYSTEM: 'system',
};

export const SOCKET_EVENTS = {
  // Connection
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  // Trip events
  TRIP_STATUS_UPDATED: 'trip_status_updated',
  TRIP_LOCATION_UPDATED: 'trip_location_updated',
  TRIP_CREATED: 'trip_created',
  // Notifications
  NEW_NOTIFICATION: 'new_notification',
  // System
  SYSTEM_ALERT: 'system_alert',
};

export const AUDIT_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGOUT: 'logout',
};
