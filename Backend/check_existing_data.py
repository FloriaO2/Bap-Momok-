import requests
import json

BASE_URL = "http://localhost:8000"

def check_existing_data():
    """기존 Firebase 데이터를 확인합니다."""
    
    print("=== 기존 Firebase 데이터 확인 ===\n")
    
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
    
    # 2. 전체 데이터 조회
    print("\n2. 전체 데이터 조회 (GET /data)")
    try:
        response = requests.get(f"{BASE_URL}/data")
        print(f"   상태: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   그룹 수: {len(data['groups'])}")
            for group_id in data['groups'].keys():
                group = data['groups'][group_id]
                print(f"   - {group_id}: {group['state']} (참가자: {len(group['participants'])}, 후보: {len(group['candidates'])})")
        else:
            print(f"   오류: {response.text}")
    except Exception as e:
        print(f"   오류: {e}")
    
    # 3. 모든 그룹 조회
    print("\n3. 모든 그룹 조회 (GET /groups)")
    try:
        response = requests.get(f"{BASE_URL}/groups")
        print(f"   상태: {response.status_code}")
        if response.status_code == 200:
            groups = response.json()
            print(f"   그룹 수: {len(groups)}")
            for group_id in groups.keys():
                group = groups[group_id]
                print(f"   - {group_id}: {group['state']}")
        else:
            print(f"   오류: {response.text}")
    except Exception as e:
        print(f"   오류: {e}")
    
    # 4. 특정 그룹 조회 (group_123이 있다면)
    print("\n4. 특정 그룹 조회 (GET /groups/group_123)")
    try:
        response = requests.get(f"{BASE_URL}/groups/group_123")
        print(f"   상태: {response.status_code}")
        if response.status_code == 200:
            group = response.json()
            print(f"   그룹 상태: {group['state']}")
            print(f"   참가자: {list(group['participants'].keys())}")
            print(f"   후보: {list(group['candidates'].keys())}")
        else:
            print(f"   오류: {response.text}")
    except Exception as e:
        print(f"   오류: {e}")
    
    print("\n=== 확인 완료 ===")

if __name__ == "__main__":
    check_existing_data() 