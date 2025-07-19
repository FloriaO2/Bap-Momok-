# 샘플 데이터 - API 테스트용
SAMPLE_GROUP_DATA = {
    "group_id": "group_123",
    "data": {
        "candidates": {
            "candidate_1": {
                "added_by": "participant_1",
                "bad": 1,
                "detail": {
                    "addr": "대전 유성구 대덕대로 535",
                    "category": "음식점 > 패스트푸드 > 맥도날드",
                    "kakao_id": 22559525
                },
                "good": 3,
                "name": "맥도날드 대전카이스트점",
                "never": 1,
                "soso": 2,
                "type": "kakao"
            },
            "candidate_2": {
                "added_by": "participant_2",
                "bad": 3,
                "detail": {
                    "category": [
                        "한식",
                        "프랜차이즈",
                        "피자양식",
                        "테이크아웃",
                        "1인분주문"
                    ],
                    "delivery_time": 30,
                    "yogiyo_id": 1072955
                },
                "good": 2,
                "name": "바로덮밥",
                "never": 2,
                "soso": 3,
                "type": "yogiyo"
            },
            "candidate_3": {
                "added_by": "participant_2",
                "bad": 3,
                "detail": {
                    "URL": "https://www.kaist.ac.kr/kr/html/campus/053001.html?dvs_cd=east1",
                    "detail": "오늘 맛있대요"
                },
                "good": 2,
                "name": "동측식당",
                "never": 2,
                "soso": 3,
                "type": "custom"
            }
        },
        "delivery": True,
        "delivery_time": "18:00",
        "offline": True,
        "participants": {
            "participant_1": {
                "nickname": "재호",
                "suggest_complete": False,
                "vote_complete": False
            },
            "participant_2": {
                "nickname": "지원",
                "suggest_complete": True,
                "vote_complete": False
            }
        },
        "radius": 300,
        "start_votingtime": "2025-07-19T18:30:00",
        "state": "suggestion",
        "votes": {
            "participant_1": {
                "candidate_1": "good",
                "candidate_2": "never",
                "candidate_3": "bad"
            },
            "participant_2": {
                "candidate_1": "good",
                "candidate_2": "soso"
            }
        },
        "x": 127.123,
        "y": 37.456
    }
}

# 전체 데이터 구조 샘플 (groups 루트 키 포함)
SAMPLE_FULL_DATA = {
    "groups": {
        "group_123": {
            "candidates": {
                "candidate_1": {
                    "added_by": "participant_1",
                    "bad": 1,
                    "detail": {
                        "addr": "대전 유성구 대덕대로 535",
                        "category": "음식점 > 패스트푸드 > 맥도날드",
                        "kakao_id": 22559525
                    },
                    "good": 3,
                    "name": "맥도날드 대전카이스트점",
                    "never": 1,
                    "soso": 2,
                    "type": "kakao"
                },
                "candidate_2": {
                    "added_by": "participant_2",
                    "bad": 3,
                    "detail": {
                        "category": [
                            "한식",
                            "프랜차이즈",
                            "피자양식",
                            "테이크아웃",
                            "1인분주문"
                        ],
                        "delivery_time": 30,
                        "yogiyo_id": 1072955
                    },
                    "good": 2,
                    "name": "바로덮밥",
                    "never": 2,
                    "soso": 3,
                    "type": "yogiyo"
                },
                "candidate_3": {
                    "added_by": "participant_2",
                    "bad": 3,
                    "detail": {
                        "URL": "https://www.kaist.ac.kr/kr/html/campus/053001.html?dvs_cd=east1",
                        "detail": "오늘 맛있대요"
                    },
                    "good": 2,
                    "name": "동측식당",
                    "never": 2,
                    "soso": 3,
                    "type": "custom"
                }
            },
            "delivery": True,
            "delivery_time": "18:00",
            "offline": True,
            "participants": {
                "participant_1": {
                    "nickname": "재호",
                    "suggest_complete": False,
                    "vote_complete": False
                },
                "participant_2": {
                    "nickname": "지원",
                    "suggest_complete": True,
                    "vote_complete": False
                }
            },
            "radius": 300,
            "start_votingtime": "2025-07-19T18:30:00",
            "state": "suggestion",
            "votes": {
                "participant_1": {
                    "candidate_1": "good",
                    "candidate_2": "never",
                    "candidate_3": "bad"
                },
                "participant_2": {
                    "candidate_1": "good",
                    "candidate_2": "soso"
                }
            },
            "x": 127.123,
            "y": 37.456
        },
        "group_456": {
            "candidates": {
                "candidate_1": {
                    "added_by": "participant_1",
                    "bad": 1,
                    "detail": {
                        "addr": "대전 유성구 대덕대로 535",
                        "category": "음식점 > 패스트푸드 > 맥도날드",
                        "kakao_id": 22559525
                    },
                    "good": 3,
                    "name": "맥도날드 대전카이스트점",
                    "never": 2,
                    "soso": 3,
                    "type": "kakao"
                },
                "candidate_2": {
                    "added_by": "participant_2",
                    "bad": 3,
                    "detail": {
                        "category": [
                            "한식",
                            "프랜차이즈",
                            "피자양식",
                            "테이크아웃",
                            "1인분주문"
                        ],
                        "delivery_time": 30,
                        "yogiyo_id": 1072955
                    },
                    "good": 2,
                    "name": "바로덮밥",
                    "never": 2,
                    "soso": 3,
                    "type": "yogiyo"
                },
                "candidate_3": {
                    "added_by": "participant_2",
                    "bad": 3,
                    "detail": {
                        "URL": "https://www.kaist.ac.kr/kr/html/campus/053001.html?dvs_cd=east1",
                        "detail": "오늘 맛있대요"
                    },
                    "good": 2,
                    "name": "동측식당",
                    "never": 2,
                    "soso": 3,
                    "type": "custom"
                }
            },
            "delivery": True,
            "delivery_time": "18:00",
            "offline": True,
            "participants": {
                "participant_1": {
                    "nickname": "재호",
                    "suggest_complete": False,
                    "vote_complete": False
                },
                "participant_2": {
                    "nickname": "지원",
                    "suggest_complete": True,
                    "vote_complete": False
                }
            },
            "radius": 300,
            "start_votingtime": "2025-07-19T18:30:00",
            "state": "suggestion",
            "votes": {
                "participant_1": {
                    "candidate_1": "good",
                    "candidate_2": "never",
                    "candidate_3": "bad"
                },
                "participant_2": {
                    "candidate_1": "good",
                    "candidate_2": "soso"
                }
            },
            "x": 127.123,
            "y": 37.456
        }
    }
} 