"""
Comprehensive test cases extracted from 03inventory.ipynb
These represent the exact inputs and expected outputs from the original notebook
"""

import numpy as np

# ===================================================================
# EOQ Test Cases (from notebook cells 70-71)
# ===================================================================

EOQ_TEST_CASES = {
    "basic_eoq": {
        "description": "Basic EOQ without backorders",
        "inputs": {
            "K": 300.0,      # order cost
            "d": 10.0,       # daily demand  
            "h": 10.0,       # holding cost
            "b": None        # no backorders
        },
        "formula": "Q* = sqrt(2*K*d/h)",
        "expected": {
            "Q_optimal": np.sqrt(2 * 300 * 10 / 10),  # ≈ 24.49
            "total_cost": np.sqrt(2 * 300 * 10 * 10)   # ≈ 244.95
        }
    },
    
    "eoq_with_backorders": {
        "description": "EOQ with backorder costs",
        "inputs": {
            "K": 300.0,
            "d": 10.0,
            "h": 10.0,
            "b": 40.0       # backorder cost
        },
        "omega": 40.0 / (40.0 + 10.0),  # critical ratio = 0.8
        "expected": {
            "Q_optimal": np.sqrt(2 * 300 * 10 / 10 / 0.8),  # ≈ 27.39
            "total_cost": np.sqrt(2 * 300 * 10 * 10 * 0.8)   # ≈ 219.09
        }
    },
    
    "eoq_incremental_discount": {
        "description": "EOQ with incremental discount - notebook cell 70",
        "inputs": {
            "K": 300.0,
            "d": 10.0,
            "h": 10.0,
            "b": None,
            "r": 0.01,      # interest rate
            "c": [350.0, 200.0],  # unit costs
            "theta": [0.0, 30.0], # discount breakpoints
            "discount": "incremental"
        },
        "expected": {
            "Q_optimal": 89.44271909999159,
            "total_cost": 3073.3126291998988
        }
    }
}

# ===================================================================
# Wagner-Whitin Test Cases (from notebook cell 41)
# ===================================================================

WAGNER_WHITIN_TEST_CASES = {
    "basic_case": {
        "description": "Standard Wagner-Whitin example from notebook",
        "inputs": {
            "demand": [5, 7, 3, 6, 4],
            "fixed_cost": 3,
            "variable_cost": [1, 1, 3, 3, 3],  
            "holding_cost": 1.0
        },
        "expected": {
            "total_cost": 57.0,
            "orders": [5.0, 16.0, 0.0, 0.0, 4.0]
        },
        "explanation": "Order 5 in period 0, order 16 in period 1 (covers periods 1-2), order 4 in period 4"
    }
}

# ===================================================================
# Safety Stock Allocation Test Cases (from notebook cells 170, 174, 175)
# ===================================================================

SSA_TEST_CASES = {
    "three_point_network": {
        "description": "3-point network from notebook cell 170",
        "inputs": {
            "network_edges": [(0, 1), (0, 2)],
            "z": 1.65,
            "h": np.array([1.0, 1.0, 1.0]),
            "mu": np.array([300.0, 200.0, 100.0]),
            "sigma": np.array([12.0, 10.0, 15.0]),
            "LTUB": np.zeros(3),
            "ProcTime": np.array([5, 4, 3], dtype=int),
            "max_iter": 10,
            "TLLB": 1,
            "TLUB": 3,
            "seed": 1
        },
        "expected": {
            "best_cost": 119.50357133746822,
            "best_sol": [0, 1, 1],
            "best_NRT": [0.0, 9.0, 8.0],
            "best_MaxLI": [5.0, 9.0, 8.0],
            "best_MinLT": [5.0, 0.0, 0.0]
        }
    },
    
    "eight_point_serial": {
        "description": "8-point serial network from notebook cell 174",
        "inputs": {
            "network_edges": [(i, i-1) for i in range(7, 0, -1)],  # serial: 7→6→5→...→1→0
            "z": 1.65,
            "h": np.array([20, 20, 10, 10, 10, 5, 5, 1]),
            "mu": np.array([100.0] * 8),
            "sigma": np.array([10.0] * 8),
            "ProcTime": np.array([5] * 8, dtype=int),
            "LTUB": np.zeros(8),
            "max_iter": 10,
            "seed": 1
        },
        "expected": {
            "best_cost": 1905.4467494843116,
            "best_sol": [1, 0, 1, 0, 0, 0, 0, 1],
            "best_NRT": [10.0, 0.0, 25.0, 0.0, 0.0, 0.0, 0.0, 5.0],
            "best_MaxLI": [10.0, 5.0, 25.0, 20.0, 15.0, 10.0, 5.0, 5.0],
            "best_MinLT": [0.0, 5.0, 0.0, 20.0, 15.0, 10.0, 5.0, 0.0]
        }
    },
    
    "seven_point_general": {
        "description": "7-point general network from notebook cell 175",
        "inputs": {
            "network_edges": [(0, 2), (1, 2), (2, 4), (3, 4), (4, 5), (4, 6)],
            "z": np.full(7, 1.65),
            "h": np.array([1, 1, 3, 1, 5, 6, 6]),
            "mu": np.array([200, 200, 200, 200, 200, 100, 100]),
            "sigma": np.array([14.1, 14.1, 14.1, 14.1, 14.1, 10, 10]),
            "LTUB": np.array([0, 0, 0, 0, 0, 3, 1], dtype=int),
            "ProcTime": np.array([6, 2, 3, 3, 3, 3, 3], dtype=int),
            "max_iter": 10,
            "seed": 1
        },
        "expected": {
            "best_cost": 514.8330943986502,
            "best_sol": [1, 1, 0, 0, 1, 0, 1],
            "best_NRT": [6.0, 2.0, 0.0, 0.0, 6.0, 0.0, 2.0],
            "best_MaxLI": [6.0, 2.0, 3.0, 3.0, 6.0, 3.0, 3.0],
            "best_MinLT": [0.0, 0.0, 3.0, 3.0, 0.0, 3.0, 1.0]
        }
    }
}

# ===================================================================
# Inventory Simulation Test Cases (from notebook cells 74-75)
# ===================================================================

SIMULATION_TEST_CASES = {
    "basic_simulation": {
        "description": "Basic inventory simulation from notebook cell 74",
        "inputs": {
            "n_samples": 1,
            "n_periods": 100,
            "alpha": 3.0,
            "fc": 0.0,      # no fixed cost
            "mu": 100.0,
            "sigma": 6.0,
            "b": 100.0,     # backorder cost
            "h": 2.0,       # holding cost  
            "LT": 0         # zero lead time
        },
        "calculations": {
            "omega": 100.0 / (100.0 + 2.0),  # = 0.9803921568627451
            "z": 2.0619165008094615,           # norm.ppf(omega)
            "s": 100.0,     # when LT=0 and fc=0
            "S": 100.0
        },
        "expected": {
            "cost_mean": 0.0  # Should be very low with zero lead time
        }
    }
}

# ===================================================================
# Base Stock Optimization Test Cases (from notebook cells 113-114)
# ===================================================================

BASE_STOCK_TEST_CASES = {
    "single_stage_optimization": {
        "description": "Single-stage base stock optimization from notebook cells 113-114",
        "inputs": {
            "n_samples": 100,
            "n_periods": 100,
            "mu": 100.0,
            "sigma": 10.0,
            "b": 100.0,
            "h": 10.0,
            "LT": 3,
            "seed": 123
        },
        "calculations": {
            "omega": 100.0 / (100.0 + 10.0),  # = 0.9090909090909091
            "z": 1.3351777361189363,            # norm.ppf(omega)
            "initial_S": 323.12595676092786     # mu*LT + z*sigma*sqrt(LT)
        },
        "expected": {
            "converged_S": 323.53,  # approximately
            "final_cost": 377.35    # approximately
        },
        "convergence_trace": [
            (0, 323.56, -0.439, 377.45),
            (1, 323.51, 0.056, 377.35),
            (2, 323.52, -0.010, 377.35),
            # ... continues until convergence
            (6, 323.53, 0.001, 377.35)
        ]
    },
    
    "multi_stage_base_stock": {
        "description": "Multi-stage base stock from notebook cell 121",
        "inputs": {
            "n_samples": 10,
            "n_stages": 3,
            "n_periods": 1000,
            "mu": 100,
            "sigma": 10,
            "LT": np.array([1, 1, 1]),
            "z": 1.33,
            "b": 100,
            "h": np.array([10.0, 5.0, 2.0]),
            "capacity": np.array([120.0, 120.0, 130.0])
        },
        "echelon_calculations": {
            "ELT": [1.0, 3.0, 5.0],  # echelon lead times
            "initial_S": [113.3, 323.04, 529.74]
        },
        "expected_convergence": "Converges after ~16 iterations"
    }
}

# ===================================================================
# Distribution Fitting Test Cases (from notebook cells 45-46)
# ===================================================================

DISTRIBUTION_TEST_CASES = {
    "normal_data_fitting": {
        "description": "Fitting normal distribution to data",
        "inputs": {
            "data": "np.random.normal(100, 10, 1000)",  # generate with seed
            "distributions_to_test": ["normal", "expon", "gamma", "lognorm"]
        },
        "expected": {
            "best_distribution": "powerlognorm",  # from notebook output
            "parameters": (11.799333308942117, 0.20671017783771561, 
                          16.468598592930654, 116.65707079233306)
        }
    }
}

# ===================================================================
# Excel Interface Test Cases 
# ===================================================================

EXCEL_TEST_CASES = {
    "messa_template_generation": {
        "description": "MESSA Excel template generation",
        "function": "make_excel_messa()",
        "expected_sheets": ["品目", "部品展開表"],
        "expected_columns": {
            "品目": ["品目名称（ID）", "処理時間（日）", "最大保証リード時間（日）", 
                    "平均需要量（units/日）", "需要の標準偏差", "在庫費用（円/unit/日）", 
                    "品切れ費用（円/unit/日）", "発注固定費用（円）"],
            "部品展開表": ["子品目（ID）", "親品目(ID)", "必要量(units)"]
        }
    }
}

# ===================================================================
# Key Mathematical Formulas from Notebook
# ===================================================================

MATHEMATICAL_FORMULAS = {
    "critical_ratio": "ω = b/(b+h)",
    "safety_stock_factor": "z = norm.ppf(ω)",
    "basic_eoq": "Q* = sqrt(2*K*d/h)",
    "eoq_with_backorders": "Q* = sqrt(2*K*d/(h*ω))",
    "optimal_cost_with_backorders": "sqrt(2*K*h*d*ω)",
    "approximate_ss_Q": "Q = 1.3 * μ^0.494 * (fc/h)^0.506 * (1+σ²L/μ²)^0.116",
    "approximate_ss_s": "s = 0.973*μL + σL*(0.183/z + 1.063 - 2.192*z)",
    "base_stock_initial": "S = μ*LT + z*σ*sqrt(LT)",
    "echelon_lead_time": "ELT[i] = max(ELT[successors]) + LT[i] + 1"
}

# ===================================================================
# Parameter Transformation Rules
# ===================================================================

PARAMETER_TRANSFORMATIONS = {
    "service_level_to_z": {
        "formula": "z = norm.ppf(service_level)",
        "examples": {
            0.90: 1.2816,
            0.95: 1.6449,
            0.99: 2.3263
        }
    },
    "cost_to_critical_ratio": {
        "formula": "ω = b/(b+h)",
        "note": "Used to convert costs to safety stock factor"
    },
    "annual_to_daily_demand": {
        "formula": "daily = annual / 365",
        "note": "Most notebook examples use daily demand"
    },
    "inventory_position": {
        "formula": "IP = inventory_on_hand + inventory_on_order - backorders",
        "note": "Used in (s,S) and (Q,R) policies"
    }
}


def get_test_case_by_name(category: str, test_name: str):
    """Retrieve a specific test case"""
    test_categories = {
        "eoq": EOQ_TEST_CASES,
        "wagner_whitin": WAGNER_WHITIN_TEST_CASES,
        "ssa": SSA_TEST_CASES,
        "simulation": SIMULATION_TEST_CASES,
        "base_stock": BASE_STOCK_TEST_CASES,
        "distribution": DISTRIBUTION_TEST_CASES,
        "excel": EXCEL_TEST_CASES
    }
    
    if category in test_categories and test_name in test_categories[category]:
        return test_categories[category][test_name]
    else:
        raise KeyError(f"Test case {category}.{test_name} not found")


def print_all_test_cases():
    """Print summary of all test cases"""
    print("Test Cases Summary from 03inventory.ipynb")
    print("=" * 60)
    
    categories = [
        ("EOQ", EOQ_TEST_CASES),
        ("Wagner-Whitin", WAGNER_WHITIN_TEST_CASES),
        ("Safety Stock Allocation", SSA_TEST_CASES),
        ("Inventory Simulation", SIMULATION_TEST_CASES),
        ("Base Stock Optimization", BASE_STOCK_TEST_CASES),
        ("Distribution Fitting", DISTRIBUTION_TEST_CASES),
        ("Excel Interface", EXCEL_TEST_CASES)
    ]
    
    for cat_name, test_dict in categories:
        print(f"\n{cat_name}:")
        for test_name, test_data in test_dict.items():
            print(f"  - {test_name}: {test_data.get('description', 'No description')}")


if __name__ == "__main__":
    print_all_test_cases()
    
    # Example: Get specific test case
    eoq_basic = get_test_case_by_name("eoq", "basic_eoq")
    print(f"\nExample test case: {eoq_basic}")