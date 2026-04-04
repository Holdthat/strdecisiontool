// src/utils/StorageManager.js
// localStorage management for scenario persistence

export function saveAnalysis(name, formData, scenarios, comparison) {
  const analyses = loadAllAnalyses();
  
  const newAnalysis = {
    id: Date.now().toString(),
    name,
    timestamp: new Date().toISOString(),
    formData,
    scenarios,
    comparison
  };
  
  analyses.push(newAnalysis);
  
  if (analyses.length > 50) {
    analyses.shift();
  }
  
  localStorage.setItem('strinvestcalc-analyses', JSON.stringify(analyses));
  return newAnalysis;
}

export function loadAllAnalyses() {
  try {
    const data = localStorage.getItem('strinvestcalc-analyses');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading analyses:', error);
    return [];
  }
}

export function loadAnalysis(id) {
  const analyses = loadAllAnalyses();
  return analyses.find(a => a.id === id);
}

export function deleteAnalysis(id) {
  let analyses = loadAllAnalyses();
  analyses = analyses.filter(a => a.id !== id);
  localStorage.setItem('strinvestcalc-analyses', JSON.stringify(analyses));
}

export function updateAnalysisName(id, newName) {
  const analyses = loadAllAnalyses();
  const analysis = analyses.find(a => a.id === id);
  if (analysis) {
    analysis.name = newName;
    localStorage.setItem('strinvestcalc-analyses', JSON.stringify(analyses));
  }
}

export function clearAllAnalyses() {
  localStorage.removeItem('strinvestcalc-analyses');
}

export function getStorageStats() {
  const analyses = loadAllAnalyses();
  return {
    count: analyses.length,
    oldest: analyses.length > 0 ? analyses[0].timestamp : null,
    newest: analyses.length > 0 ? analyses[analyses.length - 1].timestamp : null
  };
}
