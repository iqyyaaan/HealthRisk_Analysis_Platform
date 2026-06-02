import firebase_admin
from firebase_admin import credentials, firestore
import pandas as pd

cred = credentials.Certificate('serviceAccountKey.json')
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()

def get_responses_df():
    docs = db.collection('responses').stream()
    rows = [doc.to_dict() for doc in docs]
    if not rows:
        return pd.DataFrame()
    return pd.DataFrame(rows)