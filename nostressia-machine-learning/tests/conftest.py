"""Pytest configuration for compatibility helpers."""

import sys
import types

import numpy.core.numeric as np_core_numeric
import numpy.random._pickle as np_random_pickle
from sklearn._loss.loss import CyHalfBinomialLoss, HalfBinomialLoss


# Older persisted artifacts can reference a top-level ``_loss`` module.
# Provide a lightweight alias so joblib can unpickle those models across
# scikit-learn versions used in CI.
legacy_loss_module = types.ModuleType("_loss")
legacy_loss_module.CyHalfBinomialLoss = CyHalfBinomialLoss
legacy_loss_module.HalfBinomialLoss = HalfBinomialLoss
sys.modules.setdefault("_loss", legacy_loss_module)


# NumPy compatibility for artifacts that pickle the bit generator class object
# instead of its historical string key.
_original_bit_generator_ctor = np_random_pickle.__bit_generator_ctor


def _compat_bit_generator_ctor(bit_generator_name="MT19937"):
    if isinstance(bit_generator_name, type):
        bit_generator_name = bit_generator_name.__name__
    return _original_bit_generator_ctor(bit_generator_name)


np_random_pickle.__bit_generator_ctor = _compat_bit_generator_ctor


# NumPy compatibility alias for artifacts created with newer module paths.
sys.modules.setdefault("numpy._core.numeric", np_core_numeric)


import pytest


def pytest_collection_modifyitems(items):
    """Auto-assign ML test markers based on test file intent."""
    integration_files = {
        "test_model_artifacts.py",
        "test_inference_contracts.py",
        "test_notebook_execution_failures.py",
    }

    for item in items:
        filename = item.fspath.basename
        if filename in integration_files:
            item.add_marker(pytest.mark.integration)
        else:
            item.add_marker(pytest.mark.unit)
