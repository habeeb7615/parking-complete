-- Migration: Add calculated_amount column to vehicles table
-- Description: Adds calculated_amount field for storing calculated parking fee based on duration and rates (for dashboard/reports)
-- Date: 2025-01-XX

ALTER TABLE vehicles 
ADD COLUMN calculated_amount DECIMAL(10,2) DEFAULT NULL 
COMMENT 'Calculated parking fee based on duration and rates (for dashboard/reports)';

