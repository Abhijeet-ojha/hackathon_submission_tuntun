import numpy as np
from typing import List, Tuple, Dict, Any


def create_pairwise_dataset(
    candidate_features_map: Dict[str, np.ndarray],
    preference_pairs: List[Tuple[str, str, int]]
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Transforms candidate feature vectors into pairwise difference vectors for ranking.
    For pair (A, B) with preference 1 (A > B):
      X_pos = feat(A) - feat(B), y = 1
      X_neg = feat(B) - feat(A), y = 0  (symmetrized)
    """
    X_list = []
    y_list = []

    for cand_a_id, cand_b_id, pref in preference_pairs:
        feat_a = candidate_features_map.get(cand_a_id)
        feat_b = candidate_features_map.get(cand_b_id)
        if feat_a is None or feat_b is None:
            continue

        diff = feat_a - feat_b
        if pref == 1:
            X_list.append(diff)
            y_list.append(1)
            X_list.append(-diff)
            y_list.append(0)
        elif pref == 0:
            X_list.append(diff)
            y_list.append(0)
            X_list.append(-diff)
            y_list.append(1)

    if not X_list:
        return np.empty((0, 15), dtype=np.float32), np.empty((0,), dtype=np.int32)

    return np.array(X_list, dtype=np.float32), np.array(y_list, dtype=np.int32)
