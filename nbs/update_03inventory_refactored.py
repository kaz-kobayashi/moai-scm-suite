import nbformat as nbf
from nbformat.v4 import new_notebook, new_markdown_cell, new_code_cell
from pathlib import Path

NB_PATH = Path(__file__).parent / "03inventory_Refactored.ipynb"


def cell_exists(cells, marker_substr: str) -> bool:
    for c in cells:
        src = (c.get("source") or "")
        if isinstance(src, list):
            src = "".join(src)
        if marker_substr in src:
            return True
    return False


def main():
    nb = nbf.read(NB_PATH, as_version=4)

    changed = False

    # 1) Ensure sys.path bootstrap exists before import cells
    bootstrap_marker = "# sys.path bootstrap for nbs imports"
    if not cell_exists(nb.cells, bootstrap_marker):
        bootstrap = new_code_cell(
            source=(
                f"{bootstrap_marker}\n"
                "import sys\n"
                "from pathlib import Path\n"
                "cwd = Path.cwd()\n"
                "# Heuristics: if running from repo root, there is a 'nbs' dir; if running from 'nbs' dir, it has __init__.py\n"
                "if (cwd / 'nbs').exists():\n"
                "    proj_root = cwd\n"
                "elif (cwd.name == 'nbs') and (cwd / '__init__.py').exists():\n"
                "    proj_root = cwd.parent\n"
                "else:\n"
                "    # Fallback: try parent if it contains 'nbs'\n"
                "    proj_root = cwd.parent if (cwd.parent / 'nbs').exists() else cwd\n"
                "if str(proj_root) not in sys.path:\n"
                "    sys.path.insert(0, str(proj_root))\n"
                "print('sys.path bootstrapped:', proj_root)\n"
            )
        )
        # Insert after the first markdown title cell if present, else at top
        insert_idx = 1 if (len(nb.cells) > 0 and nb.cells[0].get("cell_type") == "markdown") else 0
        nb.cells.insert(insert_idx, bootstrap)
        changed = True

    # Remove any existing Parity sections and export cells
    before = len(nb.cells)
    filtered = []
    for c in nb.cells:
        src = (c.get("source") or "")
        if isinstance(src, list):
            src = "".join(src)
        if "Parity check:" in src:
            changed = True
            continue
        if "# export parity metrics to JSON" in src:
            changed = True
            continue
        filtered.append(c)
    if len(filtered) != before:
        nb.cells = filtered

    # 2) Visualization sections (idempotent)
    def ensure_cell(marker: str, cells_to_add: list[str]):
        nonlocal changed
        if not cell_exists(nb.cells, marker):
            nb.cells.append(new_markdown_cell(source=marker + "\n"))
            for src in cells_to_add:
                nb.cells.append(new_code_cell(source=src))
            changed = True

    # Common import cell
    common_imports = (
        "import numpy as np\n"
        "import matplotlib.pyplot as plt\n"
        "from nbs.inventory03_metrics import simulate_inventory, multi_stage_simulate_inventory, base_stock_simulation_using_dist\n"
        "np.random.seed(42)\n"
    )
    if not cell_exists(nb.cells, "# inventory common imports"):
        insert_pos = 1
        # place right after bootstrap cell if present
        for i, c in enumerate(nb.cells):
            src = c.get("source") or ""
            if isinstance(src, list):
                src = "".join(src)
            if 'sys.path bootstrap for nbs imports' in src:
                insert_pos = i + 1
                break
        nb.cells.insert(insert_pos, new_code_cell(source="# inventory common imports\n" + common_imports))
        changed = True
    else:
        # If both bootstrap and common import cells exist, ensure order: bootstrap -> common imports
        bootstrap_idx = None
        common_idx = None
        for i, c in enumerate(nb.cells):
            src = c.get("source") or ""
            if isinstance(src, list):
                src = "".join(src)
            if bootstrap_idx is None and 'sys.path bootstrap for nbs imports' in src:
                bootstrap_idx = i
            if common_idx is None and src.startswith('# inventory common imports'):
                common_idx = i
        if bootstrap_idx is not None and common_idx is not None and common_idx < bootstrap_idx:
            cell = nb.cells.pop(common_idx)
            # after pop, bootstrap index shifts by -1 if common_idx < bootstrap_idx
            if common_idx < bootstrap_idx:
                bootstrap_idx -= 1
            nb.cells.insert(bootstrap_idx + 1, cell)
            changed = True

    # Visualization 1: Single-stage (Q,R)
    ensure_cell(
        "## Visualization: Single-stage (Q,R) inventory trajectory",
        [
            (
                "mu, sigma = 100.0, 10.0\n"
                "LT, Q, R = 3, 300.0, 100.0\n"
                "b, h, fc = 100.0, 1.0, 10000.0\n"
                "n_samples, n_periods = 1, 120\n"
                "cost_qr, I_qr = simulate_inventory(n_samples, n_periods, mu, sigma, LT, Q, R, b, h, fc, S=None)\n"
                "plt.figure(figsize=(8,3))\n"
                "plt.plot(I_qr[0])\n"
                "plt.title('(Q,R) Inventory trajectory (sample 0)')\n"
                "plt.xlabel('t'); plt.ylabel('I'); plt.grid(True); plt.show()\n"
            )
        ],
    )

    # Visualization 2: Single-stage (s,S)
    ensure_cell(
        "## Visualization: Single-stage (s,S) inventory trajectory",
        [
            (
                "mu, sigma = 100.0, 6.0\n"
                "LT, b, h, fc = 0, 100.0, 2.0, 0.0\n"
                "s, S = mu - 0.5*sigma, mu + 0.5*sigma\n"
                "n_samples, n_periods = 1, 120\n"
                "cost_ss, I_ss = simulate_inventory(n_samples, n_periods, mu, sigma, LT, Q=None, R=s, b=b, h=h, fc=fc, S=S)\n"
                "plt.figure(figsize=(8,3))\n"
                "plt.plot(I_ss[0])\n"
                "plt.title('(s,S) Inventory trajectory (sample 0)')\n"
                "plt.xlabel('t'); plt.ylabel('I'); plt.grid(True); plt.show()\n"
            )
        ],
    )

    # Visualization 3: Multi-stage (s,S)
    ensure_cell(
        "## Visualization: Multi-stage (s,S) trajectories",
        [
            (
                "mu, sigma = 100.0, 6.0\n"
                "import numpy as np\n"
                "LT = np.array([1,1,1])\n"
                "b = 100.0\n"
                "h = np.array([10.0, 5.0, 2.0])\n"
                "s = np.array([mu, mu, mu])\n"
                "S = np.array([mu, mu, mu])\n"
                "n_samples, n_periods = 1, 120\n"
                "cost_ms, I_ms, T_ms = multi_stage_simulate_inventory(n_samples, n_periods, mu, sigma, LT, s, S, b, h)\n"
                "plt.figure(figsize=(8,3))\n"
                "plt.plot(I_ms[0,0,:], label='Stage 0')\n"
                "if I_ms.shape[1] > 1: plt.plot(I_ms[0,1,:], label='Stage 1')\n"
                "if I_ms.shape[1] > 2: plt.plot(I_ms[0,2,:], label='Stage 2')\n"
                "plt.title('Multi-stage Inventory (sample 0)')\n"
                "plt.xlabel('t'); plt.ylabel('I'); plt.grid(True); plt.legend(); plt.show()\n"
            )
        ],
    )

    # Visualization 4: Base-stock single-stage
    ensure_cell(
        "## Visualization: Base-stock (single-stage) inventory trajectory",
        [
            (
                "mu, sigma = 100.0, 10.0\n"
                "n_samples, n_periods = 1, 120\n"
                "LT, b, h = 1, 100.0, 1.0\n"
                "S, capacity = mu + 0.5*sigma, 1e9\n"
                "demand = np.maximum(np.random.normal(mu, sigma, (n_samples, n_periods)), 0.0)\n"
                "dC_mean, total_cost, I_bs = base_stock_simulation_using_dist(n_samples, n_periods, demand, capacity, LT, b, h, S)\n"
                "plt.figure(figsize=(8,3))\n"
                "plt.plot(I_bs[0])\n"
                "plt.title('Base-stock Inventory trajectory (sample 0)')\n"
                "plt.xlabel('t'); plt.ylabel('I'); plt.grid(True); plt.show()\n"
            )
        ],
    )

    if changed:
        nbf.write(nb, NB_PATH)
        print("Notebook updated:", NB_PATH)
    else:
        print("No changes needed.")


if __name__ == "__main__":
    main()
