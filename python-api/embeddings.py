from sentence_transformers import SentenceTransformer
import numpy as np

model = None

def get_model():
    global model
    if model is None:
        model = SentenceTransformer('all-MiniLM-L6-v2')
    return model

def embed_texts(texts: list):
    if not texts:
        return {"embeddings": [], "count": 0}
    m = get_model()
    embeddings = m.encode(texts, convert_to_numpy=True)
    return {
        "count": len(texts),
        "embedding_dim": embeddings.shape[1],
        "embeddings": embeddings.tolist()
    }