export class PlateRecognitionService {
  private static readonly ANPR_API_URL = 'https://api.platerecognizer.com/v1/plate-reader/';
  private static readonly ANPR_TOKEN = 'e3fff7794f03b9d53f1a7c0bf42f2ea740e6f6bd'; // Replace with secure storage in prod

  static async extractPlateNumber(imageFile: File): Promise<{ success: boolean; plateNumber?: string; error?: string }> {
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

      if (!plateNumber) {
        return {
          success: false,
          error: 'Could not recognize plate number. Please try again with a clearer image.'
        };
      }

      // Convert plate number to uppercase
      const upperCasePlateNumber = plateNumber.toUpperCase();

      return {
        success: true,
        plateNumber: upperCasePlateNumber
      };

    } catch (error) {
      console.error('Plate recognition error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process image'
      };
    }
  }
}
