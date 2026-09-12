# InternLoom Local Evidence Classifier (ML Component A)

The **Evidence Classifier** is a local, trained machine learning model that classifies a resume evidence span against a JD requirement into **Tiers 0–3** (Absent, Mentioned, Demonstrated, Measurable Impact), augmented with a deterministic validation safety layer.

## Architecture

1. **Feature Union**:
   - Word TF-IDF (1-2 ngrams, max 300 features)
   - Character TF-IDF (3-5 ngrams, max 400 features)
   - Dense NLP Features: Action verbs, metric patterns, quantified outcome composite, overlap ratio, bare skill list detection, numeric false positive filter.
2. **Classifier**: `LogisticRegression(class_weight='balanced', max_iter=1000, random_state=42)`
3. **Safety Layer**:
   - Zero overlap $\rightarrow$ Bounded to Tier 0.
   - Bare skill listing $\rightarrow$ Bounded to Tier 1.
   - Number without measurable outcome context $\rightarrow$ Bounded to Tier 2.

## Commands

```bash
# Train model on development seed dataset
python -m backend.ml.evidence.train

# Evaluate CV metrics & confusion matrix
python -m backend.ml.evidence.evaluate
```
