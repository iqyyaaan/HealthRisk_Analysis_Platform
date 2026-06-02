from openai import OpenAI
import os

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

def summarise_lifestyle_texts(texts: list[str]) -> dict:
    """Takes a list of lifestyle text responses and returns themes/summary."""
    if not texts:
        return {"error": "No texts provided"}
    
    clean_texts = [t for t in texts if t and len(t.strip()) > 10]
    if not clean_texts:
        return {"error": "No meaningful text responses found"}
    
    combined = "\n".join([f"- {t}" for t in clean_texts[:50]])  # cap at 50 for cost
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # cheapest, fast
        messages=[
            {
                "role": "system",
                "content": "You are a health researcher analysing anonymous lifestyle descriptions from a public health survey. Be concise and academic."
            },
            {
                "role": "user",
                "content": f"""Analyse these {len(clean_texts)} anonymous lifestyle descriptions from a health risk perception study.

{combined}

Return a JSON object with:
1. "themes": list of 3-5 common themes you notice
2. "summary": 2-3 sentence academic summary
3. "health_indicators": list of positive and negative health behaviours mentioned
4. "sample_count": number of responses analysed"""
            }
        ],
        response_format={"type": "json_object"},
        temperature=0.3,
    )
    
    import json
    return json.loads(response.choices[0].message.content)


def analyse_single_response(lifestyle_text: str, reliability_label: str, bmi: float) -> dict:
    """Generates a personalised AI comment for a single user's result."""
    if not lifestyle_text or len(lifestyle_text.strip()) < 5:
        return {"comment": None}
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "You are a supportive health researcher giving brief, non-clinical feedback on a health survey response. Keep it positive, informative, and under 60 words. Never give medical advice."
            },
            {
                "role": "user",
                "content": f"""Survey participant wrote: "{lifestyle_text}"
Their BMI is {bmi:.1f} and their health perception reliability label is "{reliability_label}".

Give a brief, encouraging observation about their lifestyle description. Do not mention BMI directly. End with one actionable suggestion."""
            }
        ],
        temperature=0.5,
        max_tokens=100,
    )
    
    return {"comment": response.choices[0].message.content.strip()}