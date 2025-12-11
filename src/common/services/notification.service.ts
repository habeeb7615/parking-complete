import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  /**
   * Send OTP via SMS/WhatsApp
   * @param mobileNumber - Mobile number to send OTP to
   * @param vehicleNumber - Vehicle plate number
   * @param otp - 6-digit OTP
   */
  async sendOTP(mobileNumber: string, vehicleNumber: string, otp: string): Promise<void> {
    if (!mobileNumber) {
      this.logger.warn(`Cannot send OTP: Mobile number is missing for vehicle ${vehicleNumber}`);
      return;
    }

    const message = `Your vehicle ${vehicleNumber} is parked.\nParking OTP: ${otp}`;

    try {
      // TODO: Integrate with actual SMS/WhatsApp service (Twilio, AWS SNS, etc.)
      // For now, log the message
      this.logger.log(`Sending OTP to ${mobileNumber}: ${message}`);
      
      // Placeholder for actual SMS/WhatsApp integration
      // Example: await this.smsService.send(mobileNumber, message);
      // Example: await this.whatsappService.send(mobileNumber, message);
      
      this.logger.log(`OTP sent successfully to ${mobileNumber} for vehicle ${vehicleNumber}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP to ${mobileNumber}: ${error.message}`, error.stack);
      // Don't throw error - OTP generation should not fail if SMS fails
      // The OTP is still saved in DB and can be used
    }
  }
}

