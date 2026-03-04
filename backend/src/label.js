function computeBMI(height_cm, weight_kg) {
    const h = Number(height_cm) / 100;
    const w = Number(weight_kg);
    if (!h || !w || h <= 0 || w <= 0) return null;
    return w / (h * h);
  }
  
  function bucketObjectiveFromBMI(bmi) {
    if (bmi === null) return null;
    if (bmi < 25) return "low";
    if (bmi < 30) return "medium";
    return "high";
  }
  
  function bucketPerceived(perceived_diabetes_risk) {
    const r = Number(perceived_diabetes_risk);
    if (![1, 2, 3, 4, 5].includes(r)) return null;
    if (r <= 2) return "low";
    if (r === 3) return "medium";
    return "high";
  }
  
  function labelReliability(perceivedBucket, objectiveBucket) {
    if (!perceivedBucket || !objectiveBucket) return null;
  
    const order = { low: 0, medium: 1, high: 2 };
    const p = order[perceivedBucket];
    const o = order[objectiveBucket];
  
    if (p === o) return "aligned";
    if (p < o) return "underestimate";
    return "overestimate";
  }
  
  module.exports = {
    computeBMI,
    bucketObjectiveFromBMI,
    bucketPerceived,
    labelReliability,
  };