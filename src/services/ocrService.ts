import Tesseract from 'tesseract.js';

export class OCRService {
  static async extractTextFromImage(imageData: string): Promise<string> {
    try {
      const { data: { text } } = await Tesseract.recognize(
        imageData,
        'eng',
        {
          logger: m => console.log(m)
        }
      );
      
      return text.trim();
    } catch (error) {
      console.error('OCR Error:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  static extractPlateNumber(text: string): string {
    // Remove extra whitespace and newlines
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    // Common plate number patterns
    const patterns = [
      // Indian format: AB12CD1234, AB12C1234, AB12CD123
      /[A-Z]{2}\d{2}[A-Z]{1,2}\d{3,4}/g,
      // US format: ABC-1234, ABC1234
      /[A-Z]{3}[-]?\d{4}/g,
      // Generic alphanumeric with 6-8 characters
      /[A-Z0-9]{6,8}/g,
      // Any sequence with letters and numbers
      /[A-Z]+[0-9]+[A-Z0-9]*/g
    ];

    for (const pattern of patterns) {
      const matches = cleanText.match(pattern);
      if (matches && matches.length > 0) {
        // Return the first match that looks like a plate number
        return matches[0].replace(/[- ]/g, '').toUpperCase();
      }
    }

    // If no pattern matches, return the first alphanumeric sequence
    const alphanumericMatch = cleanText.match(/[A-Z0-9]{4,}/);
    if (alphanumericMatch) {
      return alphanumericMatch[0].toUpperCase();
    }

    return cleanText;
  }

  static async processPlateImage(imageData: string): Promise<string> {
    try {
      const extractedText = await this.extractTextFromImage(imageData);
      const plateNumber = this.extractPlateNumber(extractedText);
      
      console.log('Extracted text:', extractedText);
      console.log('Plate number:', plateNumber);
      
      return plateNumber;
    } catch (error) {
      console.error('Plate processing error:', error);
      throw error;
    }
  }
}
