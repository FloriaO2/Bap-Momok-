import requests
import json
from sample_data import SAMPLE_GROUP_DATA, SAMPLE_FULL_DATA

BASE_URL = "http://localhost:8000"

def test_api():
    print("=== Babmomok API 테스트 시작 ===\n")
    
    # 1. 서버 상태 확인
    print("1. 서버 상태 확인")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"   상태: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"   오류: {e}")
        return
    
    # 2. 전체 데이터 구조 생성 (POST /data)
    print("\n2. 전체 데이터 구조 생성 (POST /data)")
    try:
        response = requests.post(
            f"{BASE_URL}/data",
            json=SAMPLE_FULL_DATA,
            headers={"Content-Type": "application/json"}
        )
        print(f"   상태: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   메시지: {result['message']}")
            print(f"   생성된 그룹 수: {len(result['data']['groups'])}")
        else:
            print(f"   오류: {response.text}")
    except Exception as e:
        print(f"   오류: {e}")
    
    # 3. 전체 데이터 구조 조회 (GET /data)
    print("\n3. 전체 데이터 구조 조회 (GET /data)")
    try:
        response = requests.get(f"{BASE_URL}/data")
        print(f"   상태: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   그룹 수: {len(data['groups'])}")
            for group_id in data['groups'].keys():
                print(f"   - {group_id}: {data['groups'][group_id]['state']}")
        else:
            print(f"   오류: {response.text}")
    except Exception as e:
        print(f"   오류: {e}")
    
    # 4. 전체 데이터 구조 업데이트 (PUT /data)
    print("\n4. 전체 데이터 구조 업데이트 (PUT /data)")
    try:
        # 업데이트할 데이터 준비
        update_data = SAMPLE_FULL_DATA.copy()
        # group_123의 상태를 voting으로 변경
        update_data["groups"]["group_123"]["state"] = "voting"
        # participant_1의 suggest_complete를 True로 변경
        update_data["groups"]["group_123"]["participants"]["participant_1"]["suggest_complete"] = True
        
        response = requests.put(
            f"{BASE_URL}/data",
            json=update_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"   상태: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   메시지: {result['message']}")
            print(f"   업데이트된 그룹 수: {len(result['data']['groups'])}")
            print(f"   group_123 상태: {result['data']['groups']['group_123']['state']}")
        else:
            print(f"   오류: {response.text}")
    except Exception as e:
        print(f"   오류: {e}")
    
    # 5. 개별 그룹 조회 (GET /groups/{group_id})
    print("\n5. 개별 그룹 조회 (GET /groups/group_123)")
    try:
        response = requests.get(f"{BASE_URL}/groups/group_123")
        print(f"   상태: {response.status_code}")
        if response.status_code == 200:
            group_data = response.json()
            print(f"   그룹 상태: {group_data['state']}")
            print(f"   참가자 수: {len(group_data['participants'])}")
            print(f"   후보 수: {len(group_data['candidates'])}")
        else:
            print(f"   오류: {response.text}")
    except Exception as e:
        print(f"   오류: {e}")
    
    # 6. 개별 그룹 업데이트 (PUT /groups/{group_id})
    print("\n6. 개별 그룹 업데이트 (PUT /groups/group_123)")
    try:
        update_group_data = {
            "data": SAMPLE_FULL_DATA["groups"]["group_123"].copy()
        }
        # 상태를 complete로 변경
        update_group_data["data"]["state"] = "complete"
        # participant_2의 vote_complete를 True로 변경
        update_group_data["data"]["participants"]["participant_2"]["vote_complete"] = True
        
        response = requests.put(
            f"{BASE_URL}/groups/group_123",
            json=update_group_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"   상태: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   메시지: {result['message']}")
            print(f"   업데이트된 상태: {result['data']['state']}")
        else:
            print(f"   오류: {response.text}")
    except Exception as e:
        print(f"   오류: {e}")
    
    # 7. 모든 그룹 조회 (GET /groups)
    print("\n7. 모든 그룹 조회 (GET /groups)")
    try:
        response = requests.get(f"{BASE_URL}/groups")
        print(f"   상태: {response.status_code}")
        if response.status_code == 200:
            groups = response.json()
            print(f"   그룹 수: {len(groups)}")
            for group_id, group_data in groups.items():
                print(f"   - {group_id}: {group_data['state']}")
        else:
            print(f"   오류: {response.text}")
    except Exception as e:
        print(f"   오류: {e}")
    
    print("\n=== 테스트 완료 ===")

if __name__ == "__main__":
    test_api() 