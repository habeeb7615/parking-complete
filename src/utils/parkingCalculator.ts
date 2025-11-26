export interface ParkingRates {
  upTo2Hours: number;
  upTo6Hours: number;
  upTo12Hours: number;
  upTo24Hours: number;
}

export interface ParkingCalculation {
  duration: {
    hours: number;
    minutes: number;
    seconds: number;
    totalHours: number;
    formatted: string; // HH:MM:SS format
  };
  amount: number;
  breakdown: string;
}

/**
 * Calculate parking duration and amount based on rates
 */
export function calculateParkingFee(
  checkInTime: string,
  checkOutTime: string,
  vehicleType: '2-wheeler' | '4-wheeler',
  rates: ParkingRates
): ParkingCalculation {
  const checkIn = new Date(checkInTime);
  const checkOut = new Date(checkOutTime);
  
  // Calculate duration in milliseconds
  const durationMs = checkOut.getTime() - checkIn.getTime();
  
  // Convert to hours, minutes, seconds
  const totalHours = durationMs / (1000 * 60 * 60);
  const hours = Math.floor(totalHours);
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
  
  // Format as HH:MM:SS
  const formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  // Calculate amount based on duration and vehicle type
  let amount = 0;
  let breakdown = '';
  
  if (totalHours <= 2) {
    amount = rates.upTo2Hours;
    breakdown = `Up to 2 hours: ₹${rates.upTo2Hours}`;
  } else if (totalHours <= 6) {
    amount = rates.upTo6Hours;
    breakdown = `Up to 6 hours: ₹${rates.upTo6Hours}`;
  } else if (totalHours <= 12) {
    amount = rates.upTo12Hours;
    breakdown = `Up to 12 hours: ₹${rates.upTo12Hours}`;
  } else if (totalHours <= 24) {
    amount = rates.upTo24Hours;
    breakdown = `Up to 24 hours: ₹${rates.upTo24Hours}`;
  } else {
    // For more than 24 hours, charge daily rate + hourly rate for additional time
    const days = Math.floor(totalHours / 24);
    const remainingHours = totalHours % 24;
    
    amount = (days * rates.upTo24Hours) + (remainingHours * (rates.upTo24Hours / 24));
    breakdown = `${days} day(s) × ₹${rates.upTo24Hours} + ${remainingHours.toFixed(1)}h × ₹${(rates.upTo24Hours / 24).toFixed(2)}/h = ₹${amount.toFixed(2)}`;
  }
  
  return {
    duration: {
      hours,
      minutes,
      seconds,
      totalHours,
      formatted
    },
    amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
    breakdown
  };
}

/**
 * Format duration in a human-readable way
 */
export function formatDuration(hours: number, minutes: number, seconds: number): string {
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Get default rates for testing
 */
export function getDefaultRates(vehicleType: '2-wheeler' | '4-wheeler'): ParkingRates {
  if (vehicleType === '2-wheeler') {
    return {
      upTo2Hours: 2,
      upTo6Hours: 5,
      upTo12Hours: 8,
      upTo24Hours: 12
    };
  } else {
    return {
      upTo2Hours: 5,
      upTo6Hours: 10,
      upTo12Hours: 18,
      upTo24Hours: 30
    };
  }
}
