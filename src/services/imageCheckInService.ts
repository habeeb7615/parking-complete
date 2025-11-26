
export interface ImageCheckInData {
  parkingLocationId: string;
  contractor_id: string;
  vehicle_type: '2W' | '4W';
  image: File;
}

export interface ImageCheckInResponse {
  success: boolean;
  vehicleId?: string;
  vehicleNumber?: string;
  receiptId?: string;
  imageUrl?: string;
  message?: string;
  error?: string;
}

export class ImageCheckInService {
  private static readonly ANPR_API_URL = 'https://api.platerecognizer.com/v1/plate-reader/';
  private static readonly ANPR_TOKEN = 'e3fff7794f03b9d53f1a7c0bf42f2ea740e6f6bd'; // Replace with secure storage in prod

  static async checkInWithImage(data: ImageCheckInData): Promise<ImageCheckInResponse> {
    try {
      // Step 1: Call ANPR API to extract plate number
      const plateNumber = await this.extractPlateNumber(data.image);
      
      if (!plateNumber) {
        return {
          success: false,
          error: 'Could not recognize plate number. Please try again with a clearer image.'
        };
      }

      // Step 2: Save vehicle record to database (without image)
      const vehicle = await this.saveVehicleRecord({
        plate_number: plateNumber,
        vehicle_type: data.vehicle_type === '2W' ? '2-wheeler' : '4-wheeler',
        location_id: data.parkingLocationId,
        contractor_id: data.contractor_id,
        receipt_id: `RCPT-${Date.now()}`
      });

      return {
        success: true,
        vehicleId: vehicle.id,
        vehicleNumber: plateNumber,
        receiptId: vehicle.receipt_id,
        message: 'Vehicle checked in successfully with license plate recognition'
      };

    } catch (error) {
      console.error('Image check-in error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process image check-in'
      };
    }
  }


  private static async extractPlateNumber(imageFile: File): Promise<string | null> {
    try {
      // Create FormData for ANPR API
      const formData = new FormData();
      formData.append('upload', imageFile);

      // Call ANPR API
      const response = await fetch(this.ANPR_API_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Token ${this.ANPR_TOKEN}`
        }
      });

      if (!response.ok) {
        throw new Error(`ANPR API Error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('ANPR Response:', data);

      // Extract plate number from response
      const plateNumber = data.results?.[0]?.plate || null;
      return plateNumber;

    } catch (error) {
      console.error('ANPR API error:', error);
      throw new Error('Failed to process image with ANPR API');
    }
  }

  private static async saveVehicleRecord(vehicleData: {
    plate_number: string;
    vehicle_type: string;
    location_id: string;
    contractor_id: string;
    receipt_id: string;
  }) {
    try {
      const { data: vehicle, error } = await supabase
        .from('vehicles')
        .insert({
          plate_number: vehicleData.plate_number,
          vehicle_type: vehicleData.vehicle_type,
          location_id: vehicleData.location_id,
          contractor_id: vehicleData.contractor_id,
          check_in_time: new Date().toISOString(),
          status: 'checked_in',
          receipt_id: vehicleData.receipt_id,
          created_by: vehicleData.contractor_id, // You might want to get this from auth
          created_on: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return vehicle;
    } catch (error) {
      console.error('Database save error:', error);
      throw new Error('Failed to save vehicle record');
    }
  }
}
