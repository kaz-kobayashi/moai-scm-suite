"""
VRP配送計画システムサービス - 02metroVI.ipynb から完全移植
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import json
import subprocess
import platform
import datetime as dt
import pandas as pd
import numpy as np
import ast
import requests
import random
import string
import glob
from collections import defaultdict, OrderedDict
from faker import Faker

from typing import List, Optional, Union, Tuple, Dict, Set, Any, DefaultDict, Sequence

# 02metroVI.ipynb cell-34 から完全移植
def optimize_vrp(model, matrix=False, threads=4, explore=5, cloud=False, osrm=False, host="localhost"):
    """
    VRP最適化メイン関数 - 02metroVI.ipynb cell-34から完全移植
    """
    # 呼び出し方法
    # ./metroVI  -g -i test1.json -o output1.json -a car:test-osrm-intel.aq-cloud.com
    
    if cloud:
        time_stamp = dt.datetime.now().timestamp()
    else:
        time_stamp = 1

    # Get the webapp directory path for temp files and executables
    current_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    input_file = os.path.join(current_dir, f"test{time_stamp}.json")
    output_file = os.path.join(current_dir, f"output{time_stamp}.json")
    
    with open(input_file, 'w') as f:
        f.write(model.model_dump_json(exclude_none=True))
    
    if cloud:
        import pathlib
        p = pathlib.Path(current_dir)  # webapp フォルダ
        script = p / "metroVI"
    else:
        script = os.path.join(current_dir, "metroVI")
    
    # Check if executable exists and add execution permission
    executable_name = ""
    if platform.system() == "Windows":
        executable_name = "metro-win"
        if matrix:
            cmd = f"metro-win -i {input_file} -o {output_file}"
        else:
            cmd = f"metro-win - g -i {input_file} -o {output_file}"
    elif platform.system() == "Darwin":
        # Try ARM binary first (it's a proper executable), then fall back to Intel version
        arm_executable = f"{script}-mac-sillicon"
        intel_executable = f"{script}-mac-intel"
        
        if os.path.exists(arm_executable):
            executable_name = arm_executable
            exec_suffix = "-mac-sillicon"
        elif os.path.exists(intel_executable):
            executable_name = intel_executable
            exec_suffix = "-mac-intel"
        else:
            return "", "", f"No suitable metroVI executable found for macOS"
            
        if matrix:
            cmd = f"{script}{exec_suffix} -i {input_file} -o {output_file}"
        else:
            if osrm:
                cmd = f"{script}{exec_suffix} -g -i {input_file} -o {output_file} -a car:{host}"
            else:
                cmd = f"{script}{exec_suffix} -g -i {input_file} -o {output_file}"
                
    elif platform.system() == "Linux":  # cloud=Trueを仮定
        executable_name = f"{script}-linux-intel"
        if matrix:
            cmd = f"{script}-linux-intel -i {input_file} -o {output_file}"
        else:
            if osrm:
                cmd = f"{script}-linux-intel -g -i {input_file} -o {output_file} -a car:{host}"
            else:
                cmd = f"{script}-linux-intel -g -i {input_file} -o {output_file}"
    else:
        print(platform.system(), "may not be supported.")
        return "", "", f"Unsupported platform: {platform.system()}"

    # Check if executable exists and make it executable
    if executable_name and not executable_name.startswith("metro-win"):
        if not os.path.exists(executable_name):
            return "", "", f"MetroVI executable not found: {executable_name}"
        
        # Make sure executable has proper permissions
        try:
            os.chmod(executable_name, 0o755)
        except OSError as e:
            return "", "", f"Cannot set executable permissions: {str(e)}"
    
    cmd += " -t " + str(threads) + " -x " + str(explore)
    # -g,                              add detailed route geometry and indicators
    # -t THREADS (=4),                 number of threads to use
    # -x EXPLORE (=5),                 exploration level to use (0..5)
 
    try:
        print("Now solving ...")
        print(f"Command: {cmd}")
        o = subprocess.run(cmd.split(), check=True, capture_output=True)
        # print(o.stdout)
        print("Done")
    except subprocess.CalledProcessError as e:
        # print('ERROR:',e.stderr) # ERROR
        error_msg = e.stderr.decode() if e.stderr else str(e)
        return "", "", f"Subprocess error: {error_msg}"
    except FileNotFoundError as e:
        return "", "", f"Executable not found: {str(e)}"

    try:
        with open(input_file, 'r') as example1_in:
            input_dic = json.load(example1_in)

        with open(output_file, 'r') as example1_out:
            output_dic = json.load(example1_out)
            
        try:
            error = output_dic["error"]
        except:
            error = ""
            
        if cloud:
            os.remove(input_file)
            os.remove(output_file)
    except FileNotFoundError as e:
        return "", "", f"File not found: {str(e)}"
    except json.JSONDecodeError as e:
        return "", "", f"JSON decode error: {str(e)}"

    return input_dic, output_dic, error  # errorを返す

# 02metroVI.ipynb cell-39 から完全移植
def make_solution(output_dic: dict) -> tuple:
    """
    解の情報を計算する関数 - 02metroVI.ipynb cell-39から完全移植
    """
    from ..models.vrp import Solution
    
    solution = Solution.model_validate(output_dic)
    sol_dict = solution.model_dump()
    summary_df = pd.DataFrame.from_dict(sol_dict["summary"], orient='index').T

    if len(sol_dict["routes"]) > 0:
        dfs = []
        for r in sol_dict["routes"]:
            df = pd.DataFrame.from_dict(r, orient='index').T
            df.drop("steps", axis=1, inplace=True)
            dfs.append(df)
        route_summary_df = pd.concat(dfs)
        route_summary_df.reset_index(inplace=True)
        route_summary_df.drop("index", axis=1, inplace=True)
    else:
        route_summary_df = None

    if len(sol_dict["unassigned"]) > 0:
        dfs = []
        for r in sol_dict["unassigned"]:
            df = pd.DataFrame.from_dict(r, orient='index').T
            dfs.append(df)
        unassigned_df = pd.concat(dfs)
        unassigned_df.reset_index(inplace=True)
        unassigned_df.drop("index", axis=1, inplace=True)
    else:
        unassigned_df = None

    route_df_dic = {}
    for r in sol_dict["routes"]:
        if len(sol_dict["routes"]) > 0:
            dfs = []
            for j in r["steps"]:
                df = pd.DataFrame.from_dict(j, orient='index').T
                dfs.append(df)
            route_df = pd.concat(dfs)
            route_df.reset_index(inplace=True)
            route_df.drop("index", axis=1, inplace=True)
            route_df_dic[r["vehicle"]] = route_df
    return summary_df, route_summary_df, unassigned_df, route_df_dic

# 02metroVI.ipynb cell-43 から完全移植
def compute_distance_table_for_vrp(node_df, toll=True, host="localhost"):
    """
    移動時間行列の計算関数 - 02metroVI.ipynb cell-43から完全移植
    """
    ROUTE = []
    for row in node_df.itertuples():
        ROUTE.append(ast.literal_eval(row.location))
    route_str = ""
    for (i, j) in ROUTE[:]:
        route_str += str(i) + "," + str(j) + ";"
        
    if toll:
        response = requests.get(f'http://{host}:5000/table/v1/driving/' + route_str[:-1] + "?annotations=distance,duration")
    else:
        response = requests.get(f'http://{host}:5000/table/v1/driving/' + route_str[:-1] + "?annotations=distance,duration&exclude=toll")
    
    result = response.json()
    # print(result)
    try:
        durations = result["durations"]
        distances = result["distances"]
    except:
        raise ValueError 
    return durations, distances

# 02metroVI.ipynb cell-51 から完全移植
def generate_node(n, random_seed=1, prefecture=None, matrix=False, host="localhost"):
    """
    郵便番号データをもとに日本のノードデータをランダムに生成する関数
    """
    # data_generationで分割して保存した郵便番号データが保存されていると仮定
    input_prefix = "./data/output_chunk_"
    
    def combine_csv_files(input_prefix):
        # ファイル名パターンに基づいて分割されたCSVファイルのリストを取得
        file_list = glob.glob(input_prefix + "*.csv")
        # 分割されたCSVファイルを読み込んで結合
        combined_df = pd.concat([pd.read_csv(file) for file in file_list], ignore_index=True)
        return combined_df 
        
    df = combine_csv_files(input_prefix)
    Faker.seed(random_seed)
    np.random.seed(random_seed)
    random.seed(random_seed)
    fake = Faker("ja_JP")
    # select customers 
    if prefecture == None:
        node_df = df.sample(n=n, random_state=random_seed, replace=True)
    else:
        node_df = df[df.name1 == prefecture]
        node_df = node_df.sample(n=n, random_state=random_seed, replace=True)

    node_df.reset_index(inplace=True)
    node_df.drop("index", axis=1, inplace=True)
    
    fake_name = []
    fake_name_set = set([])
    for _ in range(len(node_df)):
        while 1:
            temp = fake.company() + f" 第 {random.randint(1,100)} 支店" 
            if temp not in fake_name_set:
                fake_name.append(temp)
                fake_name_set.add(temp)
                break
    
    node_df.rename(columns={"name1": "都道府県", "name2": "市区町村", "name3": "大字"}, inplace=True) 
    node_df["name"] = fake_name 
    
    node_df["location"] = "[" + node_df.longitude.astype(str) + "," + node_df.latitude.astype(str) + "]"

    if matrix:
        time_df = make_time_df_for_vrp(node_df, host=host)
    else:
        time_df = ""
    
    node_df = node_df.reindex(columns=["name", "zip", "都道府県", "市区町村", "大字", "location"])
        
    return node_df, time_df

def make_time_df_for_vrp(node_df, host="localhost"):
    """
    地点間の距離と移動時間のデータフレームを生成する関数 - 02metroVI.ipynb cell-48から完全移植
    """
    MAX_ = 100000
    try:
        node_df.reset_index(inplace=True)
    except:
        pass
    durations, distances = compute_distance_table_for_vrp(node_df, toll=True, host=host)  # 高速利用
    durations2, distances2 = compute_distance_table_for_vrp(node_df, toll=False, host=host)  # 高速利用なし
    n = len(durations)
    name_dic = node_df.name.to_dict()  # 番号を顧客名に写像
    from_id, to_id, duration, distance, duration2, distance2 = [], [], [], [], [], []
    from_name, to_name = [], [] 
    for i in range(n):
        for j in range(n):
            if durations[i][j] is not None and durations2[i][j] is not None:
                from_id.append(i)
                to_id.append(j)
                from_name.append(name_dic[i])
                to_name.append(name_dic[j])
                duration.append(int(durations[i][j]))
                distance.append(int(distances[i][j]))
                duration2.append(int(durations2[i][j]))
                distance2.append(int(distances2[i][j]))
            else:
                # 距離・時間がない場合
                from_id.append(i)
                to_id.append(j)
                from_name.append(name_dic[i])
                to_name.append(name_dic[j])
                duration.append(MAX_)
                distance.append(MAX_)
                duration2.append(MAX_)
                distance2.append(MAX_)
                
    time_df = pd.DataFrame({"from_node": from_id, "from_name": from_name, "to_node": to_id,
                            "to_name": to_name, "time": duration, "distance": distance, 
                            "time(no toll)": duration2, "distance(no toll)": distance2})
    return time_df

# 02metroVI.ipynb cell-56 から完全移植
def generate_node_normal(n, lat_center, lon_center, std=0.1, country_code="ja_JP", random_seed=1, matrix=False):
    """
    ノードデータを正規分布にしたがってランダムに生成する関数
    """
    Faker.seed(random_seed)
    np.random.seed(random_seed)
    random.seed(random_seed)
    fake = Faker(country_code)
    
    lat_list = np.random.normal(lat_center, std, n)
    lon_list = np.random.normal(lon_center, std, n)
    fake_name = []
    for _ in range(n):
        fake_name.append(fake.company())

    node_df = pd.DataFrame({"name": fake_name, "longitude": lon_list, "latitude": lat_list})
    
    node_df["location"] = "[" + node_df.longitude.astype(str) + "," + node_df.latitude.astype(str) + "]"

    if matrix:
        durations, distances, _ = compute_durations(node_df)
        time_df = make_time_df(node_df, durations, distances)
    else:
        time_df = ""
        
    node_df = node_df.reindex(columns=["name", "location"])
        
    return node_df, time_df

# 02metroVI.ipynb cell-60 から完全移植
def build_model_for_vrp(job_df, shipment_df, vehicle_df, break_df, time_df=None, cost_per_hour=3600):
    """
    データフレームからモデルを生成する関数 - 02metroVI.ipynb cell-60から完全移植
    """
    from ..models.vrp import Vehicle, Job, Shipment, Break, Model, Matrix, VehicleCosts, ShipmentStep
    
    vehicle_L, job_L, shipment_L = [], [], []
    
    if break_df is not None:
        break_L = []
        for i, row in enumerate(break_df.itertuples()):
            break_L.append(Break(id=i, time_windows=ast.literal_eval(row.time_windows),
                               service=int(row.service), max_load=None))
    else:
        break_L = None

    # vehicle
    for i, row in enumerate(vehicle_df.itertuples()):
        temp = {"id": i, 
                "description": row.name, 
                "start": ast.literal_eval(row.start), 
                "start_index": row.start_index,
                "end": ast.literal_eval(row.end), 
                "end_index": row.end_index,
                "capacity": ast.literal_eval(row.capacity),
                "time_window": ast.literal_eval(row.time_window),
                "skills": ast.literal_eval(row.skills)}
        if break_L is not None:
            temp["breaks"] = [break_L[j] for j in ast.literal_eval(row.breaks)]
            
        if len(ast.literal_eval(row.start)) == 0:    
            del temp["start"]  # 発地点なし             
        if len(ast.literal_eval(row.end)) == 0:
            del temp["end"]    # 着地点なし
        if pd.isnull(row.start_index) or row.start_index == -1:
            del temp["start_index"] 
        if pd.isnull(row.end_index) or row.end_index == -1:
            del temp["end_index"]  
        vehicle_L.append(Vehicle(**temp, costs=VehicleCosts(per_hour=cost_per_hour)))
        
    # shipment
    if shipment_df is not None:
        for i, row in enumerate(shipment_df.itertuples()):
            temp = {"amount": ast.literal_eval(row.amount),
                    "skills": ast.literal_eval(row.skills),
                    "priority": int(row.priority),
                    "pickup": {"id": len(job_df)+i, 
                               "service": int(row.pickup_service),
                               "location": ast.literal_eval(row.pickup_location),
                               "location_index": row.pickup_index,  
                               "time_windows": ast.literal_eval(row.pickup_time_windows)}, 
                    "delivery": {"id": len(job_df)+len(shipment_df)+i, 
                                "service": int(row.delivery_service),
                                "location": ast.literal_eval(row.delivery_location),
                                "location_index": row.delivery_index,  
                                "time_windows": ast.literal_eval(row.delivery_time_windows)}}
            if pd.isnull(row.pickup_index) or row.pickup_index == -1 or pd.isnull(row.delivery_index) or row.delivery_index == -1:
                del temp["pickup"]["location_index"] 
                del temp["delivery"]["location_index"] 
                
            shipment_L.append(Shipment(**temp))
    
    # job 
    if job_df is not None:
        for i, row in enumerate(job_df.itertuples()):
            temp = {"id": i, 
                    "description": str(row.name), 
                    "location": ast.literal_eval(row.location), 
                    "location_index": row.location_index,
                    "service": int(row.service),
                    "pickup": ast.literal_eval(row.pickup),
                    "delivery": ast.literal_eval(row.delivery),
                    "time_windows": ast.literal_eval(row.time_windows),
                    "skills": ast.literal_eval(row.skills),
                    "priority": int(row.priority)}
            if pd.isnull(row.location_index) or row.location_index == -1:
                del temp["location_index"] 
            job_L.append(Job(**temp))

    if time_df is not None:  # 移動時間行列を準備
        n = len(job_df) + (len(shipment_df) * 2 if shipment_df is not None else 0) + len(vehicle_df)
        duration = np.full((n, n), 100000)  # 移動時間の上限を10万秒に設定
        for (i, j, t) in zip(time_df["from_node"], time_df["to_node"], time_df["time"]):
            duration[i, j] = t
        L = duration.tolist()
    else:
        L = None
        
    model = Model()
    model.vehicles = vehicle_L
    model.jobs = job_L
    if L is not None:
        model.matrices = {"car": Matrix(durations=L)}

    model.shipments = shipment_L

    return model

# 02metroVI.ipynb cell-64 から完全移植
def generate_vrp(node_df, num_depots=1, open_flag=False, num_jobs=10, num_shipments=0, num_time_windows=1, time_window_bounds=(0, 36000), 
                 time_window_ratio=0.9, delivery_bounds=(0, 0), pickup_bounds=(0, 0), 
                 service_bounds=(0, 0), amount_bounds=(0, 0), priority_bounds=(0, 100), load_factor=0.9,
                 num_customers_per_route=5, skill_flag=False, breaks=None):
    """
    配送計画のランダムな問題例を生成する関数 - 02metroVI.ipynb cell-64から完全移植
    """
    n = num_jobs + num_shipments*2 + num_depots  # number of points 
    assert n == len(node_df)

    # 積み込み積み降ろし (shipment) データフレーム
    pick_loc, del_loc = [], []
    pick_name, del_name = [], [] 
    pick_index, del_index = [], []
    for i in range(num_shipments):
        pick_loc.append(node_df.loc[num_jobs+i, "location"])
        del_loc.append(node_df.loc[num_jobs+num_shipments+i, "location"])
        pick_name.append(node_df.loc[num_jobs+i, "name"])
        del_name.append(node_df.loc[num_jobs+num_shipments+i, "name"])
        pick_index.append(num_jobs+i)
        del_index.append(num_jobs+num_shipments+i)

    shipment_df = pd.DataFrame({"amount": np.random.randint(amount_bounds[0], amount_bounds[1]+1, num_shipments),
                                "pickup_point": pick_name, 
                                "pickup_location": pick_loc,
                                "pickup_index": pick_index, 
                                "pickup_service": np.random.randint(service_bounds[0], service_bounds[1]+1, num_shipments),
                                "delivery_point": del_name, 
                                "delivery_location": del_loc,
                                "delivery_index": del_index, 
                                "delivery_service": np.random.randint(service_bounds[0], service_bounds[1]+1, num_shipments)})
    shipment_df["amount"] = "[" + shipment_df["amount"].astype(str) + "]"
    
    width = (time_window_bounds[1]-time_window_bounds[0])//num_time_windows  # １つの時間枠の設定範囲
    tw_width = int(time_window_ratio*width)  # 時間枠の幅
    
    pickup_time_windows = []
    delivery_time_windows = []
    for i in range(num_shipments):
        tw_list = []
        for j in range(num_time_windows):
            st = np.random.randint(0, (width-tw_width)//2 + 1)
            tw_list.append([width*j+st, width*j+st+tw_width])
        pickup_time_windows.append(str(tw_list))
        
        tw_list = []
        for j in range(num_time_windows):
            st = np.random.randint((width-tw_width)//2, width-tw_width + 1)
            tw_list.append([width*j+st, width*j+st+tw_width])
        delivery_time_windows.append(str(tw_list))
    shipment_df["delivery_time_windows"] = delivery_time_windows
    shipment_df["pickup_time_windows"] = pickup_time_windows
    
    skills = []
    for i in range(num_shipments):
        if skill_flag:
            if random.random() < 0.5:
                skills.append("[0]")
            else:
                skills.append("[0,1]")
        else:
            skills.append("[0]")
            
    shipment_df["skills"] = skills
    shipment_df["priority"] = np.random.randint(priority_bounds[0], priority_bounds[1]+1, num_shipments)

    # ジョブ (job) データフレーム
    job_df = node_df.loc[:num_jobs-1, ["name", "location"]]
    job_df["delivery"] = np.random.randint(delivery_bounds[0], delivery_bounds[1]+1, num_jobs)
    job_df["delivery"] = "[" + job_df["delivery"].astype(str) + "]"
    job_df["pickup"] = np.random.randint(pickup_bounds[0], pickup_bounds[1]+1, num_jobs)
    job_df["pickup"] = "[" + job_df["pickup"].astype(str) + "]"
    job_df["service"] = np.random.randint(service_bounds[0], service_bounds[1]+1, num_jobs)
    job_df["location_index"] = [i for i in range(num_jobs)]

    time_windows = []
    for i in range(num_jobs):
        tw_list = []
        for j in range(num_time_windows):
            st = np.random.randint(0, width-tw_width + 1)
            tw_list.append([width*j+st, width*j+st+tw_width])
        time_windows.append(str(tw_list))
    job_df["time_windows"] = time_windows

    skills = []
    for i in range(num_jobs):
        if skill_flag:
            if random.random() < 0.5:
                skills.append("[0]")
            else:
                skills.append("[0,1]")
        else:
            skills.append("[0]")
            
    job_df["skills"] = skills
    job_df["priority"] = np.random.randint(priority_bounds[0], priority_bounds[1]+1, num_jobs)
    
    # 運搬車 (vehicle) データフレーム      
    demand = pd.concat([job_df.pickup, job_df.delivery, shipment_df.amount], axis=0)
    demand = demand.apply(ast.literal_eval)
    total_load = sum(demand.sum())
    max_load = max(demand.sum())

    total_customers = num_jobs + num_shipments
    average_load = total_load / total_customers
    capacity = int(max(average_load * num_customers_per_route, max_load))
    n_vehicles = max(round(total_load/load_factor/capacity), 1)

    vehicle_df = pd.DataFrame({"name": [f"truck{str(i)}" for i in range(n_vehicles)]})
    
    # 複数デポの場合には順番に割り振る
    depots, depot_index = [], []
    for i in range(n_vehicles):
        depot_id = num_jobs + num_shipments*2 + (i % num_depots)
        depots.append(node_df.iloc[depot_id].location)
        depot_index.append(depot_id)
    vehicle_df["start"] = depots
    vehicle_df["start_index"] = depot_index
    
    if open_flag == True:  # オープンルートの場合
        vehicle_df["end"] = str([])
        vehicle_df["end_index"] = None
    else: 
        vehicle_df["end"] = depots
        vehicle_df["end_index"] = depot_index

    vehicle_df["capacity"] = "["+str(capacity)+"]"
    vehicle_df["time_window"] = str(list(time_window_bounds))

    skills = []
    for i in range(n_vehicles):
        if skill_flag:
            if random.random() < 0.5:
                skills.append("[0]")
            else:
                skills.append("[0,1]")
        else:
            skills.append("[0]")
            
    vehicle_df["skills"] = skills 
    
    if pd.isnull(breaks):
        breaks = []
    vehicle_df["breaks"] = str(breaks)  # lunch and/or supper or empty
    
    shipment_df = shipment_df.reindex(columns=["amount", "pickup_point", "pickup_service", "pickup_time_windows", "pickup_location", "pickup_index",
                                               "delivery_point", "delivery_service", "delivery_time_windows", "delivery_location", "delivery_index",
                                               "skills", "priority"])
    
    job_df = job_df.reindex(columns=["name", "service", "pickup", "delivery", "time_windows", "location", "location_index", "skills", "priority"])
    
    return job_df, shipment_df, vehicle_df

# 02metroVI.ipynb cell-94 から完全移植
def time_convert(sec, start):
    """
    時間変換のユーテリティ関数
    """
    try:
        start = pd.to_datetime(start)
    except:
        pass
    seconds = int(sec)
    try:
        finish = start + dt.timedelta(seconds=seconds)
        return finish.strftime("%Y-%m-%d %H:%M")
    except TypeError:
        finish = (dt.datetime.combine(dt.date(2000, 1, 1), start) + dt.timedelta(seconds=seconds))
        return finish.strftime("%H:%M")