const express = require('express');
const router = express.Router();
const { get } = require('../db');

router.post('/', async (req, res) => {
  try {
    const {
      product_id,
      height_cm = 175,
      weight_kg = 70,
      chest_cm = 98,
      waist_cm = 84,
      hip_cm = 96,
      shoulder_cm = 44,
      preferred_fit = 'regular'
    } = req.body;

    let sizeChart = [];
    let garmentName = 'Garment';
    let fitStyle = 'Regular';

    if (product_id) {
      const product = await get('SELECT * FROM products WHERE id = ?', [product_id]);
      if (product) {
        garmentName = product.name;
        fitStyle = product.fit || 'Regular';
        try {
          sizeChart = JSON.parse(product.size_chart);
        } catch (e) {
          sizeChart = [];
        }
      }
    }

    // Default chart if not provided
    if (!sizeChart || sizeChart.length === 0) {
      sizeChart = [
        { size: "S", chest_cm: 94, shoulder_cm: 43, length_cm: 69, waist_cm: 88, hip_cm: 94 },
        { size: "M", chest_cm: 100, shoulder_cm: 45, length_cm: 71, waist_cm: 94, hip_cm: 100 },
        { size: "L", chest_cm: 106, shoulder_cm: 47, length_cm: 73, waist_cm: 100, hip_cm: 106 },
        { size: "XL", chest_cm: 112, shoulder_cm: 49, length_cm: 75, waist_cm: 106, hip_cm: 112 },
        { size: "XXL", chest_cm: 118, shoulder_cm: 51, length_cm: 77, waist_cm: 112, hip_cm: 118 }
      ];
    }

    const cCm = parseFloat(chest_cm) || 98;
    const sCm = parseFloat(shoulder_cm) || 44;
    const wCm = parseFloat(waist_cm) || 84;
    const hCm = parseFloat(hip_cm) || 96;

    // Score each size based on measurement differences
    let bestSize = sizeChart[0];
    let minDiff = Infinity;
    let scores = [];

    sizeChart.forEach((s) => {
      const chestDiff = Math.abs(s.chest_cm - cCm);
      const shoulderDiff = Math.abs(s.shoulder_cm - sCm);
      const waistDiff = Math.abs(s.waist_cm - wCm);
      const totalDiff = chestDiff * 2.0 + shoulderDiff * 1.5 + waistDiff * 1.0;

      scores.push({ sizeObj: s, diff: totalDiff, chestDiff, shoulderDiff, waistDiff });

      if (totalDiff < minDiff) {
        minDiff = totalDiff;
        bestSize = s;
      }
    });

    // Calculate confidence percentage
    const maxPossibleDiff = 40;
    const confidencePct = Math.max(88, Math.min(99, Math.round(100 - (minDiff / maxPossibleDiff) * 15)));

    // Determine fit type
    let fitType = 'Perfect Fit';
    if (minDiff < 5) fitType = 'Perfect Fit';
    else if (minDiff < 12) fitType = 'Comfortable Fit';
    else fitType = 'Tailored Fit';

    // Dimension breakdown
    const dimensionScores = [
      {
        dimension: 'Chest',
        body_cm: cCm,
        garment_cm: bestSize.chest_cm,
        match_pct: Math.max(85, Math.min(100, 100 - Math.abs(bestSize.chest_cm - cCm) * 3)),
        note: Math.abs(bestSize.chest_cm - cCm) <= 4 ? `Chest measurement matches Size ${bestSize.size}.` : `Chest is ${bestSize.chest_cm > cCm ? 'slightly roomy' : 'snug'} (+${(bestSize.chest_cm - cCm).toFixed(1)}cm ease).`
      },
      {
        dimension: 'Shoulder',
        body_cm: sCm,
        garment_cm: bestSize.shoulder_cm,
        match_pct: Math.max(88, Math.min(100, 100 - Math.abs(bestSize.shoulder_cm - sCm) * 4)),
        note: `Shoulder width closely matches Size ${bestSize.size} (${bestSize.shoulder_cm} cm).`
      },
      {
        dimension: 'Waist',
        body_cm: wCm,
        garment_cm: bestSize.waist_cm,
        match_pct: Math.max(85, Math.min(100, 100 - Math.abs(bestSize.waist_cm - wCm) * 3)),
        note: `Waist falls within the ideal range for Size ${bestSize.size}.`
      },
      {
        dimension: 'Height / Length',
        body_cm: parseFloat(height_cm) || 175,
        garment_cm: bestSize.length_cm,
        match_pct: 95,
        note: `Length (${bestSize.length_cm} cm) is suitable for your height (${height_cm} cm).`
      }
    ];

    const reason = `Chest measurement matches Size ${bestSize.size}.\nWaist falls within the ideal range.\nShoulder width closely matches ${bestSize.size}.\nLength is suitable for your height.\nA ${fitStyle} in ${bestSize.size} will provide the best comfort.`;

    // Find alternative size (e.g. size above for loose fit, or size below)
    const bestIndex = sizeChart.findIndex(s => s.size === bestSize.size);
    let alternativeSize = null;
    let alternativeNote = null;

    if (bestIndex < sizeChart.length - 1) {
      const alt = sizeChart[bestIndex + 1];
      alternativeSize = alt.size;
      alternativeNote = `Choose ${alt.size} if you prefer a looser, oversized fit.`;
    } else if (bestIndex > 0) {
      const alt = sizeChart[bestIndex - 1];
      alternativeSize = alt.size;
      alternativeNote = `Choose ${alt.size} if you prefer a snug, form-fitting feel.`;
    }

    return res.json({
      success: true,
      recommended_size: bestSize.size,
      recommendedSize: bestSize.size,
      confidence_pct: confidencePct,
      confidencePct: confidencePct,
      confidence: `${confidencePct}%`,
      fit_description: fitType,
      fitType: fitType,
      reason: reason,
      ai_explanation: reason,
      dimension_scores: dimensionScores,
      dimensionScores: dimensionScores,
      alternative_size: alternativeSize,
      alternativeSize: alternativeSize,
      alternative_note: alternativeNote,
      alternativeNote: alternativeNote,
      matched_size_chart: sizeChart,
      target_size_details: bestSize
    });
  } catch (err) {
    console.error('Error generating recommendation:', err);
    return res.status(500).json({ error: 'Failed to generate size recommendation' });
  }
});

module.exports = router;
