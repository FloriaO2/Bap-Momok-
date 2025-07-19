# main.py
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from models import GroupCreate, GroupUpdate, GroupData, GroupsData, Candidate, Vote, ParticipantJoin, Participant
from database import (
    create_group, get_group, update_group, delete_group, get_all_groups,
    get_groups_data, create_groups_data, update_groups_data
)
from firebase_config import initialize_firebase
from typing import Dict
import json
import random
import string

app = FastAPI(title="Babmomok API", description="밥모임 API 서버")

# Firebase 초기화
firebase_initialized = initialize_firebase()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 실제 프로덕션에서는 특정 도메인만 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def generate_random_id(length=20):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choices(chars, k=length))

@app.get("/")
def read_root():
    return {"message": "Babmomok API 서버에 오신 것을 환영합니다!"}

# 기존 그룹별 API 엔드포인트들
@app.get("/groups")
def get_groups():
    """모든 그룹 데이터를 조회합니다."""
    return get_all_groups()

@app.get("/groups/{group_id}")
def get_group_by_id(group_id: str):
    """특정 그룹 ID의 데이터를 조회합니다."""
    group = get_group(group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="그룹을 찾을 수 없습니다")
    return group

@app.post("/groups")
def create_new_group(group_create: GroupCreate):
    """새로운 그룹 데이터를 생성합니다."""
    try:
        group_id, created_group = create_group(group_create)
        return {
            "message": "그룹이 성공적으로 생성되었습니다",
            "group_id": group_id,
            "data": created_group
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"그룹 생성 중 오류가 발생했습니다: {str(e)}")

@app.put("/groups/{group_id}")
def update_existing_group(group_id: str, group_update: GroupUpdate):
    """기존 그룹 데이터를 업데이트합니다."""
    updated_group = update_group(group_id, group_update)
    if updated_group is None:
        raise HTTPException(status_code=404, detail="업데이트할 그룹을 찾을 수 없습니다")
    
    return {
        "message": "그룹이 성공적으로 업데이트되었습니다",
        "group_id": group_id,
        "data": updated_group
    }

@app.delete("/groups/{group_id}")
def delete_existing_group(group_id: str):
    """그룹 데이터를 삭제합니다."""
    success = delete_group(group_id)
    if not success:
        raise HTTPException(status_code=404, detail="삭제할 그룹을 찾을 수 없습니다")
    
    return {"message": "그룹이 성공적으로 삭제되었습니다", "group_id": group_id}

# 새로운 전체 데이터 구조 API 엔드포인트들
@app.get("/data")
def get_full_data():
    """전체 데이터 구조를 조회합니다 (groups 루트 키 포함)."""
    return get_groups_data()

@app.post("/data")
def create_full_data(groups_data: GroupsData):
    """전체 데이터 구조를 생성합니다 (groups 루트 키 포함)."""
    try:
        created_data = create_groups_data(groups_data)
        return {
            "message": "전체 데이터가 성공적으로 생성되었습니다",
            "data": created_data
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"데이터 생성 중 오류가 발생했습니다: {str(e)}")

@app.put("/data")
def update_full_data(groups_data: GroupsData):
    """전체 데이터 구조를 업데이트합니다 (groups 루트 키 포함)."""
    try:
        updated_data = update_groups_data(groups_data)
        return {
            "message": "전체 데이터가 성공적으로 업데이트되었습니다",
            "data": updated_data
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"데이터 업데이트 중 오류가 발생했습니다: {str(e)}")

# JSON 파일 업로드 기능
@app.post("/upload")
async def upload_json_file(file: UploadFile = File(...)):
    """JSON 파일을 업로드하여 데이터를 생성합니다."""
    if not file.filename.endswith('.json'):
        raise HTTPException(status_code=400, detail="JSON 파일만 업로드 가능합니다")
    
    try:
        content = await file.read()
        data = json.loads(content.decode('utf-8'))
        
        # 데이터 구조 검증
        if "groups" not in data:
            raise HTTPException(status_code=400, detail="올바른 데이터 구조가 아닙니다. 'groups' 키가 필요합니다")
        
        # Pydantic 모델로 검증
        groups_data = GroupsData(**data)
        
        # 데이터베이스에 저장
        created_data = create_groups_data(groups_data)
        
        return {
            "message": "JSON 파일이 성공적으로 업로드되었습니다",
            "filename": file.filename,
            "groups_count": len(created_data.groups),
            "data": created_data
        }
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="올바른 JSON 형식이 아닙니다")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"파일 업로드 중 오류가 발생했습니다: {str(e)}")

@app.post("/groups/{group_id}/candidates")
def add_candidate(group_id: str, candidate_id: str, candidate: Candidate):
    group = get_group(group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="그룹을 찾을 수 없습니다")
    group.candidates[candidate_id] = candidate
    update_group(group_id, GroupUpdate(data=group))
    return {"message": "후보가 성공적으로 추가되었습니다", "candidate_id": candidate_id, "data": group}

@app.post("/groups/{group_id}/votes/{user_id}")
def add_or_update_vote(group_id: str, user_id: str, vote: Vote):
    group = get_group(group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="그룹을 찾을 수 없습니다")
    prev_vote = group.votes.get(user_id, {})
    new_vote = vote.root
    prev_vote.update(new_vote)
    group.votes[user_id] = prev_vote
    update_group(group_id, GroupUpdate(data=group))
    return {"message": "투표 내역이 성공적으로 추가/수정되었습니다", "user_id": user_id, "data": group}

@app.post("/groups/{group_id}/participants")
def join_group(group_id: str, join: ParticipantJoin):
    group = get_group(group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="그룹을 찾을 수 없습니다")
    participant_id = generate_random_id()
    participant = Participant(
        nickname=join.nickname,
        suggest_complete=False,
        vote_complete=False
    )
    group.participants[participant_id] = participant
    update_group(group_id, GroupUpdate(data=group))
    return {"message": "참가자가 성공적으로 추가되었습니다", "participant_id": participant_id, "data": group}

@app.get("/health")
def health_check():
    """서버 상태를 확인합니다."""
    firebase_status = "connected" if firebase_initialized else "disconnected"
    return {
        "status": "healthy", 
        "message": "서버가 정상적으로 작동 중입니다",
        "firebase": firebase_status
    }