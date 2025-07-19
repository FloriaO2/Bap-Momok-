from pydantic import BaseModel, Field, model_validator, RootModel
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
    name: str
    type: str
    detail: dict
    good: Optional[int] = 0
    bad: Optional[int] = 0
    never: Optional[int] = 0
    soso: Optional[int] = 0

class Participant(BaseModel):
    nickname: str
    suggest_complete: bool
    vote_complete: bool

class ParticipantJoin(BaseModel):
    nickname: str

class Vote(RootModel[dict[str, str]]):
    pass

class GroupData(BaseModel):
    candidates: Optional[Dict[str, Candidate]] = Field(
        default=None, description="후보 목록. 입력하지 않으면 빈 객체로 자동 처리됩니다.", example={})
    delivery: bool
    delivery_time: Optional[int] = None
    offline: bool
    participants: Optional[Dict[str, Participant]] = Field(
        default=None, description="참가자 목록. 입력하지 않으면 빈 객체로 자동 처리됩니다.", example={})
    radius: Optional[int] = None
    start_votingtime: str
    state: str = Field(default="suggestion", description="그룹 상태. 입력하지 않으면 suggestion으로 자동 처리됩니다.")
    votes: Optional[Dict[str, Vote]] = Field(
        default=None, description="투표 정보. 입력하지 않으면 빈 객체로 자동 처리됩니다.", example={})
    x: float
    y: float

    @model_validator(mode="after")
    def fill_defaults(self):
        if self.candidates is None:
            self.candidates = {}
        if self.participants is None:
            self.participants = {}
        if self.votes is None:
            self.votes = {}
        errors = []
        if self.delivery and self.delivery_time is None:
            errors.append('delivery가 true일 때 delivery_time은 필수입니다.')
        if self.offline and self.radius is None:
            errors.append('offline이 true일 때 radius는 필수입니다.')
        if errors:
            raise ValueError(' / '.join(errors))
        return self

class GroupsData(BaseModel):
    groups: Dict[str, GroupData]

class GroupCreate(BaseModel):
    data: GroupData

class GroupUpdate(BaseModel):
    data: GroupData 