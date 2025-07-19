import firebase_admin
from firebase_admin import credentials, db
import os

def initialize_firebase():
    """Firebase를 초기화합니다."""
    try:
        # serviceAccountKey.json 파일 경로
        cred_path = "serviceAccountKey.json"
        
        if not os.path.exists(cred_path):
            raise FileNotFoundError(f"Firebase 설정 파일을 찾을 수 없습니다: {cred_path}")
        
        # Firebase 초기화
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred, {
            'databaseURL': 'https://bap-momok-default-rtdb.firebaseio.com'  # 실제 프로젝트 ID 기반 URL
        })
        
        print("Firebase가 성공적으로 초기화되었습니다.")
        return True
        
    except Exception as e:
        print(f"Firebase 초기화 중 오류 발생: {e}")
        return False

def get_database():
    """Firebase Realtime Database 인스턴스를 반환합니다."""
    return db.reference() 