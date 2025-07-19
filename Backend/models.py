from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Union
from datetime import datetime

class DetailKakao(BaseModel):
    addr: str
    category: str
    kakao_id: int

class DetailYogiyo(BaseModel):
    category: List[str]
    delivery_time: int
    yogiyo_id: int

class DetailCustom(BaseModel):
    URL: str
    detail: str

class Candidate(BaseModel):
    added_by: str
    bad: int
    detail: Union[DetailKakao, DetailYogiyo, DetailCustom]
    good: int
    name: str
    never: int
    soso: int
    type: str

class Participant(BaseModel):
    nickname: str
    suggest_complete: bool
    vote_complete: bool

class Vote(BaseModel):
    candidate_1: Optional[str] = None
    candidate_2: Optional[str] = None
    candidate_3: Optional[str] = None

class GroupData(BaseModel):
    candidates: Dict[str, Candidate]
    delivery: bool
    delivery_time: str
    offline: bool
    participants: Dict[str, Participant]
    radius: int
    start_votingtime: str
    state: str
    votes: Dict[str, Vote]
    x: float
    y: float

class GroupsData(BaseModel):
    groups: Dict[str, GroupData]

class GroupCreate(BaseModel):
    group_id: str
    data: GroupData

class GroupUpdate(BaseModel):
    data: GroupData 