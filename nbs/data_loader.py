"""
Data loading and filtering utilities for the 01abc analysis.

- Loads CSVs used by the original notebook from `nbs/data/`
- Provides configurable date-range filtering (start/end, years, months)
- Normalizes schema (parses dates, column existence)
"""
from __future__ import annotations

from pathlib import Path
from typing import Iterable, Optional, Tuple

import pandas as pd


DATA_DIR = Path(__file__).resolve().parent / "data"


def _ensure_date(dt: pd.Series) -> pd.Series:
    """Parse a pandas Series to datetime (UTC-naive).

    Raises if parsing fails for all entries.
    """
    return pd.to_datetime(dt, errors="coerce")


def get_data_dir(custom: Optional[Path | str] = None) -> Path:
    """Return the data directory path.

    If `custom` is provided, it is resolved relative to CWD.
    """
    return Path(custom).expanduser().resolve() if custom else DATA_DIR


def load_csv(path: Path, index_col: Optional[int | str] = None) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"CSV not found: {path}")
    return pd.read_csv(path, index_col=index_col)


def load_prod(data_dir: Optional[Path | str] = None) -> pd.DataFrame:
    """Load `prod.csv`.

    Expected columns include: name, weight, volume, cust_value, dc_value, plnt_value, fixed_cost
    """
    dir_ = get_data_dir(data_dir)
    return load_csv(dir_ / "prod.csv", index_col=0)


def load_cust(data_dir: Optional[Path | str] = None) -> pd.DataFrame:
    """Load `cust.csv`.

    Expected columns include: name, lat, lon, etc.
    """
    dir_ = get_data_dir(data_dir)
    return load_csv(dir_ / "cust.csv", index_col=0)


def load_demand_with_promo_all(data_dir: Optional[Path | str] = None) -> pd.DataFrame:
    """Load `demand_with_promo_all.csv`.

    Expected columns: date, cust, prod, promo_0, promo_1, demand
    """
    dir_ = get_data_dir(data_dir)
    return load_csv(dir_ / "demand_with_promo_all.csv", index_col=0)


def prepare_demand_df(df: pd.DataFrame, date_col: str = "date") -> pd.DataFrame:
    """Standardize demand dataframe schema.

    - Ensures a datetime column `date`
    - Sorts by date
    - Casts categorical-like columns to string
    """
    if date_col not in df.columns:
        # Sometimes `date` may be an index
        if df.index.name == date_col:
            df = df.reset_index()
        else:
            raise KeyError(f"date column '{date_col}' not found in DataFrame")

    df = df.copy()
    df[date_col] = _ensure_date(df[date_col])
    if df[date_col].isna().all():
        raise ValueError("Failed to parse any dates in demand dataframe")

    if "cust" in df.columns:
        df["cust"] = df["cust"].astype(str)
    if "prod" in df.columns:
        df["prod"] = df["prod"].astype(str)

    if "demand" in df.columns:
        df["demand"] = pd.to_numeric(df["demand"], errors="coerce").fillna(0).astype(float)

    return df.sort_values(date_col).reset_index(drop=True)


def filter_by_date(
    df: pd.DataFrame,
    start: Optional[str | pd.Timestamp] = None,
    end: Optional[str | pd.Timestamp] = None,
    years: Optional[Iterable[int]] = None,
    months: Optional[Iterable[int]] = None,
    date_col: str = "date",
) -> pd.DataFrame:
    """Filter a dataframe by start/end and/or specific years/months.

    - start/end: inclusive boundaries
    - years/months: keep rows where date.year in years and/or date.month in months
    """
    if date_col not in df.columns:
        raise KeyError(f"date column '{date_col}' not found")

    out = df.copy()

    if start is not None:
        start_ts = pd.to_datetime(start)
        out = out[out[date_col] >= start_ts]
    if end is not None:
        end_ts = pd.to_datetime(end)
        out = out[out[date_col] <= end_ts]

    if years is not None:
        years_set = set(int(y) for y in years)
        out = out[out[date_col].dt.year.isin(years_set)]

    if months is not None:
        months_set = set(int(m) for m in months)
        out = out[out[date_col].dt.month.isin(months_set)]

    return out.reset_index(drop=True)


def load_all(
    data_dir: Optional[Path | str] = None,
    start: Optional[str | pd.Timestamp] = None,
    end: Optional[str | pd.Timestamp] = None,
    years: Optional[Iterable[int]] = None,
    months: Optional[Iterable[int]] = None,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Load prod, cust, and demand_with_promo_all with optional date filtering applied to demand.

    Returns (prod_df, cust_df, demand_df)
    """
    prod_df = load_prod(data_dir)
    cust_df = load_cust(data_dir)
    demand_df = load_demand_with_promo_all(data_dir)
    demand_df = prepare_demand_df(demand_df)
    if any(v is not None for v in (start, end, years, months)):
        demand_df = filter_by_date(demand_df, start=start, end=end, years=years, months=months)
    return prod_df, cust_df, demand_df
