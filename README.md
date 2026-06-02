# Health-Risk Questionnaire Analytics Platform

## Aim
Develop a crowdsourced platform to study how people perceive their own health risks and how accurate those perceptions are compared with simple objective indicators.

## Data Collected
Demographics:
- Age band
- Gender
- Education
- Region

Lifestyle:
- Exercise
- Diet
- Stress
- Sleep

Health perception:
- Self-perceived diabetes risk (1–5)

Objective marker:
- BMI calculated from height and weight

Optional:
- Lifestyle description text (for LLM embeddings)

## Outputs
- Reliability label (aligned / overestimate / underestimate)
- Logistic regression analysis
- Bias analysis by demographics
- Optional LLM text embeddings

## Privacy
- No personal identifiers
- Random participant IDs
- Fully anonymised dataset