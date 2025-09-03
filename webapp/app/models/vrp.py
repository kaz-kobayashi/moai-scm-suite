"""
VRP（配送計画システム）用データモデル - 02metroVI.ipynb から完全移植
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Union, Tuple, Set, Any, DefaultDict, Sequence
import pandas as pd
from datetime import datetime

# 02metroVI.ipynb cell-11, 17, 21, 26 から完全移植
class Job(BaseModel):
    id: int
    location: Union[None, Sequence[float]] = None  # 経度・緯度 [lon, lat] を入れる場合
    location_index: Union[None, int] = None       # 行列のインデックスを入れる場合
    setup: Optional[int] = 0
    service: Optional[int] = 0
    delivery: Optional[Sequence[int]] = [0]
    pickup: Optional[Sequence[int]] = [0]
    skills: Optional[Set[int]] = None
    priority: Optional[int] = 0
    time_windows: Optional[Sequence[Tuple[int, int]]] = None
    description: Optional[str] = ""

class ShipmentStep(BaseModel):
    id: int
    location: Optional[Tuple[float, float]] = None
    location_index: Optional[int] = None
    setup: Optional[int] = 0
    service: Optional[int] = 0
    time_windows: Optional[Sequence[Tuple[int, int]]] = None
    description: Optional[str] = ""

class Shipment(BaseModel):
    pickup: ShipmentStep
    delivery: ShipmentStep
    amount: Optional[Sequence[int]] = [0]
    skills: Optional[Set[int]] = None
    priority: Optional[int] = 0

class Break(BaseModel):
    id: int
    time_windows: Optional[Sequence[Tuple[int, int]]] = []
    service: Optional[int] = 0
    description: Optional[str] = ""
    max_load: Optional[Sequence[int]] = None

class VehicleCosts(BaseModel):
    fixed: Optional[int] = 0
    per_hour: int = 3600
    per_km: Optional[int] = 0

class VehicleStep(BaseModel):
    step_type: str
    id: Optional[int] = None
    service_at: Optional[int] = None
    service_after: Optional[int] = None
    service_before: Optional[int] = None

class Vehicle(BaseModel):
    id: int
    start: Union[None, Sequence[float]] = None
    end: Union[None, Sequence[float]] = None
    start_index: Union[None, int] = None
    end_index: Union[None, int] = None
    profile: Optional[str] = "car"
    capacity: Optional[Union[Sequence[int]]] = None
    skills: Optional[Set[int]] = None
    time_window: Optional[Tuple[int, int]] = None
    breaks: Optional[Sequence[Break]] = None
    description: str = ""
    costs: VehicleCosts = VehicleCosts()
    speed_factor: Optional[float] = 1.0
    max_tasks: Optional[int] = None
    max_travel_time: Optional[int] = None
    steps: Optional[Sequence[VehicleStep]] = None

class Matrix(BaseModel):
    durations: Optional[List[List]] = None
    distances: Optional[List[List]] = None
    costs: Optional[List[List]] = None

class Model(BaseModel):
    jobs: Optional[Sequence[Job]] = Field(description="ジョブたち", default=None)
    shipments: Optional[Sequence[Shipment]] = Field(description="輸送たち", default=None)
    vehicles: Optional[Sequence[Vehicle]] = Field(description="運搬車たち", default=None)
    matrices: Optional[Dict[str, Matrix]] = Field(description="行列たち", default=None)

# API用のリクエスト・レスポンスモデル
class VRPRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    
    model_data: Dict
    matrix: bool = False
    threads: int = Field(default=4, description="最適化に使用するスレッド数")
    explore: int = Field(default=5, description="探索の度合い（0-5）")
    osrm: bool = Field(default=False, description="OSRM外部サーバー使用フラグ")
    host: str = Field(default="localhost", description="OSRMホスト名")

class VRPResult(BaseModel):
    input_data: Dict
    output_data: Dict
    error_message: str

# Solution 関連のクラス（cell-37から完全移植）
class Summary(BaseModel):
    cost: int  # total cost for all routes
    routes: int  # number of routes in the solution
    unassigned: int  # number of tasks that could not be served
    setup: int  # total setup time for all routes
    service: int  # total service time for all routes
    duration: int  # total travel time for all routes
    waiting_time: int  # total waiting time for all routes
    priority: int  # total priority sum for all assigned tasks
    violations: Optional[Sequence[str]] = None  # array of violation objects for all routes
    delivery: Optional[Sequence[int]] = None  # total delivery for all routes
    pickup: Optional[Sequence[int]] = None  # total pickup for all routes
    distance: Optional[int] = None  # total distance for all routes

class Violation(BaseModel):
    cause: str
    duration: Optional[int] = None

class Route(BaseModel):
    vehicle: int  # id of the vehicle assigned to this route
    steps: Optional[Sequence[Any]] = None  # array of step objects
    cost: int  # cost for this route
    setup: int  # total setup time for this route
    service: int  # total service time for this route
    duration: int  # total travel time for this route
    waiting_time: int  # total waiting time for this route
    priority: int  # total priority sum for tasks in this route
    violations: Optional[Sequence[Violation]] = None  # array of violation objects for this route
    delivery: Optional[Sequence[int]] = None  # total delivery for tasks in this route
    pickup: Optional[Sequence[int]] = None  # total pickup for tasks in this route
    description: Optional[str] = None  # vehicle description, if provided in input
    geometry: Optional[str] = None  # polyline encoded route geometry
    distance: Optional[int] = None

class Solution(BaseModel):
    code: int  # status code
    error: Optional[str] = None  # error message (present iff code is different from 0)
    summary: Optional[Summary] = None  # object summarizing solution indicators
    unassigned: Optional[Sequence[Any]] = None  # array of objects describing unassigned tasks
    routes: Optional[Sequence[Route]] = None  # array of route objects