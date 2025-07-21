# main.py
import os
from fastapi import FastAPI, HTTPException, UploadFile, File, Body, Query
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
import requests
import threading

# import os
# from dotenv import load_dotenv
# load_dotenv()
# FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
# BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

app = FastAPI(title="Babmomok API", description="밥모임 API 서버")

# 전역 Lock 객체 생성
vote_lock = threading.Lock()

# Firebase 초기화
firebase_initialized = initialize_firebase()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://bap-momok.vercel.app"
    ],  # 실제 프로덕션에서는 특정 도메인만 허용
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
    # 후보가 없으면 바로 종료
    if not group.candidates:
        return

    # 후보별 집계 초기화
    for candidate in group.candidates.values():
        candidate.good = 0
        candidate.bad = 0
        candidate.never = 0
        candidate.soso = 0
    
    # votes가 없으면 집계할 필요 없음
    if not group.votes:
        return

    # votes 순회하며 집계
    for user_vote in group.votes.values():
        for candidate_id, vote_value in user_vote.items():
            candidate = group.candidates.get(candidate_id)
            if candidate:
                if vote_value == "good":
                    candidate.good = (candidate.good or 0) + 1
                elif vote_value == "bad":
                    candidate.bad = (candidate.bad or 0) + 1
                elif vote_value == "never":
                    candidate.never = (candidate.never or 0) + 1
                elif vote_value == "soso":
                    candidate.soso = (candidate.soso or 0) + 1

YOGIYO_AUTH = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTI4Mzc3OTUsImV4cCI6MTc1Mjg0NDk5NSwicGxhdGZvcm0iOiJZR1kiLCJyb2xlIjoidXNlciIsInN1Yl9pZCI6IjkwMjIxNTQyOSIsImJhc2VfdXJsIjoiaHR0cHM6Ly93d3cueW9naXlvLmNvLmtyIn0.nQzYafM-w33dP5Pc8uRQsbk3CQwQmM4zxuHPRYIF2JSnihhl7PwChpcc7KZuM6y9MRgelIjg3OPjSGFpPrwdMi4AzYA5EYph0mLn0rpWi6T_fLTRsRnso3IUc5EGZSNHoC1UXPopBUEMQi7tNLrDbaxRFtcAc-Q5L3GPP0M3438Xick7DZ648JPtk2nAYKNp-uGhLoYG1VFZw3sIl7dgSyoZhzyvD6pmOhNc1GzhXRFtUdTv8WqAr3aKjmjWq6xpzrzmXu7AHkaMifi1N-lm0-Wi25M6XRukWUI4YIgPd7RmyAadRQh7sJm9pQYxPMVnhfdgthxSmTLsSkomn2izqg"
YOGIYO_APISECRET = "fe5183cc3dea12bd0ce299cf110a75a2"
YOGIYO_APIKEY = "iphoneap"

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

@app.post("/groups/{group_id}/votes/{participant_id}")
def cast_vote(group_id: str, participant_id: str, vote: Vote):
    with vote_lock:
        group = get_group(group_id)
        if not group:
            raise HTTPException(status_code=404, detail="그룹을 찾을 수 없습니다")
        
        nickname = group.participants.get(participant_id, {}).get('nickname', '알 수 없는 참가자')

        if participant_id not in group.votes:
            group.votes[participant_id] = {}
        
        for candidate_id, vote_value in vote.root.items():
            group.votes[participant_id][candidate_id] = vote_value
            print(f"[{participant_id}]님이 [{candidate_id}]에 [{vote_value}] 투표함")
        
        update_candidate_vote_counts(group)
        update_group(group_id, GroupUpdate(data=group))
        
        return {"message": "투표가 성공적으로 기록되었습니다"}

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

@app.post("/groups/{group_id}/participants/{participant_id}/suggest-complete")
def set_suggest_complete(group_id: str, participant_id: str):
    group = get_group(group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="그룹을 찾을 수 없습니다")
    participant = group.participants.get(participant_id)
    if participant is None:
        raise HTTPException(status_code=404, detail="참가자를 찾을 수 없습니다")
    participant.suggest_complete = True
    update_group(group_id, GroupUpdate(data=group))
    return {"message": "제안 완료 처리됨", "participant_id": participant_id}

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
    all_candidates.sort(key=lambda x: x["rank"])
    # top3는 never 여부와 상관없이 상위 3개
    top3 = all_candidates[:3]
    return {
        "top3": top3,
        "all_results": all_candidates
    }

@app.get("/groups/{group_id}/yogiyo-restaurants")
def get_yogiyo_restaurants(group_id: str, category: str = Query("", description="카테고리(선택)")):
    """
    그룹의 위치(x, y)로 요기요에서 배달 가능한 식당 전체 정보를 반환합니다.
    category 파라미터로 카테고리 필터링도 지원합니다.
    """
    group = get_group(group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="그룹을 찾을 수 없습니다")

    lat = group.x
    lng = group.y

    url = f"https://www.yogiyo.co.kr/api/v2/restaurants?lat={lat}&lng={lng}&order=rank"
    if category:
        url += f"&category={category}"

    headers = {
        "Authorization": YOGIYO_AUTH,
        "X-Apisecret": YOGIYO_APISECRET,
        "X-Apikey": YOGIYO_APIKEY,
        "User-Agent": "Mozilla/5.0"
    }

    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="요기요 API 호출 실패")

    return response.json()