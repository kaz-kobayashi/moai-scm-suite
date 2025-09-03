"""
ABC分析サービス - 01abc.ipynb から完全移植
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import colorlover as cl
import pickle
import numpy as np
import plotly.graph_objs as go
import plotly.express as px
import plotly

import pandas as pd
import random
import string
import datetime
import math
import json
from collections import OrderedDict, defaultdict
import networkx as nx

from typing import List, Optional, Union, Tuple, Dict, Set, Any, DefaultDict
from scipy import stats

folder = "./data/"

# 01abc.ipynb cell-13 から完全移植
def demand_tree_map(demand_df: pd.DataFrame, 
                    parent: str = "cust",
                    value: str  = "demand") -> plotly.graph_objects.Figure:
    """
    需要と売り上げのtreemapを生成する関数
    """
    
    if "date" not in demand_df.columns:
        demand_df.reset_index(inplace=True)
    demand_df["date"] = pd.to_datetime(demand_df.date)
    demand_df.set_index("date", inplace=True)

    #periods = max( (demand_df.index.max() - demand_df.index.min()).days, 1) #計画期間

    total_demand_df=pd.pivot_table(
            demand_df, index = ["prod","cust"], values = value, aggfunc = "sum")
    total_demand_df.reset_index(inplace=True)
    
    # treemap: pathで入れ子にする順番を決める（最初が親）；
    if parent =="cust":
        fig = px.treemap(total_demand_df, path=['cust','prod'], values=value, color_continuous_scale='RdBu')
    else:
        fig = px.treemap(total_demand_df, path=['prod','cust'], values=value, color_continuous_scale='RdBu')
        
    return fig

# 01abc.ipynb cell-19 から完全移植
def abc_analysis(demand_df: pd.DataFrame, 
                 threshold: List[float], 
                 agg_col: str = "prod", 
                 value: str ="demand",
                 abc_name: str ="abc",
                 rank_name: str ="rank"
                ) -> Tuple[ pd.DataFrame, pd.DataFrame, Dict[int, List[str]] ] :
    """
    ABC分析のための関数
    """
    assert(sum(threshold) >=0.99)
    threshold = np.array(threshold)
    # print(threshold)
    theta = threshold.cumsum()  # ABC分析の閾値(累積量が閾値を超えるまでABCに分類）
    df = demand_df.copy()
    
    #ランク（大きいほど高い）
    temp_series = df.groupby([agg_col])[value].sum()
    sorted_series = temp_series.sort_values(ascending=False)

    # ABC分析のための準備：
    ind = []  # 値を降順に並べたときの名のリスト
    dem = []  # 値の降順に並べたときの量
    for i in sorted_series.index:
        ind.append(str(i))
        dem.append(sorted_series[i])

    # 0,1,2 ...を　A,B,C ... に変換するための辞書 map_ を準備
    alphabet = string.ascii_uppercase
    map_ = {}
    for i, a in enumerate(alphabet):
        map_[i] = a

    cum = 0
    count = 0
    total = sorted_series.sum()
    category = {i: [] for i in range(len(threshold))}
    rank = np.zeros(len(ind), dtype=np.int32)
    abc = np.zeros(len(ind), dtype=str)
    idx_ub = []
    for i in range(len(ind)):
        abc[i] = map_[count]
        cum += dem[i]
        category[count].append(ind[i])
        if cum > total * theta[count] and count<len(theta)-1:
            idx_ub.append(i)
            count += 1
        rank[i] = i

    idx_ub.append(len(ind))
    # print(category[0])       # 0がA, 1がB， 2がC

    agg_df = pd.DataFrame(sorted_series)
    agg_df["rank"] = rank
    agg_df["abc"] = abc

    abc = agg_df.to_dict()["abc"]
    rank = agg_df.to_dict()["rank"]
    name_list = list(df[agg_col])
    abc_column = []
    rank_column = []
    for name in name_list:
        abc_column.append(abc[name])
        rank_column.append(rank[name])
    df[abc_name] = abc_column
    df[rank_name] = rank_column

    return agg_df, df, category

# 01abc.ipynb cell-21 から完全移植
def abc_analysis_all(demand_df: pd.DataFrame,
                     threshold: List[float]
                    ) -> Tuple[ pd.DataFrame, Dict[int, List[str]] ]:
    assert(sum(threshold) >=0.99)
    threshold = np.array(threshold)
    theta = threshold.cumsum()  # ABC分析の閾値(累積量が閾値を超えるまでABCに分類）
    temp_series = pd.pivot_table(demand_df, values="demand", index=["cust","prod"],aggfunc= ["sum","std"] )
    sorted_series = temp_series.sort_values(by=('sum', 'demand'),ascending=False)
    # ABC分析のための準備：
    ind = []  # 値を降順に並べたときの名のリスト
    dem = []  # 値の降順に並べたときの量
    for i,j in sorted_series.index:
        ind.append((str(i),str(j))) 
        dem.append(sorted_series.loc[(i,j),('sum', 'demand')])
    # 0,1,2 ...を　A,B,C ... に変換するための辞書 map_ を準備
    alphabet = string.ascii_uppercase
    map_ = {}
    for i, a in enumerate(alphabet):
        map_[i] = a

    cum = 0
    count = 0
    total = sorted_series[('sum', 'demand')].sum()
    category = {i: [] for i in range(len(threshold))}
    rank = np.zeros(len(ind), dtype=np.int32)
    abc = np.zeros(len(ind), dtype=str)
    idx_ub = []
    for i in range(len(ind)):
        abc[i] = map_[count]
        cum += dem[i]
        category[count].append(ind[i])
        if cum > total * theta[count] and count<len(theta)-1:
            idx_ub.append(i)
            count += 1
        rank[i] = i

    idx_ub.append(len(ind))
    # print(category[0])       # 0がA, 1がB， 2がC

    agg_df = pd.DataFrame(sorted_series)
    agg_df["rank"] = rank
    agg_df["abc"] = abc
    agg_df.columns = agg_df.columns.get_level_values(0) #列の階層をフラットにする．

    return agg_df, category

# 01abc.ipynb cell-30 から完全移植
def add_abc(df: pd.DataFrame, 
            agg_df: pd.DataFrame, 
            col_name: str ="prod",
            value:str ="demand"
           ) -> pd.DataFrame:
    try:
        agg_df.reset_index(inplace=True)
    except:
        pass
    dic_ = {}
    for key, dem, rank, abc in zip(agg_df[col_name], agg_df[value], agg_df["rank"], agg_df["abc"]):
        dic_[ key ] = (dem, rank, abc)
    dem_list, rank_list, abc_list =[], [], [] 
    for row in df.itertuples():
        dem_list.append( dic_[row.name][0] )
        rank_list.append( dic_[row.name][1] )
        abc_list.append( dic_[row.name][2] )
    df[value] = dem_list
    df["rank"] = rank_list
    df["abc"] = abc_list
    return df

# 01abc.ipynb cell-34 から完全移植
def demand_tree_map_with_abc(demand_df: pd.DataFrame, abc_col: str) ->plotly.graph_objects.Figure:
    """
    ABC別に色分けした需要のtreemapを生成する関数
    """
    if "date" not in demand_df.columns:
        demand_df.reset_index(inplace=True)
    demand_df["date"] = pd.to_datetime(demand_df.date)
    demand_df.set_index("date", inplace=True)

    #periods = max( (demand_df.index.max() - demand_df.index.min()).days, 1) #計画期間

    total_demand_df=pd.pivot_table(
            demand_df, index = ["prod","cust",abc_col], values = "demand", aggfunc = "sum")
    total_demand_df.reset_index(inplace=True)
    # Treemap: pathで入れ子にする順番を決める（最初が親）；
    fig = px.treemap(total_demand_df, path=['cust','prod'], values='demand', color=abc_col,
                    color_continuous_scale='RdYlBu')
    return fig

# 01abc.ipynb cell-39 から完全移植
def generate_figures_for_abc_analysis(demand_df: pd.DataFrame,
                                      value: str = "demand",
                                      cumsum: bool =True, 
                                      cust_thres: str = "0.7, 0.2, 0.1",
                                      prod_thres: str = "0.7, 0.2, 0.1"
                                     ) -> Tuple[plotly.graph_objects.Figure,plotly.graph_objects.Figure,
                                                pd.DataFrame,pd.DataFrame,pd.DataFrame] :
    # 閾値の計算
    cust_threshold = [float(i) for i in cust_thres.split(",")]
    prod_threshold = [float(i) for i in prod_thres.split(",")]

    # ABC分析
    agg_df_prod, new_df, category_prod = abc_analysis(
        demand_df, prod_threshold, 'prod', value, "prod_ABC", "prod_rank")
    agg_df_cust, new_df, category_cust = abc_analysis(
        demand_df, cust_threshold, 'cust', value, "customer_ABC", "customer_rank")

    # 製品ABC分析のヒストグラムの生成
    if cumsum:
        agg_df_prod["cumsum_prod"] = agg_df_prod[value].cumsum()

    scales = cl.scales[str(len(category_prod))]['div']['RdYlBu']
    color_list = []
    for i in range(len(category_prod)):
        color_list.extend([scales[i]]*len(category_prod[i]))
    if cumsum:
        y_ = agg_df_prod["cumsum_prod"]/agg_df_prod["cumsum_prod"].iloc[-1]
    else:
        y_ = agg_df_prod[value]
    trace = go.Bar(
        x = agg_df_prod.index,
        y = y_,
        text = agg_df_prod.index,
        marker = dict(
            color=color_list
        )
    )
    data = [trace]
    if cumsum:
        layout = go.Layout(
            xaxis=dict(tickangle=-45),
            yaxis_tickformat = '%'
        )
    else:
        layout = go.Layout(
            xaxis=dict(tickangle=-45)
        )
        
    fig_prod = go.Figure(data=data, layout=layout)

    # 累積和の計算
    if cumsum:
        agg_df_cust["cumsum_cust"] = agg_df_cust[value].cumsum()
    
    # 顧客ABC分析のヒストグラムの生成
    scales = cl.scales[str(len(category_cust))]['div']['RdYlBu']
    color_list = []
    for i in range(len(category_cust)):
        color_list.extend([scales[i]]*len(category_cust[i]))
    if cumsum:
        y_ = agg_df_cust["cumsum_cust"]/agg_df_cust["cumsum_cust"].iloc[-1]
    else:
        y_ = agg_df_cust[value]

    trace = go.Bar(
        x = agg_df_cust.index,
        y = y_,
        #text = agg_df_cust.index,
        marker = dict(
            color = color_list
        )
    )
    data = [trace]
    if cumsum:
        layout = go.Layout(
            xaxis=dict(tickangle=-45),
            yaxis_tickformat = '%'
        )
    else:
        layout = go.Layout(
            xaxis=dict(tickangle=-45)
        )
    fig_cust = go.Figure(data=data, layout=layout)
        
    return fig_prod, fig_cust, agg_df_prod, agg_df_cust, new_df, category_prod, category_cust

# 01abc.ipynb cell-47 から完全移植
def rank_analysis(df: pd.DataFrame, 
                  agg_col: str, 
                  value: str
                 ) -> Dict[str,int]:
    """
    全期間分のランク分析のための関数
    """
    temp_series = df.groupby([agg_col])[ value ].sum()
    sorted_series = temp_series.sort_values(ascending=False)
    rank = { } # ランクを格納する辞書
    count = 0
    for i in sorted_series.index:
        count += 1
        rank[i] = count
    return rank

# 01abc.ipynb cell-48 から完全移植
def rank_analysis_all_periods(df: pd.DataFrame, 
                              agg_col: str, 
                              value: str,
                              agg_period: str
                             ) -> Dict[str, List[int] ]:
    """
    期別のランク分析のための関数
    """
    try:
        df.reset_index(inplace=True)
    except:
        pass
    agg_set = set(df[agg_col].unique())  # 集約する対象の集合
    rank = {}  # 対象の期ごとのランクのリストを保持する辞書
    for i in agg_set:
        rank[i] = []
    df["date"] = pd.to_datetime(df["date"])
    df.set_index("date", inplace=True)
    start_date = pd.to_datetime( min(df.index ))
    end_date = pd.to_datetime( max(df.index))
    for t in pd.date_range(start_date, end_date, freq=agg_period):
        selected_df = df[(df.index >= start_date ) & (df.index <= t)]  #ｓｔｒとdatetimeの比較！
        rank_in_period = rank_analysis(selected_df, agg_col, value)
        for i in rank:
            if i in rank_in_period:
                rank[i].append(rank_in_period[i])
            else:
                rank[i].append(np.nan)
        start_date = t
    df.reset_index(inplace=True)
    return rank

# 01abc.ipynb cell-53 から完全移植
def show_rank_analysis(demand_df: pd.DataFrame,
                       agg_df_prod: pd.DataFrame = None, 
                       value: str ="demand", 
                       agg_period: str ="1m",
                       top_rank: int = 1
                      ) -> plotly.graph_objects.Figure:
    """
    ランク分析の可視化関数
    """
    try:
        demand_df.reset_index(inplace=True)
    except:
        pass
    agg_col = "prod"
    rank = rank_analysis_all_periods(
        demand_df, agg_col, value, agg_period)

    demand_df.set_index("date", inplace=True)
    x_range = [t for t in pd.date_range(
        min(demand_df.index), max(demand_df.index), freq=agg_period)]
    
    # 全期間での順位を得る
    if agg_df_prod is None:
        agg_df_prod, new_df, category_prod = abc_analysis(
            demand_df, [0.7,0.2,0.1] , agg_col, value, "ABC name", "Rank name")

    data = []
    for i in agg_df_prod.index[:int(top_rank)]:  # 全期間での順位の順に表示
        trace = go.Scatter(
            x= x_range,
            y= rank[i],
            mode='markers + lines',
            name=i,
            marker=dict(size=8,
                        #line= dict(width=1),
                        # color= "black",
                        opacity=0.3
                        ),
        )
        data.append(trace)

    layout = go.Layout(
        title="製品のランクの推移",
        xaxis=dict(
            tickangle=-45,
            title='期'
        ),
        yaxis=dict(
            title='ランク'
        )
    )
    return go.Figure(data=data, layout=layout)

# 01abc.ipynb cell-58 から完全移植
def risk_pooling_analysis(demand_df: pd.DataFrame, 
                          agg_period="1w"
                         ) -> pd.DataFrame:
    """
    リスク共同管理の効果を見るための関数

    在庫を顧客側においた場合と、倉庫側においた場合の差を、標準偏差を計算することによって推定する。

    """
    try:
        demand_df.reset_index(inplace=True)
    except:
        pass

    demand_df["date"] = pd.to_datetime(demand_df.date)
    demand_df.set_index("date", inplace=True)

    attr =["prod","agg_std","sum_std","reduction","rank"]
    dic = {i: [] for i in attr}

    rank_dic = rank_analysis(demand_df, 'prod', 'demand')

    for p in set(demand_df["prod"]):
        dem_for_prod = demand_df[demand_df["prod"] == p]
        dem = dem_for_prod.groupby(["cust"]).resample(
            agg_period)["demand"].sum()
        alldem = dem_for_prod.resample(agg_period)["demand"].sum()
        agg_std = alldem.std()
        s = 0.
        for c in set(demand_df.cust):
            if c in dem:
                d = dem[c]
                std = d.std()
                if math.isnan(std):
                    pass
                else:
                    s += d.std()
        # print(p, agg_std, std, agg_std/std) #標準偏差の比率
        # print(p,s - agg_std)  #削減可能な在庫量 （ * z sqrt{LT (week)})
        dic["prod"].append(p)
        dic["agg_std"].append(agg_std)
        dic["sum_std"].append(s)
        dic["reduction"].append(s - agg_std)
        #dic["reduction_ratio"].append( (s - agg_std)/(alldem.sum()+0.00001))
        dic["rank"].append( rank_dic[p] )
    inv_reduction_df = pd.DataFrame(dic, columns=attr)
    inv_reduction_df.set_index("rank",inplace=True)
    inv_reduction_df.sort_values("reduction", ascending=False, inplace=True)
    inv_reduction_df.reset_index(inplace=True)
    return inv_reduction_df

# 01abc.ipynb cell-62 から完全移植
def show_inventory_reduction(inv_reduction_df: pd.DataFrame
                            ) -> plotly.graph_objects.Figure:
    """
    在庫削減量の可視化関数
    """
    try:
        inv_reduction_df.reset_index(inplace=True)
    except ValueError:
        pass
    fig = px.bar(inv_reduction_df,x="prod",y="reduction",color="rank")
    fig.update_layout(xaxis_tickangle=-45)
    return fig

# 01abc.ipynb cell-66 から完全移植
def show_mean_cv(demand_df: pd.DataFrame, prod_df:Optional[pd.DataFrame] = None, show_name: bool =True
                ) -> plotly.graph_objects.Figure:
    try:
        demand_df["date"] = pd.to_datetime(demand_df["date"])
        demand_df.set_index("date", inplace=True)
    except:
        pass
        
    gdf = pd.pivot_table(demand_df, values="demand", index="prod", aggfunc=["sum", "std"])
    gdf = gdf.sort_values(by =('sum', 'demand'), ascending=False)
    gdf.reset_index(inplace=True)
    #gdf.columns =["id", "prod", "mean", "std", "CV"]
    gdf.columns =["prod","sum","std"]
    #gdf["変動係数"] =  np.log(gdf["std"]/(gdf["sum"]+0.0001)+0.0001)
    gdf["変動係数"] =  gdf["std"]/(gdf["sum"]+0.0001)

    if prod_df is not None and "cust_value" in prod_df.columns:
        prod_color ={}
        for row in prod_df.itertuples():
            prod_color[row.name] = row.cust_value 
        color = [ ]
        for row in gdf.itertuples():
            color.append( prod_color[row.prod] )
        gdf["price"] = color
        
    if show_name:
        if prod_df is not None and "cust_value" in prod_df.columns:
            fig = px.scatter(gdf, x="sum", y="変動係数", size="std", hover_name="prod", text="prod", color = "price")
        else:
            fig = px.scatter(gdf, x="sum", y="変動係数", size="std", hover_name="prod", text="prod")
    else:
        if prod_df is not None and "cust_value" in prod_df.columns:
            fig = px.scatter(gdf, x="sum", y="変動係数", hover_name="prod", color = "price" )
        else:
            fig = px.scatter(gdf, x="sum", y="変動係数", hover_name="prod")
    return fig

# 01abc.ipynb cell-71 から完全移植  
def inventory_analysis(prod_df: pd.DataFrame,
                       demand_df: pd.DataFrame,
                       inv_reduction_df: pd.DataFrame,
                       z: float = 1.65,
                       LT: int = 1,
                       r: float = 0.3,
                       num_days: int = 7) ->pd.DataFrame:
    """
    工場における安全在庫量の計算

    工場を１箇所に集約したと仮定する。複数工場の場合には、顧客と工場の紐付け情報が必要になる。
    """
    try:
        demand_df.reset_index(inplace=True)
    except:
        pass
    try:
        prod_df.reset_index(inplace=True)
    except:
        pass
    new_prod_df = prod_df.copy()
    
    demand_df["date"] = pd.to_datetime(demand_df.date)
    demand_df.set_index("date", inplace=True)
    periods = max((demand_df.index.max() - demand_df.index.min()).days, 1)  # 計画期間（日）
    # 工場における製品の総需要量（週の平均）を追加
    average_demand_df = pd.pivot_table(
        demand_df, index="prod", values="demand", aggfunc="sum")*num_days/periods  # per week
    new_prod_df["average_demand"] = average_demand_df.values

    # 工場における製品需要の標準偏差（週あたり）を追加
    inv_reduction_df.reset_index(inplace=True)
    inv_reduction_df.set_index("prod", inplace=True)
    inv_reduction_dic = inv_reduction_df.to_dict()
    agg_std_dic = inv_reduction_dic["agg_std"]
    col = []
    for row in new_prod_df.itertuples():
        col.append(agg_std_dic[row.name])
    new_prod_df["standard_deviation"] = col

    new_prod_df["inv_cost"] = r * new_prod_df.plnt_value /365.*7.  # inventory cost (per week)
    new_prod_df["lot_size"] = np.sqrt(
        2 * new_prod_df.fixed_cost*new_prod_df.average_demand/new_prod_df.inv_cost)
    new_prod_df["safety_inventory"] = z*math.sqrt(LT)*new_prod_df.standard_deviation
    new_prod_df["target_inventory"] = new_prod_df.safety_inventory + LT*new_prod_df.average_demand #基在庫レベル
    new_prod_df["initial_inventory"] = new_prod_df.safety_inventory + new_prod_df.target_inventory//2
    new_prod_df.set_index("index", inplace=True)
    return new_prod_df

# 01abc.ipynb cell-75 から完全移植
def inventory_simulation(prod_df: pd.DataFrame,
                         demand_df: pd.DataFrame
                        ) -> dict[str,pd.DataFrame]:
    """
    (Q,R)方策のシミュレーション
    """
    agg_period ="1d"
    LT = 1
    demand_df.reset_index(inplace=True)
    demand_df["date"] = pd.to_datetime(demand_df.date)
    demand_df.set_index("date", inplace=True)
    production_df = {}
    for row in prod_df.itertuples():
        p = row.name
        dem_for_prod = demand_df[demand_df["prod"] == p]
        dem = dem_for_prod.resample(agg_period)["demand"].sum()
        I = row.initial_inventory
        dic = OrderedDict()
        Prod = defaultdict(int) #initialized to 0
        for t, date in enumerate(dem.index):
            I = I - dem[date] + Prod[t-LT]
            if I < row.safety_inventory:
                Prod[t] = row.target_inventory - I
            dic[date] =[dem[date], I, Prod[t]]
        production_df[p] = pd.DataFrame.from_dict(dic, orient='index', columns=["demand", "inventory", "production"])
    return production_df

# 01abc.ipynb cell-79 から完全移植
def show_prod_inv_demand(prod_name: str, 
                         production_df: pd.DataFrame,
                         scale: str="1d"
                        ) -> plotly.graph_objects.Figure:
    """
    生産、在庫、需要の可視化関数
    """
    p = prod_name
    scale = scale
    df = production_df[p]["production"].resample(scale).sum()

    data = []
    trace = go.Scatter(
              x = list(df.index.astype('str')),
              y = production_df[p]["production"].resample(scale).sum().values.cumsum(),
              line = dict(
                  width = 2),
              name = "生産"
    )
    data.append( trace )

    trace = go.Scatter(
           x = list(df.index.astype('str')),
           y = production_df[p]["demand"].resample(scale).sum().values.cumsum(),
           line = dict(
              color = "green",
              width = 3),
           name = "需要"
        )
    data.append( trace )

    trace = go.Scatter(
           x = list(df.index.astype('str')),
           y = production_df[p]["inventory"].resample(scale).sum().values,
           line = dict(
              color = "orange",
              width = 1),
           name = "在庫"
        )
    data.append( trace )

    layout = go.Layout(
          title="生産，在庫，需要の関係",
          xaxis=dict(
            title='期'
          ),
          yaxis=dict(
            title='(累積）量'
          ),
        )
    fig = go.Figure(data=data, layout=layout)
    return fig

# 01abc.ipynb cell-84 から完全移植
def plot_demands(prod_cust_list: List[str], 
                 demand_df: pd.DataFrame,
                 agg_period: str="1d"
                        ) -> plotly.graph_objects.Figure:
    """
    需要の可視化関数
    """
    try:
        demand_df.reset_index(inplace=True)
    except:
        pass
    idx = pd.date_range(start=demand_df.date.min(), end=demand_df.date.max(), freq=agg_period)
    demand_df["date"] = pd.to_datetime(demand_df["date"])
    demand_df.set_index("date", inplace=True)
    demand_grouped = demand_df.groupby(
        ["prod", "cust"]).resample(agg_period)["demand"].sum()
    
    data = []
    for pc in prod_cust_list:
        prod, cust = pc.split(",")
        series = demand_grouped[(prod, cust)]
    
        trace = go.Scatter(
               x = series.index.astype('str'),
               y = series.values,
               line = dict(
                  width = 1),
               name = f"{prod},{cust}"
            )
        data.append( trace )
    layout = go.Layout(
          title="需要",
          xaxis=dict(
            title='期'
          ),
          yaxis=dict(
            title='需要量'
          ),
        )
    fig = go.Figure(data=data, layout=layout)
    return fig

# 新しいリスクプーリング分析（より詳細な実装）
def risk_pooling_analysis_detailed(demand_df: pd.DataFrame,
                                 pool_groups: List[List[str]],
                                 product: Optional[str] = None,
                                 period: str = "1w",
                                 z_score: float = 1.65) -> Dict[str, Any]:
    """
    詳細なリスクプーリング分析
    
    Args:
        demand_df: 需要データ
        pool_groups: プールするグループのリスト（例：[['cust1', 'cust2'], ['cust3', 'cust4']]）
        product: 特定製品での分析（Noneの場合は全製品）
        period: 集計期間
        z_score: 安全在庫計算用のzスコア
    
    Returns:
        分析結果の辞書
    """
    if "date" not in demand_df.columns:
        demand_df.reset_index(inplace=True)
    demand_df["date"] = pd.to_datetime(demand_df.date)
    demand_df.set_index("date", inplace=True)
    
    # 特定製品に絞る
    if product:
        demand_df = demand_df[demand_df["prod"] == product]
    
    # 結果を格納する辞書
    original_stats = {}
    pooled_stats = {}
    safety_stock_reduction = {}
    risk_reduction = {}
    
    for group_idx, group in enumerate(pool_groups):
        group_name = f"Pool_{group_idx+1}"
        
        # グループ内の顧客の需要データ
        group_demand = demand_df[demand_df["cust"].isin(group)]
        
        # 個別管理の場合の統計
        individual_stats = []
        for cust in group:
            cust_demand = group_demand[group_demand["cust"] == cust]
            if len(cust_demand) > 0:
                cust_resampled = cust_demand.resample(period)["demand"].sum()
                mean_demand = cust_resampled.mean()
                std_demand = cust_resampled.std()
                individual_stats.append({
                    "customer": cust,
                    "mean": mean_demand,
                    "std": std_demand,
                    "safety_stock": z_score * std_demand
                })
        
        # プール管理の場合の統計
        pooled_demand = group_demand.resample(period)["demand"].sum()
        pooled_mean = pooled_demand.mean()
        pooled_std = pooled_demand.std()
        pooled_safety_stock = z_score * pooled_std
        
        # 個別管理の合計
        sum_individual_mean = sum(stat["mean"] for stat in individual_stats)
        sum_individual_safety_stock = sum(stat["safety_stock"] for stat in individual_stats)
        
        # 結果を保存
        original_stats[group_name] = {
            "customers": group,
            "individual_stats": individual_stats,
            "total_mean": sum_individual_mean,
            "total_safety_stock": sum_individual_safety_stock
        }
        
        pooled_stats[group_name] = {
            "mean": pooled_mean,
            "std": pooled_std,
            "safety_stock": pooled_safety_stock
        }
        
        # 削減率の計算
        if sum_individual_safety_stock > 0:
            safety_stock_reduction[group_name] = 1 - (pooled_safety_stock / sum_individual_safety_stock)
            risk_reduction[group_name] = 1 - (pooled_std / sum(stat["std"] for stat in individual_stats))
        else:
            safety_stock_reduction[group_name] = 0
            risk_reduction[group_name] = 0
    
    # 全体のプーリング効率
    total_individual_ss = sum(original_stats[g]["total_safety_stock"] for g in original_stats)
    total_pooled_ss = sum(pooled_stats[g]["safety_stock"] for g in pooled_stats)
    pooling_efficiency = 1 - (total_pooled_ss / total_individual_ss) if total_individual_ss > 0 else 0
    
    return {
        "original_stats": original_stats,
        "pooled_stats": pooled_stats,
        "safety_stock_reduction": safety_stock_reduction,
        "risk_reduction": risk_reduction,
        "pooling_efficiency": pooling_efficiency
    }

# Mean-CV分析
def mean_cv_analysis(demand_df: pd.DataFrame,
                    segment_by: str = "prod",
                    period: str = "1w",
                    cv_threshold: float = 0.5) -> Dict[str, Any]:
    """
    Mean-CV分析（平均需要と変動係数の分析）
    
    Args:
        demand_df: 需要データ
        segment_by: セグメント化の軸（'prod' or 'cust'）
        period: 集計期間
        cv_threshold: 高変動の閾値
    
    Returns:
        分析結果の辞書
    """
    if "date" not in demand_df.columns:
        demand_df.reset_index(inplace=True)
    demand_df["date"] = pd.to_datetime(demand_df.date)
    demand_df.set_index("date", inplace=True)
    
    segments = []
    classification = {}
    management_strategy = {}
    
    # セグメントごとに分析
    for segment in demand_df[segment_by].unique():
        segment_demand = demand_df[demand_df[segment_by] == segment]
        resampled = segment_demand.resample(period)["demand"].sum()
        
        mean_demand = resampled.mean()
        std_demand = resampled.std()
        cv = std_demand / mean_demand if mean_demand > 0 else float('inf')
        
        # 分類
        if mean_demand > resampled.quantile(0.75):
            if cv < cv_threshold:
                class_name = "High Volume, Low Variability"
                strategy = "定期発注、自動補充"
            else:
                class_name = "High Volume, High Variability" 
                strategy = "需要予測重視、バッファ在庫"
        else:
            if cv < cv_threshold:
                class_name = "Low Volume, Low Variability"
                strategy = "最小在庫、定期レビュー"
            else:
                class_name = "Low Volume, High Variability"
                strategy = "受注生産、柔軟な調達"
        
        segments.append({
            "segment": segment,
            "mean": mean_demand,
            "std": std_demand,
            "cv": cv,
            "classification": class_name
        })
        
        classification[segment] = class_name
        management_strategy[segment] = strategy
    
    # プロット用データの作成
    segments_df = pd.DataFrame(segments)
    
    # 散布図用のデータ
    fig = px.scatter(segments_df, x="mean", y="cv", 
                    hover_data=["segment", "std"],
                    color="classification",
                    title="Mean-CV Analysis",
                    labels={"mean": "平均需要", "cv": "変動係数(CV)"})
    
    # 閾値ラインを追加
    fig.add_hline(y=cv_threshold, line_dash="dash", line_color="gray",
                  annotation_text=f"CV閾値 = {cv_threshold}")
    fig.add_vline(x=segments_df["mean"].quantile(0.75), line_dash="dash", line_color="gray",
                  annotation_text="高需要閾値")
    
    # JSON serializable な辞書に変換
    mean_cv_plot = json.loads(fig.to_json())
    
    return {
        "segments": segments,
        "mean_cv_plot": mean_cv_plot,
        "classification": classification,
        "management_strategy": management_strategy
    }