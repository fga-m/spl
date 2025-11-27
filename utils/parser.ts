import { SplDataPoint, AnalysisStats, SafetyLevel } from '../types';

/**
 * Parses raw text content from an SPL log file.
 * Supports standard REW text export formats and generic CSVs with Timestamps.
 */
export const parseSplLog = (content: string): { data: SplDataPoint[], stats: AnalysisStats } => {
  const lines = content.split(/\r?\n/);
  const data: SplDataPoint[] = [];
  
  // Regex for HH:MM:SS (optional milliseconds)
  const timeRegex = /(\d{1,2}:\d{2}:\d{2}(?:\.\d+)?)/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Clean quotes which might be present in CSV formats
    const cleanLine = trimmed.replace(/["']/g, '');

    // Split by comma, tab, or space to handle various delimiters
    const parts = cleanLine.split(/[\s,;\t]+/).filter(p => p !== '');
    
    // We need at least 2 parts (Time and Value)
    if (parts.length < 2) continue;

    let timeStr: string | null = null;
    let splValue: number | null = null;

    // Strategy: 
    // 1. Find the first part that looks like a timestamp.
    for (const part of parts) {
      if (!timeStr && timeRegex.test(part)) {
        timeStr = part;
      }
    }

    // 2. Find a valid SPL value (number between 20 and 160)
    // Iterate backwards to find the value (usually the last column)
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i];
      // Skip the timestamp part if it was already identified or looks like one
      if (part === timeStr || part.includes(':')) continue;

      // Handle comma decimals (e.g. 85,5 -> 85.5) for European formats
      const normalizedPart = part.replace(',', '.');
      
      if (!isNaN(parseFloat(normalizedPart))) {
         const val = parseFloat(normalizedPart);
         // Heuristic: SPL values are typically between 30 and 150 dB. 
         // This filters out index numbers (1, 2, 3), small integers, or year numbers.
         if (val > 20 && val < 160) {
            splValue = val;
            break;
         }
      }
    }

    if (timeStr && splValue !== null) {
        // Handle time parsing safely
        try {
            const [h, m, s] = timeStr.split(':').map(parseFloat);
            const currentSeconds = h * 3600 + m * 60 + s;
            
            data.push({
              timestamp: timeStr.split('.')[0], // Remove milliseconds for display
              seconds: currentSeconds,
              value: splValue,
            });
        } catch (e) {
            // Ignore malformed time
        }
    }
  }

  if (data.length === 0) {
    throw new Error("No valid SPL data found. Please ensure the file is a text log containing timestamps (HH:MM:SS) and valid dB values.");
  }

  // --- Stats Calculation ---

  // Sort data by time to ensure chart and duration are correct
  const sortedByTime = [...data].sort((a, b) => a.seconds - b.seconds);

  const totalSpl = data.reduce((acc, curr) => acc + curr.value, 0);
  const averageSpl = totalSpl / data.length;
  
  // Sort by value to find peaks
  const sortedByValue = [...data].sort((a, b) => b.value - a.value);
  
  // Identify Top 3 Distinct Loudest Moments
  // We apply a 5-minute (300 seconds) buffer around each identified peak 
  // to ensure we capture distinct events rather than consecutive seconds of the same event.
  const top3Loudest: SplDataPoint[] = [];
  const bufferSeconds = 300;

  for (const candidate of sortedByValue) {
    // Stop if we have found 3 peaks
    if (top3Loudest.length >= 3) break;

    // Check if this candidate is too close (in time) to any already selected peak
    const isTooClose = top3Loudest.some(existing => 
      Math.abs(existing.seconds - candidate.seconds) < bufferSeconds
    );

    // If it is a distinct moment, add it
    if (!isTooClose) {
      top3Loudest.push(candidate);
    }
  }
  
  const maxSpl = sortedByValue[0].value;
  const minSpl = sortedByValue[sortedByValue.length - 1].value;

  // Max SPL before 10 AM (00:00:00 to 09:59:59)
  let maxSplBefore10am: SplDataPoint | null = null;
  let maxValBefore10 = -Infinity;

  for (const point of data) {
    const hour = parseInt(point.timestamp.split(':')[0], 10);
    // Strictly less than 10 (0-9)
    if (hour < 10) {
      if (point.value > maxValBefore10) {
        maxValBefore10 = point.value;
        maxSplBefore10am = point;
      }
    }
  }
  
  // Duration calculation with simple midnight wrapping handling
  let durationSeconds = sortedByTime[sortedByTime.length - 1].seconds - sortedByTime[0].seconds;
  if (durationSeconds < 0) durationSeconds += 24 * 3600; 

  const durH = Math.floor(durationSeconds / 3600);
  const durM = Math.floor((durationSeconds % 3600) / 60);
  const durationString = `${durH}h ${durM}m`;

  // Safety Assessment based on Average SPL
  let safetyLevel: SafetyLevel = 'Safe';
  if (averageSpl > 95) {
      safetyLevel = 'High Risk';
  } else if (averageSpl > 85) {
      safetyLevel = 'Moderate';
  }

  return {
    data: sortedByTime,
    stats: {
      averageSpl,
      maxSpl,
      minSpl,
      maxSplBefore10am,
      top3Loudest,
      totalSamples: data.length,
      durationString,
      safetyLevel
    }
  };
};

export const downsampleData = (data: SplDataPoint[], targetCount: number = 2000): SplDataPoint[] => {
  if (data.length <= targetCount) return data;
  const step = Math.ceil(data.length / targetCount);
  return data.filter((_, index) => index % step === 0);
};

export const extractMetadataFromFilename = (filename: string): { eventName: string, eventDate: string } => {
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
  let eventName = nameWithoutExt;
  let eventDate = "Unknown Date";

  // Regex for YYYYMMDD (e.g., 20250918) - looks for 20xx or 19xx followed by valid month/day
  const dateRegex = /(20\d{2}|19\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])/;
  const match = nameWithoutExt.match(dateRegex);

  if (match) {
    const [fullMatch, year, month, day] = match;
    eventDate = `${year}-${month}-${day}`;
    // Remove the date from the name to clean up the event name
    eventName = nameWithoutExt.replace(fullMatch, '').trim();
    // Remove leading/trailing hyphens or underscores that might have connected the date
    eventName = eventName.replace(/^[-_]+|[-_]+$/g, '').trim();
  }

  // Fallback if eventName became empty (e.g. filename was just the date)
  if (!eventName) {
      eventName = nameWithoutExt;
  }
  
  return { eventName, eventDate };
};
