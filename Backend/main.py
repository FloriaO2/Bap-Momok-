# main.py
from fastapi import FastAPI, HTTPException, UploadFile, File, Body
from fastapi.middleware.cors import CORSMiddleware
from models import GroupCreate, GroupUpdate, GroupData, GroupsData, Candidate, Vote, ParticipantJoin, Participant
from database import (
    create_group, get_group, update_group, delete_group, get_all_groups,
    get_groups_data, create_groups_data, update_groups_data
)
from firebase_config import initialize_firebase
from typing import Dict, Optional
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

def get_next_candidate_id(group):
    existing = group.candidates.keys()
    nums = [int(k.split('_')[-1]) for k in existing if k.startswith('candidate_') and k.split('_')[-1].isdigit()]
    next_num = max(nums) + 1 if nums else 1
    return f"candidate_{next_num}"

def update_candidate_vote_counts(group):
    # 후보별 집계 초기화
    for candidate in group.candidates.values():
        candidate.good = 0
        candidate.bad = 0
        candidate.never = 0
        candidate.soso = 0
    # votes 순회하며 집계
    for user_vote in group.votes.values():
        for candidate_id, vote_value in user_vote.items():
            candidate = group.candidates.get(candidate_id)
            if candidate:
                if vote_value == "good":
                    candidate.good += 1
                elif vote_value == "bad":
                    candidate.bad += 1
                elif vote_value == "never":
                    candidate.never += 1
                elif vote_value == "soso":
                    candidate.soso += 1

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
    
    # 순위 계산
    group.calculate_ranks()
    
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
# /health, /upload, /data 관련 엔드포인트 모두 삭제

@app.post("/groups/{group_id}/candidates")
def add_candidate(group_id: str, candidate: Candidate):
    group = get_group(group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="그룹을 찾을 수 없습니다")
    candidate_id = get_next_candidate_id(group)
    group.candidates[candidate_id] = candidate
    update_group(group_id, GroupUpdate(data=group))
    return {"message": "후보가 성공적으로 추가되었습니다", "candidate_id": candidate_id, "data": group}

@app.post("/groups/{group_id}/candidates/kakao")
def add_kakao_candidate(
    group_id: str,
    added_by: str = Body(...),
    kakao_data: dict = Body(...)
):
    group = get_group(group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="그룹을 찾을 수 없습니다")
    candidate_id = get_next_candidate_id(group)
    detail = {
        "addr": kakao_data.get("address_name"),
        "category": kakao_data.get("category_name"),
        "kakao_id": kakao_data.get("id")
    }
    candidate = Candidate(
        added_by=added_by,
        name=kakao_data.get("place_name", ""),
        type="kakao",
        detail=detail
    )
    group.candidates[candidate_id] = candidate
    update_group(group_id, GroupUpdate(data=group))
    return {"message": "카카오 후보가 성공적으로 추가되었습니다", "candidate_id": candidate_id, "data": group}

@app.post("/groups/{group_id}/candidates/yogiyo")
def add_yogiyo_candidate(
    group_id: str,
    added_by: str = Body(...),
    yogiyo_data: dict = Body(...)
):
    group = get_group(group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="그룹을 찾을 수 없습니다")
    candidate_id = get_next_candidate_id(group)
    detail = {
        "category": yogiyo_data.get("categories", []),
        "delivery_time": yogiyo_data.get("estimated_delivery_time"),
        "yogiyo_id": yogiyo_data.get("id")
    }
    candidate = Candidate(
        added_by=added_by,
        name=yogiyo_data.get("name", ""),
        type="yogiyo",
        detail=detail
    )
    group.candidates[candidate_id] = candidate
    update_group(group_id, GroupUpdate(data=group))
    return {"message": "요기요 후보가 성공적으로 추가되었습니다", "candidate_id": candidate_id, "data": group}

@app.post("/groups/{group_id}/candidates/custom")
def add_custom_candidate(
    group_id: str,
    added_by: str = Body(...),
    name: str = Body(...),
    URL: str = Body(...),
    detail_text: str = Body(...)
):
    group = get_group(group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="그룹을 찾을 수 없습니다")
    candidate_id = get_next_candidate_id(group)
    detail = {
        "URL": URL,
        "detail": detail_text
    }
    candidate = Candidate(
        added_by=added_by,
        name=name,
        type="custom",
        detail=detail
    )
    group.candidates[candidate_id] = candidate
    update_group(group_id, GroupUpdate(data=group))
    return {"message": "커스텀 후보가 성공적으로 추가되었습니다", "candidate_id": candidate_id, "data": group}

@app.post("/groups/{group_id}/votes/{user_id}")
def add_or_update_vote(group_id: str, user_id: str, vote: dict = Body(...)):
    print(f"[add_or_update_vote] group_id={group_id}, user_id={user_id}, vote={vote}")
    group = get_group(group_id)
    if group is None:
        print(f"[add_or_update_vote] 그룹을 찾을 수 없습니다: {group_id}")
        raise HTTPException(status_code=404, detail="그룹을 찾을 수 없습니다")
    prev_vote = group.votes.get(user_id, {})
    prev_vote.update(vote)
    group.votes[user_id] = prev_vote
    print(f"[add_or_update_vote] votes after update: {group.votes}")
    update_candidate_vote_counts(group)
    print(f"[add_or_update_vote] candidates after 집계: {group.candidates}")
    # 순위 계산 및 업데이트
    group.calculate_ranks()
    print(f"[add_or_update_vote] candidates after rank calculation: {group.candidates}")
    # 참가자 voted_count 업데이트
    participant = group.participants.get(user_id)
    if participant:
        participant.voted_count = len([v for v in group.votes[user_id].values() if v in ("good", "bad", "never", "soso")])
        print(f"[add_or_update_vote] participant {user_id} voted_count: {participant.voted_count}")
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

@app.get("/groups/{group_id}/results")
def get_voting_results(group_id: str):
    """투표 결과와 순위를 조회합니다."""
    group = get_group(group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="그룹을 찾을 수 없습니다")
    
    # 순위 계산
    group.calculate_ranks()
    
    # 전체 결과 (순위순으로 정렬)
    all_candidates = []
    for candidate_id, candidate in group.candidates.items():
        all_candidates.append({
            "id": candidate_id,
            "name": candidate.name,
            "type": candidate.type,
            "rank": candidate.rank,
            "good": candidate.good,
            "soso": candidate.soso,
            "bad": candidate.bad,
            "never": candidate.never
        })
    
    # 순위순으로 정렬
    all_candidates.sort(key=lambda x: x["rank"])
    
    # Top3 추출 (never이 없는 후보들 중에서)
    top3_candidates = []
    for candidate in all_candidates:
        if candidate["never"] == 0 and len(top3_candidates) < 3:
            top3_candidates.append({
                "id": candidate["id"],
                "name": candidate["name"],
                "type": candidate["type"],
                "rank": candidate["rank"],
                "good": candidate["good"],
                "soso": candidate["soso"],
                "bad": candidate["bad"],
                "never": candidate["never"]
            })
    
    return {
        "group_id": group_id,
        "total_candidates": len(all_candidates),
        "top3": top3_candidates,
        "all_results": all_candidates
    }