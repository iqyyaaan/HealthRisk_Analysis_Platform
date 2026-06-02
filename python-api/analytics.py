import pandas as pd
import numpy as np
import shap

from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.decomposition import PCA

from embeddings import get_model

# ADD: new clinical and FINDRISC fields alongside existing features
FEATURES = [
    'exercise_days', 'sleep_hours', 'stress_level', 'diet_quality', 'bmi',
    'findrisc_score', 'bp_medication', 'high_glucose_history', 'family_history',
]


def prepare(df):
    df = df.copy()

    # ADD: cast boolean clinical fields to int before any other processing
    # default to 0 for old responses that don't have these fields yet
    for col in ['bp_medication', 'high_glucose_history', 'family_history']:
        if col in df.columns:
            df[col] = df[col].astype(int)
        else:
            df[col] = 0

    # ADD: default findrisc_score to 0 for old responses without it
    if 'findrisc_score' not in df.columns:
        df['findrisc_score'] = 0

    # EXISTING: everything below unchanged
    df = df.dropna(subset=['reliability_label']).copy()
    df['is_aligned'] = (df['reliability_label'] == 'aligned').astype(int)

    # Use only features that exist in df
    available_features = [f for f in FEATURES if f in df.columns]
    for col in available_features:
        df[col] = pd.to_numeric(df[col], errors='coerce')

    return df.dropna(subset=available_features)


def run_analysis(df):
    if len(df) < 10:
        return {"error": "Not enough data yet", "count": len(df)}

    df = prepare(df)

    # Use only features available in this dataset
    available_features = [f for f in FEATURES if f in df.columns]

    X, y = df[available_features], df['is_aligned']

    if len(y.unique()) < 2:
        return {"error": "Need at least 2 classes in reliability_label"}

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = LogisticRegression(max_iter=1000)
    model.fit(X_train, y_train)

    return {
        "model_type": "numeric_only_logistic_regression",
        "total_responses": len(df),
        "accuracy": round(accuracy_score(y_test, model.predict(X_test)), 3),
        "label_distribution": df['reliability_label'].value_counts().to_dict(),
        "feature_coefficients": dict(zip(available_features, model.coef_[0].tolist())),
    }


def run_shap(df):
    if len(df) < 10:
        return {"error": "Not enough data"}

    df = prepare(df)

    available_features = [f for f in FEATURES if f in df.columns]

    X, y = df[available_features], df['is_aligned']

    if len(y.unique()) < 2:
        return {"error": "Need at least 2 classes in reliability_label"}

    model = LogisticRegression(max_iter=1000)
    model.fit(X, y)

    explainer = shap.LinearExplainer(model, X, feature_perturbation="interventional")
    vals = explainer.shap_values(X)

    return {
        "features": available_features,
        "mean_abs_shap": np.abs(vals).mean(axis=0).tolist()
    }


def run_bias(df):
    if len(df) < 10:
        return {"error": "Not enough data"}

    results = {}
    for col in ['age_band', 'gender', 'education']:
        if col in df.columns:
            grouped = df.groupby(col)['reliability_label'].value_counts(normalize=True).unstack(fill_value=0)
            results[col] = grouped.round(3).to_dict(orient='index')
    return results


def run_analysis_with_embeddings(df):
    if len(df) < 15:
        return {"error": "Need at least 15 responses for embedding-augmented analysis", "count": len(df)}

    df = prepare(df).copy()
    df['lifestyle_text'] = df.get('lifestyle_text', '').fillna('').astype(str)

    df = df[df['lifestyle_text'].str.strip().str.len() >= 10].copy()

    if len(df) < 10:
        return {"error": "Not enough meaningful lifestyle_text responses"}

    available_features = [f for f in FEATURES if f in df.columns]
    X_num = df[available_features].copy()
    y = df['is_aligned']

    if len(y.unique()) < 2:
        return {"error": "Need at least 2 classes in reliability_label"}

    model_embed = get_model()
    embeddings = model_embed.encode(df['lifestyle_text'].tolist(), convert_to_numpy=True)

    n_components = min(8, embeddings.shape[0] - 1, embeddings.shape[1])
    if n_components < 2:
        return {"error": "Not enough text samples to reduce embeddings"}

    pca = PCA(n_components=n_components, random_state=42)
    emb_reduced = pca.fit_transform(embeddings)

    emb_cols = [f'embedding_pc_{i+1}' for i in range(n_components)]
    X_emb = pd.DataFrame(emb_reduced, columns=emb_cols, index=df.index)

    X_aug = pd.concat([X_num.reset_index(drop=True), X_emb.reset_index(drop=True)], axis=1)

    X_train, X_test, y_train, y_test = train_test_split(
        X_aug, y.reset_index(drop=True), test_size=0.2, random_state=42, stratify=y
    )

    model = LogisticRegression(max_iter=2000)
    model.fit(X_train, y_train)
    preds = model.predict(X_test)

    coefs = dict(zip(X_aug.columns, model.coef_[0].tolist()))

    return {
        "model_type": "embedding_augmented_logistic_regression",
        "total_responses_used": int(len(df)),
        "numeric_features": available_features,
        "embedding_components_used": n_components,
        "accuracy": round(accuracy_score(y_test, preds), 3),
        "explained_variance_ratio": pca.explained_variance_ratio_.round(4).tolist(),
        "top_coefficients": dict(
            sorted(coefs.items(), key=lambda x: abs(x[1]), reverse=True)[:10]
        ),
    }