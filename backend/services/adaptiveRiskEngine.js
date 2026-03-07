export const calculateRisk = (trustScore, behaviorRisk, threatScore, driftFlag) => {

    const trustComponent = (100 - trustScore) * 0.4;
    const threatComponent = threatScore * 0.4;
    const behaviorComponent = behaviorRisk * 0.2;

    const driftPenalty = driftFlag ? 10 : 0;

    const finalRisk =
        trustComponent +
        threatComponent +
        behaviorComponent +
        driftPenalty;

    let riskLevel = "LOW";
    let action = "ALLOW";

    if (finalRisk > 80) {
        riskLevel = "CRITICAL";
        action = "BLOCK_SESSION";
    } 
    else if (finalRisk > 60) {
        riskLevel = "HIGH";
        action = "RESTRICT_ACTIONS";
    } 
    else if (finalRisk > 30) {
        riskLevel = "MEDIUM";
        action = "VERIFY_USER";
    }

    return {
        risk_score: Math.round(finalRisk),
        risk_level: riskLevel,
        action: action
    };
};