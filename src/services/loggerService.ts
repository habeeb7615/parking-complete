
export interface LogEntry {
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  details?: string;
  user_id?: string;
  action: string;
  resource: string;
}

class LoggerService {
  private async insertLog(log: LogEntry): Promise<void> {
    try {
      // Try to insert into system_logs table
      const { error } = await supabase
        .from('system_logs')
        .insert({
          level: log.level,
          message: log.message,
          details: log.details,
          user_id: log.user_id,
          action: log.action,
          resource: log.resource,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.warn('Failed to insert log into database:', error);
        // Fallback to console logging
        console.log(`[${log.level.toUpperCase()}] ${log.message}`, log.details);
      }
    } catch (error) {
      console.warn('Logger service error:', error);
      // Fallback to console logging
      console.log(`[${log.level.toUpperCase()}] ${log.message}`, log.details);
    }
  }

  info(message: string, details?: string, action?: string, resource?: string, user_id?: string) {
    this.insertLog({
      level: 'info',
      message,
      details,
      action: action || 'info',
      resource: resource || 'system',
      user_id
    });
  }

  success(message: string, details?: string, action?: string, resource?: string, user_id?: string) {
    this.insertLog({
      level: 'success',
      message,
      details,
      action: action || 'success',
      resource: resource || 'system',
      user_id
    });
  }

  warning(message: string, details?: string, action?: string, resource?: string, user_id?: string) {
    this.insertLog({
      level: 'warning',
      message,
      details,
      action: action || 'warning',
      resource: resource || 'system',
      user_id
    });
  }

  error(message: string, details?: string, action?: string, resource?: string, user_id?: string) {
    this.insertLog({
      level: 'error',
      message,
      details,
      action: action || 'error',
      resource: resource || 'system',
      user_id
    });
  }

  // Specific logging methods for common actions
  logVehicleCheckin(plateNumber: string, locationId: string, user_id?: string) {
    this.info(
      `Vehicle ${plateNumber} checked in`,
      `Vehicle registered at location ${locationId}`,
      'vehicle_checkin',
      'vehicles',
      user_id
    );
  }

  logVehicleCheckout(plateNumber: string, paymentAmount: number, user_id?: string) {
    this.success(
      `Vehicle ${plateNumber} checked out`,
      `Payment received: ₹${paymentAmount}`,
      'vehicle_checkout',
      'vehicles',
      user_id
    );
  }

  logContractorCreate(companyName: string, user_id?: string) {
    this.info(
      `Contractor ${companyName} registered`,
      'New contractor added to the system',
      'contractor_create',
      'contractors',
      user_id
    );
  }

  logAttendantCreate(attendantName: string, user_id?: string) {
    this.info(
      `Attendant ${attendantName} added`,
      'New attendant registered',
      'attendant_create',
      'attendants',
      user_id
    );
  }

  logLocationCreate(locationName: string, user_id?: string) {
    this.info(
      `Location ${locationName} created`,
      'New parking location added',
      'location_create',
      'locations',
      user_id
    );
  }

  logPaymentReceived(amount: number, method: string, user_id?: string) {
    this.success(
      `Payment received: ₹${amount}`,
      `Payment method: ${method}`,
      'payment_received',
      'payments',
      user_id
    );
  }

  logSystemError(error: string, details?: string) {
    this.error(
      `System error: ${error}`,
      details,
      'system_error',
      'system'
    );
  }

  logUserLogin(userName: string, role: string) {
    this.info(
      `User ${userName} logged in`,
      `Role: ${role}`,
      'user_login',
      'authentication'
    );
  }

  logUserLogout(userName: string) {
    this.info(
      `User ${userName} logged out`,
      'User session ended',
      'user_logout',
      'authentication'
    );
  }
}

export const logger = new LoggerService();
