"""
Extracted Inventory Optimization Functions from 03inventory.ipynb

This file contains the key inventory optimization algorithms extracted from the Jupyter notebook,
including Safety Stock Allocation (SSA), EOQ calculations, inventory simulation, and distribution fitting functions.
"""

import warnings
import random
import string
import datetime
import math
import pickle
from collections import OrderedDict, defaultdict
import numpy as np
import pandas as pd
from scipy.stats import norm, truncnorm
import scipy.stats as st
import networkx as nx


# =============================================================================
# 1. WAGNER-WHITIN ALGORITHM FOR DYNAMIC LOT SIZING
# =============================================================================

def ww(demand, fc=100., vc=0., h=5.):
    """
    Wagner-Whitin method for dynamic lot sizing problem
    
    Args:
        demand: Multi-period demand as a list
        fc: Fixed cost (constant or list)
        vc: Variable cost (constant or list) 
        h: Holding cost (constant or list)
    
    Returns:
        cost: Optimal value
        order: Order quantity for each period
    """
    T = len(demand)
    fixed = np.full(T, fc) 
    variable = np.full(T, vc)
    hc = np.full(T, h)
    F = np.full(T, 99999999999.)

    prev = np.full(T, -1)
    for i in range(T):
        if i == 0: 
            cum = fixed[i] + variable[i] * demand[i]
        else:
            cum = F[i-1] + fixed[i] + variable[i] * demand[i]
        cumh = 0
        for j in range(i, T):
            if cum < F[j]:
                F[j] = cum
                prev[j] = i - 1
            if j == (T - 1): 
                break
            cumh += hc[j]
            cum += (variable[i] + cumh) * demand[j + 1]

    setup = np.zeros(T)
    j = T - 1
    while j != -1:
        i = prev[j]
        setup[i + 1] = 1
        j = i

    dem = 0
    order = np.zeros(T)
    for t in range(T - 1, -1, -1):
        dem += demand[t]
        if setup[t] == 1:
            order[t] = dem
            dem = 0
            
    return F[T - 1], order


# =============================================================================
# 2. EOQ CALCULATION FUNCTION
# =============================================================================

def eoq(K, d, h, b, r, c, theta, discount=None):
    """
    Economic Order Quantity model with various configurations
    
    Args:
        K: Fixed ordering cost
        d: Demand rate
        h: Holding cost (excluding interest)
        b: Backorder cost (None if no backorders allowed)
        r: Interest rate (for discount models)
        c: Unit costs for discount models
        theta: Price break points for discount models
        discount: Discount type ("incremental", "all", or None)
    
    Returns:
        Q: Optimal order quantity
        z: Optimal value
    """
    if b is None:
        omega = 1.
    else:
        omega = b / (b + h)
    
    if discount is None:
        return np.sqrt(2 * K * d / h / omega), np.sqrt(2 * K * h * d * omega)
    else:
        if discount == "incremental":
            cost, Q = [], []
            for j in range(len(c)):
                Kj = K + (c[0] - c[j]) * theta[j]
                Q.append(np.sqrt(2 * d * Kj / (h + r * c[j]) / omega))
                cost.append(d * c[j] + np.sqrt(2 * d * Kj * (h + r * c[j]) * omega))
            jstar = np.argmin(np.array(cost))
            return Q[jstar], cost[jstar]
        
        elif discount == "all":
            min_cost = np.inf
            q_star = None
            for j in range(len(c)):
                Q = np.sqrt(2 * d * K / (h + r * c[j]) / omega)
                if Q > theta[j]:
                    C = d * c[j] + np.sqrt(2 * d * K * (h + r * c[j]) * omega)
                    if min_cost > C:
                        min_cost = C
                        q_star = Q
                else:
                    C = d * c[j] + d * K / theta[j] + (h + r * c[j]) * theta[j] / 2.
                    if min_cost > C:
                        min_cost = C
                        q_star = theta[j]
            return q_star, min_cost
        else:
            raise ValueError("No such discount option!")


# =============================================================================
# 3. INVENTORY SIMULATION FUNCTIONS
# =============================================================================

def simulate_inventory(n_samples=1, n_periods=10, mu=100., sigma=10., LT=3,
                      Q=300., R=100., b=100., h=1., fc=10000., S=None):
    """
    Inventory simulation for (Q,R) and (s,S) policies
    
    Args:
        n_samples: Number of simulation samples
        n_periods: Number of periods
        mu: Demand mean
        sigma: Demand standard deviation
        LT: Lead time
        Q: Order quantity
        R: Reorder point
        b: Backorder cost
        h: Holding cost
        fc: Fixed ordering cost
        S: Base stock level for (s,S) policy
    
    Returns:
        cost: Total cost for each sample
        I: Inventory levels over time
    """
    demand = np.maximum(np.random.normal(mu, sigma, (n_samples, n_periods)), 0.)
    I = np.zeros((n_samples, n_periods + 1))
    fixed_cost = np.zeros((n_samples, n_periods + 1))
    
    omega = b / (b + h)
    z = norm.ppf(omega)
    
    if LT == 0:
        I[:, 0] = 0.
        NI = mu
    else:
        if S is None:
            I[:, 0] = R
            NI = R - 1
        else:
            I[:, 0] = R
            NI = R - 1  # net inventory
    
    production = np.zeros((n_samples, n_periods + 1)) 
    cost = np.zeros((n_samples, n_periods))
    
    for t in range(1, n_periods):
        NI = NI - demand[:, t] 

        if S is None:  # (Q,R)-policy            
            prod = np.where(NI < R, Q, 0.)
        else:  # (s,S)-policy
            prod = np.where(NI < R, S - NI, 0.)
        fixed_cost[:, t] = np.where(NI < R, fc, 0.)
        production[:, t] = prod  # production update
        NI = NI + production[:, t]  # inventory position after ordering
        
        # inventory level update
        if t - LT >= 0:
            I[:, t] = I[:, t - 1] - demand[:, t] + production[:, t - LT]
        else:
            I[:, t] = I[:, t - 1] - demand[:, t]

    cost = np.where(I < 0, -b * I, h * I) + fixed_cost  # holding/backorder cost + fixed cost
    return np.sum(cost, axis=1) / n_periods, I


def base_stock_simulation(n_samples, n_periods, demand, capacity, LT, b, h, S):
    """
    Base stock simulation for single-stage inventory system
    
    Args:
        n_samples: Number of simulation samples
        n_periods: Number of periods
        demand: Demand array (n_samples x n_periods)
        capacity: Production capacity
        LT: Lead time
        b: Backorder cost
        h: Holding cost
        S: Base stock level
    
    Returns:
        dC: Derivative of cost with respect to base stock level
        total_cost: Expected total cost
        I: Inventory levels over time
    """
    I = np.zeros((n_samples, n_periods + 1))
    T = np.zeros((n_samples, n_periods + 1))
    I[:, 0] = S  # initial inventory
    production = np.zeros((n_samples, LT))
    sum_dC = 0.
    
    for t in range(n_periods):
        I[:, t + 1] = I[:, t] - demand[:, t] + production[:, (t - LT) % LT]  # inventory update
        prod = np.minimum(capacity, S + demand[:, t] - I[:, t] - T[:, t])  # production calculation

        T[:, t + 1] = T[:, t] + prod - production[:, (t - LT) % LT]  # in-transit inventory update
        production[:, t % LT] = prod  # production update

        dC = np.where(I[:, t] < 0, -b, h)
        sum_dC += dC.sum()

    total_cost = (-1 * b * I[I < 0].sum() + h * I[I > 0].sum()) / n_periods / n_samples
    return sum_dC / n_samples / n_periods, total_cost, I


def multi_stage_base_stock_simulation(G, n_samples, n_periods, demand, capacity, LT, ELT, b, h, S, phi, alpha):
    """
    Multi-stage base stock simulation for network inventory systems
    
    Args:
        G: Supply chain graph
        n_samples: Number of simulation samples
        n_periods: Number of periods
        demand: Demand dictionary by location
        capacity: Capacity array
        LT: Lead time array
        ELT: Echelon lead time array
        b: Backorder cost array
        h: Holding cost array
        S: Base stock level array
        phi: BOM coefficients
        alpha: Allocation ratios
    
    Returns:
        dC: Cost derivatives for each location
        total_cost: Expected total cost
        I: Inventory levels over time
    """
    maxLT = int(LT.max())
    
    # Relabel nodes
    mapping = {i: idx for idx, i in enumerate(G)}
    G = nx.relabel_nodes(G, mapping=mapping, copy=True)
    
    n_stages = len(G)
    # Inventory levels
    I = np.zeros((n_samples, n_stages, n_periods + 1))
    T = np.zeros((n_samples, n_stages, n_periods + 1))
    EI = np.zeros((n_samples, n_stages))
    
    # Initial inventory
    for i in G:
        init_ = S[i]
        for j in G.successors(i):
            init_ -= phi[i, j] * S[j]
        I[:, i, 0] = init_
    
    # Derivative arrays
    dI = np.zeros((n_samples, n_stages, n_stages, n_periods + 1))
    dT = np.zeros((n_samples, n_stages, n_stages, n_periods + 1))
    dEI = np.zeros((n_samples, n_stages, n_stages))
    
    for i in G:
        dI[:, i, i, 0] = 1
        for j in G.successors(i):
            dI[:, i, j, 0] = -phi[i, j]

    dProd = np.zeros((n_samples, n_stages, n_stages, maxLT))
    production = np.zeros((n_samples, n_stages, maxLT))

    prod = {}
    dummy = np.zeros(n_samples)
    
    for t in range(n_periods):
        # Echelon inventory calculation
        for i in G.up_order():
            if G.out_degree(i) == 0:  # demand point
                EI[:, i] = I[:, i, t] + T[:, i, t] - demand[i][:, t]
                dEI[:, i, :] = dI[:, i, :, t] + dT[:, i, :, t]
            else:
                EI[:, i] = I[:, i, t] + T[:, i, t]
                dEI[:, i, :] = dI[:, i, :, t] + dT[:, i, :, t]
                for j in G.successors(i):
                    EI[:, i] += phi[i, j] * EI[:, j]
                    dEI[:, i, :] += phi[i, j] * dEI[:, j, :]
        
        # Production calculation
        for i in G:
            prod[i] = np.minimum(capacity[i], S[i] - EI[:, i])
            # Allocation constraints from upstream locations
            for j in G.predecessors(i):
                prod[i] = np.minimum(I[:, j, t] * alpha[j, i] / phi[j, i], prod[i])

            # Production derivative calculation
            for j in G:
                if i == j:
                    dProd[:, i, j, t % LT[i]] = 1. - dEI[:, i, j]
                else:
                    dProd[:, i, j, t % LT[i]] = -dEI[:, i, j]
                dProd[:, i, j, t % LT[i]] = np.where((prod[i] == 0.) | (
                    prod[i] == capacity[i]), 0., dProd[:, i, j, t % LT[i]])

                for k in G.predecessors(i):
                    dProd[:, i, j, t % LT[i]] = np.where(
                        (I[:, k, t] * alpha[k, i] / phi[k, i] == prod[i]), 
                        alpha[k, i] * dI[:, k, j, t], dProd[:, i, j, t % LT[i]])

        # Update in-transit inventory
        for i in G:
            T[:, i, t + 1] = T[:, i, t] + prod[i] - production[:, i, (t - LT[i]) % LT[i]]
            
        # Update inventory
        for i in G:
            if G.out_degree(i) == 0:
                I[:, i, t + 1] = I[:, i, t] - demand[i][:, t] + production[:, i, (t - LT[i]) % LT[i]]
            else:
                dummy = np.zeros(n_samples)
                for j in G.successors(i):
                    dummy += prod[j] * phi[i, j]
                I[:, i, t + 1] = I[:, i, t] - dummy + production[:, i, (t - LT[i]) % LT[i]]

        # Update production
        for i in G:
            production[:, i, t % LT[i]] = prod[i]

        # Update derivatives
        for i in range(n_stages):
            for j in range(n_stages):
                d_dummy = np.zeros(n_samples)
                for k in G.successors(i):
                    d_dummy += phi[i, k] * dProd[:, k, j, t % LT[i]]

                dI[:, i, j, t + 1] = dI[:, i, j, t] - d_dummy + dProd[:, i, j, (t - LT[i]) % LT[i]]
                dT[:, i, j, t + 1] = dT[:, i, j, t] + dProd[:, i, j, t % LT[i]] - dProd[:, i, j, (t - LT[i]) % LT[i]]
    
    # Calculate total cost
    total = 0.
    for i in G:
        total += -b[i] * I[:, i, maxLT:][I[:, i, maxLT:] < 0].sum() + h[i] * (
            I[:, i, maxLT:][I[:, i, maxLT:] > 0].sum() + T[:, i, maxLT:].sum())
    total_cost = total / n_samples / max((n_periods - maxLT), 1)

    # Calculate derivatives
    dC = np.zeros(n_stages)
    for j in range(n_stages):
        total = 0.
        for i in range(n_stages):
            total += np.where(I[:, i, maxLT:] < 0, -b[i] * dI[:, i, j, maxLT:],
                              h[i] * dI[:, i, j, maxLT:]).sum()
            total += h[i] * (dT[:, i, j, maxLT:]).sum()
        dC[j] = total / n_samples / max((n_periods - maxLT), 1)

    return dC, total_cost, I


# =============================================================================
# 4. BASE STOCK OPTIMIZATION FUNCTIONS
# =============================================================================

def optimize_qr(n_samples=1, n_periods=10, mu=100., sigma=10., LT=3,
                Q=None, R=None, z=None, b=100., h=1., fc=10000., alpha=1.):
    """
    Optimization of (Q,R) policy parameters
    
    Args:
        n_samples: Number of simulation samples
        n_periods: Number of periods
        mu: Demand mean
        sigma: Demand standard deviation
        LT: Lead time
        Q: Order quantity (None to optimize)
        R: Reorder point (None to optimize)
        z: Safety factor
        b: Backorder cost
        h: Holding cost
        fc: Fixed ordering cost
        alpha: Risk consideration factor
    
    Returns:
        R: Optimal reorder point
        Q: Optimal order quantity
    """
    omega = b / (b + h)
    z = norm.ppf(omega)

    if Q is None:
        Qhat = int(np.sqrt(2 * fc * mu / h / omega))  # EOQ formula
        if Qhat < mu:
            print("Use base stock policy!")
    else:
        Qhat = Q
        
    if R is None:
        Rhat = int(LT * mu + z * sigma * np.sqrt(LT))
        s_appro, S_appro = approximate_ss(mu, sigma, LT, b, h, fc)
        Rhat = min(Rhat, int(s_appro))
        
        # Search for R
        c = []
        std = []
        min_cost = np.inf
        min_R = -1
        for R in range(Rhat, Rhat * 10):
            cost, I = simulate_inventory(n_samples=n_samples, n_periods=n_periods, 
                                       mu=mu, sigma=sigma, LT=LT, Q=Qhat, R=R, 
                                       b=b, h=h, fc=fc)
            if cost.mean() > min_cost:
                break
            c.append(cost.mean())
            std.append(cost.std())
            risk_cost = cost.mean() + alpha * cost.std()
            if min_cost > risk_cost:
                min_cost = risk_cost
                min_R = R
        Rhat = min_R
    else:
        Rhat = R

    # Search for Q
    if Q is None:
        min_Q = -1
        min_cost = np.inf
        c, std = [], []
        for Q in range(Qhat - 10, Qhat * 10):
            cost, I = simulate_inventory(n_samples=n_samples, n_periods=n_periods, 
                                       mu=mu, sigma=sigma, LT=LT, Q=Q, R=Rhat, 
                                       b=b, h=h, fc=fc)
            c.append(cost.mean())
            std.append(cost.std())
            risk_cost = cost.mean() + alpha * cost.std()
            if cost.mean() > min_cost and Q > Qhat:
                break
            if min_cost > risk_cost:
                min_cost = risk_cost
                min_Q = Q
    return Rhat, min_Q


def optimize_ss(n_samples=1, n_periods=10, mu=100., sigma=10., LT=3,
                Q=None, R=None, z=None, b=100., h=1., fc=10000., alpha=1., S=None):
    """
    Optimization of (s,S) policy parameters
    
    Args:
        n_samples: Number of simulation samples
        n_periods: Number of periods
        mu: Demand mean
        sigma: Demand standard deviation
        LT: Lead time
        Q: Order quantity (None to optimize)
        R: Reorder point (None to optimize)
        z: Safety factor
        b: Backorder cost
        h: Holding cost
        fc: Fixed ordering cost
        alpha: Risk consideration factor
        S: Base stock level (None to optimize)
    
    Returns:
        s: Optimal reorder point
        S: Optimal base stock level
    """
    omega = b / (b + h)
    z = norm.ppf(omega)

    if Q is None:
        Qhat = int(np.sqrt(2 * fc * mu / h / omega))  # EOQ formula
        if Qhat < mu:
            print("Use base stock policy!")
    else:
        Qhat = Q
        
    if R is None:
        Rhat = int(LT * mu + z * sigma * np.sqrt(LT))
        s_appro, S_appro = approximate_ss(mu, sigma, LT, b, h, fc)
        Rhat = min(Rhat, int(s_appro))
        
        # Search for R
        c = []
        std = []
        min_cost = np.inf
        min_R = -1
        for R in range(Rhat - 10, Rhat * 10):
            cost, I = simulate_inventory(n_samples=n_samples, n_periods=n_periods, 
                                       mu=mu, sigma=sigma, LT=LT, Q=Qhat, R=R,  
                                       b=b, h=h, fc=fc, S=R + Qhat)
            if cost.mean() > min_cost and R >= Rhat + 10:
                break
            c.append(cost.mean())
            std.append(cost.std())
            risk_cost = cost.mean() + alpha * cost.std()
            if min_cost > risk_cost:
                min_cost = risk_cost
                min_R = R
        Rhat = min_R
    else:
        Rhat = R

    # Search for S
    if S is None:
        min_S = -1
        min_cost = np.inf
        c, std = [], []
        for S in range(min_R + Qhat - 10, min_R + Qhat * 10):
            cost, I = simulate_inventory(n_samples=n_samples, n_periods=n_periods, 
                                       mu=mu, sigma=sigma, LT=LT, Q=Q, R=Rhat,  
                                       b=b, h=h, fc=fc, S=S)
            c.append(cost.mean())
            std.append(cost.std())
            risk_cost = cost.mean() + alpha * cost.std()
            if cost.mean() > min_cost and S > min_R + Qhat:
                break
            if min_cost > risk_cost:
                min_cost = risk_cost
                min_S = S
    return Rhat, min_S


def approximate_ss(mu=100., sigma=10., LT=0, b=100., h=1., fc=10000.):
    """
    Approximate optimization for (s,S) policy using regression-based approach
    
    Args:
        mu: Demand mean
        sigma: Demand standard deviation
        LT: Lead time
        b: Backorder cost
        h: Holding cost
        fc: Fixed ordering cost
    
    Returns:
        s: Optimal reorder point
        S: Optimal base stock level
    """
    sigmaL = sigma * np.sqrt(LT + 1) + 0.000001
    muL = mu * (LT + 1)
    Q = 1.3 * mu**0.494 * (fc / h)**0.506 * (1 + sigmaL**2 / mu**2)**0.116
    z = np.sqrt(Q * h / sigmaL / b) + 0.0000001
    s = 0.973 * muL + sigmaL * (0.183 / z + 1.063 - 2.192 * z)
    S = s + Q
    
    if Q <= mu * 1.5: 
        omega = b / (b + h)
        z = norm.ppf(omega)
        S0 = muL + z * sigmaL 
        s = min(s, S0)
        S = min(s + Q, S0)
    return s, S


def initial_base_stock_level(G, LT, mu, z, sigma):
    """
    Calculate initial base stock levels and echelon lead times
    
    Args:
        G: Supply chain graph
        LT: Lead time array
        mu: Demand mean
        z: Safety factor
        sigma: Demand standard deviation
    
    Returns:
        ELT: Echelon lead times
        S: Initial base stock levels
    """
    ELT = np.zeros(len(G))
    for i in G.up_order():
        if G.out_degree(i) == 0:
            ELT[i] = LT[i]  # For final demand points
        else:
            max_succ_LT = 0
            for j in G.successors(i):
                max_succ_LT = max(ELT[j], max_succ_LT)
            ELT[i] = max_succ_LT + LT[i] + 1  # Add cycle time for downstream locations
    S = ELT * mu + z * sigma * np.sqrt(ELT)
    return ELT, S


# =============================================================================
# 5. DISTRIBUTION FITTING FUNCTIONS
# =============================================================================

def best_distribution(data):
    """
    Find the best fitting continuous probability distribution for demand data
    
    Args:
        data: Data array
    
    Returns:
        fig: Plot with histogram and best fit distribution
        frozen_dist: Best fitting distribution (parameters fixed)
        best_fit_name: Name of best fitting distribution
        best_fit_params: Parameters of best fitting distribution
    """
    def best_fit_distribution(data, bins=200):
        """Model data by finding best fit distribution to data"""
        DISTRIBUTIONS = [        
            st.alpha, st.anglit, st.arcsine, st.beta, st.betaprime, st.bradford, st.burr, st.cauchy, st.chi, st.chi2, st.cosine,
            st.dgamma, st.dweibull, st.expon, st.exponnorm, st.exponweib, st.exponpow, st.f, st.fatiguelife, st.fisk,
            st.foldcauchy, st.foldnorm, st.genlogistic, st.genpareto, st.gennorm, st.genexpon,
            st.genextreme, st.gausshyper, st.gamma, st.gengamma, st.genhalflogistic, st.gompertz, st.gumbel_r,
            st.gumbel_l, st.halfcauchy, st.halflogistic, st.halfnorm, st.halfgennorm, st.hypsecant, st.invgamma, st.invgauss,
            st.invweibull, st.johnsonsb, st.johnsonsu, st.ksone, st.kstwobign, st.laplace, st.levy,
            st.logistic, st.loggamma, st.loglaplace, st.lognorm, st.lomax, st.maxwell, st.mielke, st.nakagami, st.ncx2, st.ncf,
            st.nct, st.norm, st.pareto, st.pearson3, st.powerlaw, st.powerlognorm, st.powernorm, st.rdist, st.reciprocal,
            st.rayleigh, st.rice, st.recipinvgauss, st.semicircular, st.t, st.triang, st.truncexpon, st.truncnorm, st.tukeylambda,
            st.uniform, st.vonmises, st.vonmises_line, st.wald, st.weibull_min, st.weibull_max, st.wrapcauchy
        ]
        
        best_distribution = st.norm
        best_params = (0.0, 1.0)
        best_sse = np.inf

        for distribution in DISTRIBUTIONS:
            y, x = np.histogram(data, bins=bins, density=True)
            x = (x + np.roll(x, -1))[:-1] / 2.0

            try:
                with warnings.catch_warnings():
                    warnings.filterwarnings('ignore')
                    params = distribution.fit(data)
                    arg = params[:-2]
                    loc = params[-2]
                    scale = params[-1]
                    pdf = distribution.pdf(x, loc=loc, scale=scale, *arg)
                    sse = np.sum(np.power(y - pdf, 2.0))

                    if best_sse > sse > 0:
                        best_distribution = distribution
                        best_params = params
                        best_sse = sse
            except Exception:
                pass

        return (best_distribution.name, best_params)
    
    def make_pdf(dist, params, size=10000):
        """Generate distributions's Probability Distribution Function """
        arg = params[:-2]
        loc = params[-2]
        scale = params[-1]

        start = dist.ppf(0.01, *arg, loc=loc, scale=scale) if arg else dist.ppf(0.01, loc=loc, scale=scale)
        end = dist.ppf(0.99, *arg, loc=loc, scale=scale) if arg else dist.ppf(0.99, loc=loc, scale=scale)

        x = np.linspace(start, end, size)
        y = dist.pdf(x, loc=loc, scale=scale, *arg)
        pdf = pd.Series(y, x)
        return pdf, start, end 

    data = pd.Series(data)
    best_fit_name, best_fit_params = best_fit_distribution(data, 200)
    best_dist = getattr(st, best_fit_name)
    
    params = best_fit_params
    arg = params[:-2]
    loc = params[-2]
    scale = params[-1]
    frozen_dist = best_dist(loc=loc, scale=scale, *arg)

    # For plotting, you would need plotly here - simplified for extraction
    fig = None  # Would contain plotly figure
    
    return fig, frozen_dist, best_fit_name, best_fit_params 


def best_histogram(data, nbins=50):
    """
    Create histogram-based probability distribution from demand data
    
    Args:
        data: Data array
        nbins: Number of bins (default 50)
    
    Returns:
        fig: Histogram plot with distribution
        hist_dist: Histogram-based distribution (parameters fixed)
    """
    data_range = (data.min(), data.max())
    data = pd.Series(data)
    bins = max(int(data_range[1] - data_range[0]), 1)
    y, x = np.histogram(data, bins=min(bins, nbins))
    if bins < 50:
        x = x - 0.5  # Shift bins left by 0.5 to match mean
    hist_dist = st.rv_histogram((y, x)).freeze()
    
    # For plotting, you would need plotly here - simplified for extraction
    fig = None  # Would contain plotly figure
    
    return fig, hist_dist


def fit_demand(demand_df, cust_selected, prod_selected, agg_period="1d", nbins=50, L=1):
    """
    Fit demand distributions for customers and products with lead time consideration
    
    Args:
        demand_df: Demand dataframe with columns: cust, prod, date, demand
        cust_selected: List of selected customer names
        prod_selected: List of selected product names
        agg_period: Aggregation period (e.g., "1d" for daily)
        nbins: Number of histogram bins
        L: Lead time (calculates distribution for L-day demand)
    
    Returns:
        dic: Dictionary with (customer, product) keys and distribution information values
    """
    try:
        demand_df.reset_index(inplace=True)
    except ValueError:
        pass
    demand_df["date"] = pd.to_datetime(demand_df["date"])
    demand_df.set_index("date", inplace=True)
    demand_grouped = demand_df.groupby(["cust", "prod"]).resample(agg_period)["demand"].sum()

    dic = {}
    for c in cust_selected:
        for p in prod_selected:
            if (c, p) in demand_grouped:
                data = demand_grouped[c, p].values
                df = pd.Series(data)
                data = df.rolling(window=L).sum()[L-1:].values  # L-day rolling demand sum
                fig, best_dist, best_fit_name, best_fit_params = best_distribution(data)
                fig2, hist_dist = best_histogram(data, nbins=nbins)
                dic[c, p] = fig, fig2, best_dist, hist_dist, best_fit_name, best_fit_params 
            else:
                dic[c, p] = None
    return dic


# =============================================================================
# 6. SAFETY STOCK ALLOCATION FUNCTIONS
# =============================================================================

def max_demand_compute(G, ProcTime, LTLB, LTUB, z, mu, sigma, h):
    """
    Computing max demand for t days and safety stock cost for SSA problem
    
    Args:
        G: Directed graph
        ProcTime: Processing time array
        LTLB: Lower bound of guaranteed lead time
        LTUB: Upper bound of guaranteed lead time
        z: Safety factor
        mu: Demand mean array
        sigma: Demand std deviation array
        h: Holding cost array
    
    Returns:
        Lmax: Maximum net replenishment time + 1
        MaxDemand: Maximum demand for t days
        SafetyCost: Safety stock cost for t days
    """
    mu = mu.reshape((-1, 1))
    sigma = sigma.reshape((-1, 1))
    h = h.reshape((-1, 1))

    MaxNRT = np.zeros(len(G))
    Lmax = 0
    
    for v in G.down_order():
        if G.in_degree(v) == 0:
            MaxNRT[v] = ProcTime[v]
        else:
            MaxGLT = 0
            for w in G.predecessors(v):
                tmp = min(MaxNRT[w], LTUB[w])
                if tmp > MaxGLT:
                    MaxGLT = tmp
            MaxNRT[v] = MaxGLT + ProcTime[v]
            Lmax = max(Lmax, MaxNRT[v])

    Lmax = Lmax + 1
    LmaxArray = np.arange(0, Lmax)
    LmaxArray = LmaxArray.reshape(1, -1)
    LTUB = np.minimum(LTUB, Lmax - 1)
    MaxDemand = mu * LmaxArray + z * sigma * np.sqrt(LmaxArray)
    SafetyCost = h * z * sigma * np.sqrt(LmaxArray)

    return int(Lmax), MaxDemand, SafetyCost


def dynamic_programming_for_SSA(G, ProcTime, LTLB, LTUB, z, mu, sigma, h):
    """
    Dynamic programming algorithm for Safety Stock Allocation problem
    
    Args:
        G: Directed acyclic graph (tree structure)
        ProcTime: Processing time array
        LTLB: Lower bound of guaranteed lead time
        LTUB: Upper bound of guaranteed lead time
        z: Safety factor
        mu: Demand mean array
        sigma: Demand std deviation array
        h: Holding cost array
    
    Returns:
        total_cost: Optimal cost
        Lstar: Optimal guaranteed lead times
        NRT: Optimal net replenishment times
    """
    assert nx.is_tree(G.to_undirected())
    assert nx.is_directed_acyclic_graph(G)

    Infinity = 1.e10000
    Lmax, MaxDemand, SafetyCost = max_demand_compute(G, ProcTime, LTLB, LTUB, z, mu, sigma, h)

    f = defaultdict(lambda: Infinity)
    g = defaultdict(lambda: Infinity)
    fmin = defaultdict(lambda: Infinity)
    gmin = defaultdict(lambda: Infinity)
    c = defaultdict(lambda: Infinity)

    LIstar = defaultdict(lambda: 0)
    Lstar = defaultdict(lambda: 0)
    minL = defaultdict(lambda: 0)
    minLI = defaultdict(lambda: 0)
    NRT = defaultdict(lambda: 0)

    Searched = set([])
    for k in G.dp_order():
        Searched.add(k)
        for L in range(LTLB[k], LTUB[k] + 1):
            for LI in range(Lmax):
                if LI + ProcTime[k] - L >= 0 and LI + ProcTime[k] - L < Lmax:
                    sumCost = SafetyCost[k, LI + ProcTime[k] - L]
                    for i in G.predecessors(k):
                        if (i in Searched):
                            if LI >= 0:
                                sumCost += fmin[i, LI]
                            else:
                                sumCost = 999999.0
                                break
                    for j in G.successors(k):
                        if j in Searched:
                            if L < Lmax:
                                sumCost += gmin[j, L]
                            else:
                                sumCost = 999999.0
                                break
                    c[k, L, LI] = sumCost

        for L in range(LTLB[k], LTUB[k] + 1):
            minCost = 999999.0
            for LI in range(Lmax):
                if LI + ProcTime[k] - L >= 0 and LI + ProcTime[k] - L < Lmax:
                    if c[k, L, LI] < minCost:
                        minCost = c[k, L, LI]
                        minLI[k, L] = LI
            f[k, L] = minCost
            
        for L in range(LTLB[k], Lmax):
            minCost = f[k, L]
            for x in range(LTLB[k], L):
                if minLI[k, x] + ProcTime[k] - x >= 0:
                    if f[k, x] < minCost:
                        minCost = f[k, x]
                        minLI[k, L] = minLI[k, x]
            fmin[k, L] = minCost

        for LI in range(Lmax):
            minCost = 999999.0
            for L in range(LTLB[k], LTUB[k] + 1):
                if LI + ProcTime[k] - L >= 0 and LI + ProcTime[k] - L < Lmax:
                    if c[k, L, LI] < minCost:
                        minCost = c[k, L, LI]
                        minL[k, LI] = L
            g[k, LI] = minCost
            
        for LI in range(Lmax):
            if g[k, LI] < 999999.0:
                minCost = 999999.0
                for x in range(LI, Lmax):
                    if x + ProcTime[k] - minL[k, x] >= 0:
                        if g[k, x] < minCost:
                            minCost = g[k, x]
                            minL[k, LI] = minL[k, x]
                gmin[k, LI] = minCost
            else:
                gmin[k, LI] = 999999.0

    # Construct optimal solution
    reverse_order = []
    for k in G.dp_order():
        reverse_order.append(k)
    reverse_order.reverse()

    for i in G:
        Lstar[i] = -1
        LIstar[i] = -1

    Searched = set([])
    for i in reverse_order:
        Searched.add(i)
        if LIstar[i] >= 0:
            minCost = 999999.0
            LI = LIstar[i]
            for L in range(LTLB[i], LTUB[i] + 1):
                if LI + ProcTime[i] - L >= 0 and LI + ProcTime[i] - L < Lmax:
                    if c[i, L, LI] < minCost:
                        minCost = c[i, L, LI]
                        Lstar[i] = L
        elif Lstar[i] >= 0:
            L = Lstar[i]
            minCost = 999999.0
            for LI in range(Lmax):
                if LI + ProcTime[i] - L >= 0 and LI + ProcTime[i] - L < Lmax:
                    if c[i, L, LI] < minCost:
                        minCost = c[i, L, LI]
                        LIstar[i] = LI
        else:
            minCost = 999999.0
            for LI in range(Lmax):
                for L in range(LTLB[i], LTUB[i] + 1):
                    if LI + ProcTime[i] - L >= 0 and LI + ProcTime[i] - L < Lmax:
                        if c[i, L, LI] < minCost:
                            minCost = c[i, L, LI]
                            Lstar[i] = L
                            LIstar[i] = LI

        # Inform L and LI to adjacent nodes
        for k in G.successors(i):
            if (k not in Searched):
                LIstar[k] = Lstar[i]
        for k in G.predecessors(i):
            if (k not in Searched):
                Lstar[k] = LIstar[i]
    
    # Calculate cost and NRT
    for i in G:
        NRT[i] = LIstar[i] + ProcTime[i] - Lstar[i]
    
    total_cost = 0.0
    for i in G:
        total_cost += SafetyCost[i, NRT[i]]
    
    return total_cost, Lstar, NRT


def tabu_search_for_SSA(G, ProcTime, LTUB, z, mu, sigma, h, max_iter=100, TLLB=1, TLUB=10, seed=1):
    """
    Tabu search algorithm for general network Safety Stock Allocation problem
    
    Args:
        G: Directed acyclic graph
        ProcTime: Processing time array
        LTUB: Upper bound of guaranteed lead time
        z: Safety factor
        mu: Demand mean array
        sigma: Demand std deviation array
        h: Holding cost array
        max_iter: Maximum iterations
        TLLB: Lower bound of tabu length
        TLUB: Upper bound of tabu length
        seed: Random seed
    
    Returns:
        best_cost: Best objective value
        best_sol: Best solution (inventory allocation vector)
        best_NRT: Best net replenishment times
        best_MaxLI: Best maximum lead times
        best_MinLT: Best minimum lead times
    """
    assert nx.is_directed_acyclic_graph(G)

    # Relabel nodes
    mapping = {i: idx for idx, i in enumerate(G)}
    G = nx.relabel_nodes(G, mapping=mapping, copy=True)

    n = len(G)
    np.random.seed(seed)
    b = np.random.randint(0, 2, n)  # Random 0-1 vector

    candidate = []  # Search candidate list
    for i in G:
        if G.out_degree(i) == 0:
            b[i] = 1  # Demand point always has inventory
        else:
            candidate.append(i)

    m = len(candidate)  # Number of neighbors

    NRT = np.zeros(n)
    MaxLI = np.zeros(n)
    MinLT = np.zeros(n)
    # Multi-dimensional arrays for simultaneous neighborhood evaluation
    vNRT = np.zeros((m, n))
    vMaxLI = np.zeros((m, n))
    vMinLT = np.zeros((m, n))

    TabuList = np.zeros(m, int)

    # Initial solution evaluation
    for i in G.down_order():
        if G.in_degree(i) == 0:
            MaxLI[i] = ProcTime[i]
        else:
            max_ = 0.
            for k in G.predecessors(i):
                max_ = max(max_, (1 - b[k]) * MaxLI[k])
            MaxLI[i] = ProcTime[i] + max_

    for i in G.up_order():
        if G.out_degree(i) == 0:
            MinLT[i] = LTUB[i]
        else:
            min_ = np.inf
            for j in G.successors(i):
                min_ = min(min_, NRT[j] + MinLT[j] - ProcTime[j])
            MinLT[i] = min_
        NRT[i] = max(MaxLI[i] - MinLT[i], 0)

    cost = (h * z * sigma * np.sqrt(NRT)).sum()
    print("cost=", cost, b)

    # Store best solution
    best_cost = cost
    prev_cost = cost
    best_sol = b.copy()
    b_prev = b.copy()
    best_NRT = NRT.copy()
    best_MaxLI = MaxLI.copy()
    best_MinLT = MinLT.copy()

    # Tabu search
    ltm_factor = 0.  # Long-term memory factor
    ltm_increase = cost / float(n * max_iter) / 10.
    ltm = np.zeros(m, int)  # Long-term memory

    for iter_ in range(max_iter):
        # Construct neighborhood solutions
        B = []
        for i in candidate:
            newb = b.copy()
            newb[i] = 1 - b[i]  # Bit flip
            B.append(newb)
        B = np.array(B)

        for i in G.down_order():
            if G.in_degree(i) == 0:
                vMaxLI[:, i] = ProcTime[i]
            else:
                max_ = np.zeros(m)
                for k in G.predecessors(i):
                    max_ = np.maximum(max_, (1 - B[:, k]) * vMaxLI[:, k])
                vMaxLI[:, i] = ProcTime[i] + max_

        for i in G.up_order():
            if G.out_degree(i) == 0:
                vMinLT[:, i] = LTUB[i]
            else:
                min_ = np.full(m, np.inf)
                for j in G.successors(i):
                    min_ = np.minimum(min_, vNRT[:, j] + vMinLT[:, j] - ProcTime[j])
                vMinLT[:, i] = min_
            vNRT[:, i] = np.maximum(vMaxLI[:, i] - vMinLT[:, i], 0)

        cost = (h * z * sigma * np.sqrt(vNRT[:, :])).sum(axis=1)

        # Find best non-tabu move
        min_ = np.inf 
        istar = -1
        for i in range(m):
            if iter_ >= TabuList[i]:
                if cost[i] + ltm_factor * ltm[i] < min_:
                    min_ = cost[i] + ltm_factor * ltm[i]
                    istar = i
            else:
                # Aspiration criterion
                if cost[i] < best_cost:
                    if cost[i] < min_:
                        min_ = cost[i]
                        istar = i

        if istar == -1:
            # Clear tabu list
            TLLB = max(TLLB - 1, 1)
            TLUB = max(TLUB - 1, 2)
            TabuList = np.zeros(m, int)
        else:
            b = B[istar]
            ltm[istar] += 1
            if np.all(b_prev == b):  # Same solution => increase tabu length
                TLLB += 1
                TLUB += 1
            elif prev_cost == cost[istar]:  # Same cost => plateau => increase long-term memory
                ltm_factor += ltm_increase

            b_prev = b.copy()
            prev_cost = cost[istar]
            TabuList[istar] = iter_ + np.random.randint(TLLB, TLUB + 1)
            if cost[istar] < best_cost:
                best_cost = cost[istar]
                best_sol = B[istar].copy()
                best_NRT = vNRT[istar].copy()
                best_MaxLI = vMaxLI[istar].copy()
                best_MinLT = vMinLT[istar].copy()
    
    # Set bits to 0 for locations without inventory (NRT ≤ 0)
    for i in range(n):
        if best_NRT[i] <= 0.00001:
            best_sol[i] = 0

    return best_cost, best_sol, best_NRT, best_MaxLI, best_MinLT