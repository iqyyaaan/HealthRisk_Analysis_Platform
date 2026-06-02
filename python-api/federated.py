import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
import pandas as pd

FEATURES = ['exercise_days', 'sleep_hours', 'stress_level', 'diet_quality', 'bmi']

def simulate_federated(df, n_hospitals=3):
    df = df.dropna(subset=FEATURES + ['reliability_label']).copy()
    for col in FEATURES:
        df[col] = pd.to_numeric(df[col], errors='coerce')
    df = df.dropna(subset=FEATURES)
    if len(df) < 15:
        return {"error": "Not enough data — need at least 15 responses"}
    df['is_aligned'] = (df['reliability_label'] == 'aligned').astype(int)
    X, y = df[FEATURES].values, df['is_aligned'].values
    splits = np.array_split(np.arange(len(df)), n_hospitals)
    coefs, intercepts, local_acc = [], [], []
    for idx in splits:
        m = LogisticRegression(max_iter=1000)
        m.fit(X[idx], y[idx])
        coefs.append(m.coef_[0])
        intercepts.append(m.intercept_[0])
        local_acc.append(round(accuracy_score(y[idx], m.predict(X[idx])), 3))
    global_coef = np.mean(coefs, axis=0)
    global_intercept = np.mean(intercepts)
    fed_preds = (X @ global_coef + global_intercept > 0).astype(int)
    central = LogisticRegression(max_iter=1000)
    central.fit(X, y)
    return {
        "n_hospitals": n_hospitals,
        "n_samples": len(df),
        "centralised_accuracy": round(accuracy_score(y, central.predict(X)), 3),
        "federated_accuracy": round(accuracy_score(y, fed_preds), 3),
        "local_accuracies": local_acc,
    }