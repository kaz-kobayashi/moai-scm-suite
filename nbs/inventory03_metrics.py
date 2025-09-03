"""Compatibility wrapper for 03inventory notebooks.

This module re-exports inventory simulation and analytics functions from
`src/scmopt/inventory/metrics.py` so that existing notebooks can import from
`nbs.inventory03_metrics` without changes.
"""
from __future__ import annotations

# Re-export functions from the refactored library
from src.scmopt.inventory.metrics import (
    simulate_inventory,
    base_stock_simulation,
    base_stock_simulation_using_dist,
    multi_stage_base_stock_simulation,
    initial_base_stock_level,
    eoq,
    optimize_qr,
    optimize_ss,
    best_histogram,
    best_distribution,
    fit_demand,
    dynamic_programming_for_SSA,
    tabu_search_for_SSA,
    solve_SSA,
)

# Backward-compatible alias expected by refactored 03inventory notebook
multi_stage_simulate_inventory = multi_stage_base_stock_simulation

__all__ = [
    "simulate_inventory",
    "base_stock_simulation",
    "base_stock_simulation_using_dist",
    "multi_stage_base_stock_simulation",
    "multi_stage_simulate_inventory",
    "initial_base_stock_level",
    "eoq",
    "optimize_qr",
    "optimize_ss",
    "best_histogram",
    "best_distribution",
    "fit_demand",
    "dynamic_programming_for_SSA",
    "tabu_search_for_SSA",
    "solve_SSA",
]
