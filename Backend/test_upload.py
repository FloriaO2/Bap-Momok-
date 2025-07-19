import requests
import json

BASE_URL = "http://localhost:8000"

def test_upload():
    print("=== JSON 파일 업로드 테스트 ===\n")
    
    # 1. 서버 상태 확인
    print("1. 서버 상태 확인")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"   상태: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"   오류: {e}")
        return
    
    # 2. JSON 파일 업로드
    print("\n2. JSON 파일 업로드")
    try:
        with open("sample_upload.json", "rb") as f:
            files = {"file": ("sample_upload.json", f, "application/json")}
            response = requests.post(f"{BASE_URL}/upload", files=files)
        
        print(f"   상태: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   메시지: {result['message']}")
            print(f"   파일명: {result['filename']}")
            print(f"   그룹 수: {result['groups_count']}")
        else:
            print(f"   오류: {response.text}")
    except Exception as e:
        print(f"   오류: {e}")
    
    # 3. 업로드된 데이터 확인
    print("\n3. 업로드된 데이터 확인")
    try:
        response = requests.get(f"{BASE_URL}/data")
        print(f"   상태: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   전체 그룹 수: {len(data['groups'])}")
            for group_id in data['groups'].keys():
                print(f"   - {group_id}: {data['groups'][group_id]['state']}")
        else:
            print(f"   오류: {response.text}")
    except Exception as e:
        print(f"   오류: {e}")
    
    # 4. 새로 추가된 그룹 확인
    print("\n4. 새로 추가된 그룹 확인")
    try:
        response = requests.get(f"{BASE_URL}/groups/group_789")
        print(f"   상태: {response.status_code}")
        if response.status_code == 200:
            group_data = response.json()
            print(f"   그룹 상태: {group_data['state']}")
            print(f"   참가자 수: {len(group_data['participants'])}")
            print(f"   후보 수: {len(group_data['candidates'])}")
            print(f"   배달 시간: {group_data['delivery_time']}")
        else:
            print(f"   오류: {response.text}")
    except Exception as e:
        print(f"   오류: {e}")
    
    print("\n=== 업로드 테스트 완료 ===")

if __name__ == "__main__":
    test_upload() 