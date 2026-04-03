/**
 * STRcalc Phase 4: localStorage Persistence
 * =========================================
 * 
 * Saves analyses locally so users can:
 * - Save their current analysis
 * - Return to it later
 * - Compare multiple saved analyses
 * - Export saved analyses
 * 
 * STORAGE STRUCTURE:
 * 
 * localStorage['strcalc-analyses'] = {
 *   analyses: [
 *     {
 *       id: 'uuid-1234...',
 *       name: 'My First Property',
 *       timestamp: 1701449600000,
 *       formData: { all questionnaire data },
 *       scenarios: { hold, sell, exchange results },
 *       comparison: { comparison metrics }
 *     },
 *     ...more analyses...
 *   ]
 * }
 */

/**
 * Generate unique ID for each analysis
 */
function generateAnalysisId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Save Analysis to localStorage
 * ============================
 */
function saveAnalysis(name, formData, scenarios, comparison, threeWay = false) {
  try {
    // Get existing analyses
    const stored = localStorage.getItem('strcalc-analyses');
    const data = stored ? JSON.parse(stored) : { analyses: [] };

    // Create new analysis record
    const analysis = {
      id: generateAnalysisId(),
      name: name || `Analysis - ${new Date().toLocaleDateString()}`,
      timestamp: Date.now(),
      location: formData.location || 'Unknown Location',
      propertyValue: formData.currentValue,
      scenarioType: threeWay ? '3-way' : '2-way',
      formData: formData,
      scenarios: scenarios,
      comparison: comparison,
    };

    // Add to analyses array
    data.analyses.push(analysis);

    // Keep only last 50 analyses (to prevent storage bloat)
    if (data.analyses.length > 50) {
      data.analyses = data.analyses.slice(-50);
    }

    // Save to localStorage
    localStorage.setItem('strcalc-analyses', JSON.stringify(data));

    return analysis;
  } catch (error) {
    console.error('Error saving analysis:', error);
    // localStorage quota exceeded or other error
    if (error.name === 'QuotaExceededError') {
      alert('Storage limit reached. Please delete some saved analyses.');
    }
    return null;
  }
}

/**
 * Load All Analyses from localStorage
 * ==================================
 */
function loadAllAnalyses() {
  try {
    const stored = localStorage.getItem('strcalc-analyses');
    if (!stored) {
      return [];
    }

    const data = JSON.parse(stored);
    // Sort by timestamp (newest first)
    return (data.analyses || []).sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error loading analyses:', error);
    return [];
  }
}

/**
 * Load Single Analysis by ID
 * ==========================
 */
function loadAnalysis(id) {
  try {
    const stored = localStorage.getItem('strcalc-analyses');
    if (!stored) {
      return null;
    }

    const data = JSON.parse(stored);
    return data.analyses.find(a => a.id === id) || null;
  } catch (error) {
    console.error('Error loading analysis:', error);
    return null;
  }
}

/**
 * Delete Analysis by ID
 * ====================
 */
function deleteAnalysis(id) {
  try {
    const stored = localStorage.getItem('strcalc-analyses');
    if (!stored) {
      return false;
    }

    const data = JSON.parse(stored);
    const initialLength = data.analyses.length;

    data.analyses = data.analyses.filter(a => a.id !== id);

    if (data.analyses.length < initialLength) {
      localStorage.setItem('strcalc-analyses', JSON.stringify(data));
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error deleting analysis:', error);
    return false;
  }
}

/**
 * Update Analysis Name
 * ===================
 */
function updateAnalysisName(id, newName) {
  try {
    const stored = localStorage.getItem('strcalc-analyses');
    if (!stored) {
      return false;
    }

    const data = JSON.parse(stored);
    const analysis = data.analyses.find(a => a.id === id);

    if (analysis) {
      analysis.name = newName;
      localStorage.setItem('strcalc-analyses', JSON.stringify(data));
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error updating analysis:', error);
    return false;
  }
}

/**
 * Clear All Analyses
 * =================
 */
function clearAllAnalyses() {
  try {
    localStorage.removeItem('strcalc-analyses');
    return true;
  } catch (error) {
    console.error('Error clearing analyses:', error);
    return false;
  }
}

/**
 * Get Storage Statistics
 * =====================
 */
function getStorageStats() {
  try {
    const stored = localStorage.getItem('strcalc-analyses');
    const analyses = stored ? JSON.parse(stored).analyses : [];

    let totalSize = 0;
    if (stored) {
      totalSize = new Blob([stored]).size;
    }

    return {
      analysisCount: analyses.length,
      storageUsedKB: (totalSize / 1024).toFixed(2),
      oldestAnalysis: analyses.length > 0 ? new Date(Math.min(...analyses.map(a => a.timestamp))) : null,
      newestAnalysis: analyses.length > 0 ? new Date(Math.max(...analyses.map(a => a.timestamp))) : null,
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return {
      analysisCount: 0,
      storageUsedKB: 0,
      oldestAnalysis: null,
      newestAnalysis: null,
    };
  }
}

export {
  saveAnalysis,
  loadAllAnalyses,
  loadAnalysis,
  deleteAnalysis,
  updateAnalysisName,
  clearAllAnalyses,
  getStorageStats,
};
