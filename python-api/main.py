from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from firebase_client import get_responses_df
from analytics import run_analysis, run_shap, run_bias, run_analysis_with_embeddings
from federated import simulate_federated
from embeddings import embed_texts
from llm_analysis import summarise_lifestyle_texts, analyse_single_response
from pydantic import BaseModel

class CommentRequest(BaseModel):
    lifestyle_text: str
    reliability_label: str
    bmi: float

app = FastAPI(title="Health Risk Analytics API", version="1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/")
def root():
    return {"status": "ok", "message": "Health Risk Analytics API"}

@app.get("/analysis")
def analysis():
    df = get_responses_df()
    return run_analysis(df)

@app.get("/analysis/augmented")
def analysis_augmented():
    df = get_responses_df()
    return run_analysis_with_embeddings(df)

@app.get("/shap")
def shap():
    df = get_responses_df()
    return run_shap(df)

@app.get("/bias")
def bias():
    df = get_responses_df()
    return run_bias(df)

@app.get("/fl/simulate")
def federated():
    df = get_responses_df()
    return simulate_federated(df)

@app.post("/embed")
def embed(texts: list[str]):
    return embed_texts(texts)



# Add these new endpoints
@app.get("/llm/themes")
def llm_themes():
    df = get_responses_df()
    if df.empty or 'lifestyle_text' not in df.columns:
        return {"error": "No data"}
    texts = df['lifestyle_text'].dropna().tolist()
    return summarise_lifestyle_texts(texts)

@app.post("/llm/comment")
def llm_comment(request: CommentRequest):
    return analyse_single_response(request.lifestyle_text, request.reliability_label, request.bmi)