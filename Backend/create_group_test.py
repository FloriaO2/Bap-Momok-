import requests
import json

BASE_URL = "http://localhost:8000"

def create_simple_group():
    """간단한 그룹을 생성합니다."""
    
    # 생성할 그룹 데이터
    group_data = {
        "group_id": "test_group_001",
        "data": {
            "candidates": {
                "candidate_1": {
                    "added_by": "user_1",
                    "bad": 0,
                    "detail": {
                        "addr": "대전 유성구 대덕대로 535",
                        "category": "음식점 > 패스트푸드 > 맥도날드",
                        "kakao_id": 22559525
                    },
                    "good": 3,
                    "name": "맥도날드 대전카이스트점",
                    "never": 0,
                    "soso": 1,
                    "type": "kakao"
                }
            },
            "delivery": True,
            "delivery_time": "18:00",
            "offline": True,
            "participants": {
                "user_1": {
                    "nickname": "테스트유저",
                    "suggest_complete": True,
                    "vote_complete": False
                }
            },
            "radius": 300,
            "start_votingtime": "2025-01-20T18:30:00",
            "state": "suggestion",
            "votes": {},
            "x": 127.123,
            "y": 37.456
        }
    }
    
    print("=== 그룹 생성 테스트 ===\n")
    
    # 1. 서버 상태 확인
    print("1. 서버 상태 확인")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"   상태: {response.status_code}")
        if response.status_code == 200:
            health = response.json()
            print(f"   메시지: {health['message']}")
            print(f"   Firebase: {health['firebase']}")
        else:
            print(f"   오류: {response.text}")
            return
    except Exception as e:
        print(f"   오류: {e}")
        return
    
    # 2. 그룹 생성
    print("\n2. 그룹 생성")
    try:
        response = requests.post(
            f"{BASE_URL}/groups",
            json=group_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"   상태: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   메시지: {result['message']}")
            print(f"   그룹 ID: {result['group_id']}")
        else:
            print(f"   오류: {response.text}")
    except Exception as e:
        print(f"   오류: {e}")
    
    # 3. 생성된 그룹 확인
    print("\n3. 생성된 그룹 확인")
    try:
        response = requests.get(f"{BASE_URL}/groups/test_group_001")
        print(f"   상태: {response.status_code}")
        if response.status_code == 200:
            group = response.json()
            print(f"   그룹 상태: {group['state']}")
            print(f"   참가자 수: {len(group['participants'])}")
            print(f"   후보 수: {len(group['candidates'])}")
            print(f"   배달 시간: {group['delivery_time']}")
        else:
            print(f"   오류: {response.text}")
    except Exception as e:
        print(f"   오류: {e}")
    
    print("\n=== 테스트 완료 ===")

if __name__ == "__main__":
    create_simple_group() 