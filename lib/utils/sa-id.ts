/**
 * Utility functions for South African ID number processing
 */

/**
 * Extracts date of birth from South African ID number
 * @param idNumber - 13-digit SA ID number
 * @returns Date in YYYY-MM-DD format or null if invalid
 */
export const extractDateOfBirthFromSAID = (idNumber: string): string | null => {
  if (!idNumber || idNumber.length !== 13) {
    return null;
  }

  // Extract YYMMDD from the first 6 digits
  const yearDigits = idNumber.substring(0, 2);
  const month = idNumber.substring(2, 4);
  const day = idNumber.substring(4, 6);

  // Convert YY to full year (assuming current century for years 00-30, previous century for 31-99)
  const currentYear = new Date().getFullYear();
  const currentCentury = Math.floor(currentYear / 100) * 100;
  const yearNumber = parseInt(yearDigits);

  let fullYear: number;
  if (yearNumber <= 30) {
    fullYear = currentCentury + yearNumber;
  } else {
    fullYear = currentCentury - 100 + yearNumber;
  }

  // Validate month and day
  const monthNumber = parseInt(month);
  const dayNumber = parseInt(day);

  if (monthNumber < 1 || monthNumber > 12 || dayNumber < 1 || dayNumber > 31) {
    return null;
  }

  // Create date and validate it exists (handles leap years, etc.)
  const date = new Date(fullYear, monthNumber - 1, dayNumber);
  if (
    date.getFullYear() !== fullYear ||
    date.getMonth() !== monthNumber - 1 ||
    date.getDate() !== dayNumber
  ) {
    return null;
  }

  // Return in YYYY-MM-DD format for HTML date input
  return `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

/**
 * Extracts gender from South African ID number
 * @param idNumber - 13-digit SA ID number
 * @returns 'M' for male, 'F' for female, or null if invalid
 */
export const extractGenderFromSAID = (idNumber: string): "M" | "F" | null => {
  if (!idNumber || idNumber.length !== 13) {
    return null;
  }

  // Gender is determined by the 7th digit (index 6)
  // 0-4 = Female, 5-9 = Male
  const genderDigit = parseInt(idNumber.charAt(6));

  if (isNaN(genderDigit)) {
    return null;
  }

  return genderDigit < 5 ? "F" : "M";
};

/**
 * Validates South African ID number format and checksum
 * @param idNumber - 13-digit SA ID number
 * @returns true if valid, false if invalid
 */
export const validateSAIDNumber = (idNumber: string): boolean => {
  if (!idNumber || idNumber.length !== 13 || !/^\d{13}$/.test(idNumber)) {
    return false;
  }

  // Luhn algorithm for checksum validation
  let sum = 0;
  let isSecond = false;

  // Process digits from right to left (excluding the last check digit)
  for (let i = idNumber.length - 2; i >= 0; i--) {
    let digit = parseInt(idNumber.charAt(i));

    if (isSecond) {
      digit *= 2;
      if (digit > 9) {
        digit = (digit % 10) + Math.floor(digit / 10);
      }
    }

    sum += digit;
    isSecond = !isSecond;
  }

  // Calculate check digit
  const checkDigit = (10 - (sum % 10)) % 10;
  const lastDigit = parseInt(idNumber.charAt(idNumber.length - 1));

  return checkDigit === lastDigit;
};
