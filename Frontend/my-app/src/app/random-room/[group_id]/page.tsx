'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import styles from './random-room.module.css';

// Wheel 컴포넌트를 클라이언트 사이드에서만 로드
const Wheel = dynamic(() => import('react-custom-roulette').then(mod => ({ default: mod.Wheel })), {
  ssr: false,
  loading: () => <div>로딩 중...</div>
});

declare global {
  interface Window {
    kakao: any;
  }
}

interface Restaurant {
  id: string;
  name: string;
  rating: number;
  address: string;
  category: string;
  type: 'kakao' | 'yogiyo';
  detail?: any;
}

interface GroupData {
  delivery: boolean;
  delivery_time: number;
  offline: boolean;
  visit_time: number;
  radius: number;
  x: number;
  y: number;
  state: string;
}

export default function RandomRoomPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.group_id as string;
  const [groupData, setGroupData] = useState<GroupData | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInfo, setModalInfo] = useState<{ type: string, url: string, label: string } | null>(null);
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [menuList, setMenuList] = useState<{name: string, image: string|null}[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState<string|null>(null);

  // 그룹 데이터 가져오기
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
        console.log('그룹 데이터 가져오기 시작:', groupId);
        console.log('BACKEND_URL:', BACKEND_URL);
        
        const response = await fetch(`${BACKEND_URL}/groups/${groupId}`);
        console.log('응답 상태:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('받은 데이터:', data);
          if (data && data.x && data.y) {
            setGroupData(data);
          } else {
            setError('그룹 정보를 가져올 수 없습니다.');
          }
        } else {
          setError('그룹 정보를 가져올 수 없습니다.');
        }
      } catch (err) {
        console.error('그룹 데이터 가져오기 오류:', err);
        setError('그룹 정보를 가져올 수 없습니다.');
      }
    };

    fetchGroupData();
  }, [groupId]);

  // 카테고리 정규화 함수
  const normalizeCategory = (category: string): string => {
    if (category.includes('치킨') || category.includes('닭')) {
      return '치킨';
    } else if (category.includes('피자')) {
      return '피자';
    } else if (category.includes('햄버거') || category.includes('버거') || category.includes('패스트푸드')) {
      return '햄버거';
    } else if (category.includes('중식') || category.includes('중국')) {
      return '중식';
    } else if (category.includes('일식') || category.includes('일본') || category.includes('참치회') || category.includes('돈까스')) {
      return '일식';
    } else if (category.includes('양식') || category.includes('서양') || category.includes('이탈리안')) {
      return '양식';
    } else if (category.includes('한식') || category.includes('한국') || category.includes('해장국') || category.includes('삼겹살') || category.includes('족발') || category.includes('보쌈') || category.includes('한정식')) {
      return '한식';
    } else if (category.includes('카페') || category.includes('커피') || category.includes('디저트')) {
      return '카페';
    } else if (category.includes('분식')) {
      return '분식';
    } else if (category.includes('도시락')) {
      return '도시락';
    } else if (category.includes('뷔페')) {
      return '뷔페';
    } else if (category.includes('해물') || category.includes('생선')) {
      return '해물';
    }
    
    let normalized = category.split('>')[0].trim();
    return normalized;
  };

  // 카카오맵 스크립트 로드 확인
  const waitForKakaoMap = (): Promise<void> => {
    return new Promise((resolve) => {
      console.log('waitForKakaoMap 시작');
      if (typeof window === 'undefined') {
        console.log('서버 사이드에서 실행 중, 바로 resolve');
        resolve();
        return;
      }
      
      // 카카오맵 스크립트가 이미 로드되어 있는지 확인
      if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
        console.log('카카오맵 스크립트 이미 로드됨');
        resolve();
        return;
      }
      
      // 스크립트가 로드되어 있지 않으면 로드
      if (!document.getElementById("kakao-map-script")) {
        console.log('카카오맵 스크립트 로드 시작');
        const script = document.createElement("script");
        script.id = "kakao-map-script";
        script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&autoload=false&libraries=services`;
        script.async = true;
        script.onload = () => {
          console.log('카카오맵 스크립트 로드 완료, maps.load 시작');
          window.kakao.maps.load(() => {
            console.log('카카오맵 maps.load 완료');
            resolve();
          });
        };
        document.head.appendChild(script);
      } else {
        // 스크립트는 있지만 아직 로드 중인 경우
        const checkKakao = () => {
          console.log('카카오맵 스크립트 확인 중...');
          console.log('window.kakao:', !!window.kakao);
          console.log('window.kakao.maps:', !!(window.kakao && window.kakao.maps));
          console.log('window.kakao.maps.services:', !!(window.kakao && window.kakao.maps && window.kakao.maps.services));
          
          if (typeof window !== 'undefined' && window.kakao && window.kakao.maps && window.kakao.maps.services) {
            console.log('카카오맵 스크립트 로드 완료');
            resolve();
          } else {
            console.log('카카오맵 스크립트 아직 로딩 중, 100ms 후 재시도');
            setTimeout(checkKakao, 100);
          }
        };
        checkKakao();
      }
    });
  };

  // 식당 데이터 가져오기 함수
    const fetchRestaurants = async () => {
    console.log('fetchRestaurants 시작');
    console.log('groupData:', groupData);
    
    if (!groupData) {
      console.log('groupData가 없어서 종료');
      return;
    }
    
      setIsLoading(true);
      try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const allRestaurants: Restaurant[] = [];

      // 1. 직접가기 설정된 경우 카카오맵 API 호출
      console.log('카카오맵 API 호출 조건 확인:', { offline: groupData.offline, window: typeof window });
      if (groupData.offline && typeof window !== 'undefined') {
        try {
          console.log('카카오맵 API 호출 시작');
          await waitForKakaoMap();
          
          const ps = new window.kakao.maps.services.Places();
          const allKakaoResults: any[] = [];
          
          // 다양한 검색 키워드로 검색
          const searchKeywords = ['맛집', '음식점', '식당', '한식', '중식', '일식', '양식', '치킨', '피자', '햄버거'];
          
          for (const keyword of searchKeywords) {
            try {
              // 여러 페이지에서 검색 (페이지 1~10)
              for (let page = 1; page <= 10; page++) {
                const searchOptions = {
                  location: new window.kakao.maps.LatLng(groupData.x, groupData.y),
                  radius: groupData.radius,
                  category_group_code: 'FD6',
                  size: 15,
                  page: page
                };

                console.log(`카카오맵 검색: ${keyword} (페이지 ${page})`);
                const kakaoResults = await new Promise((resolve, reject) => {
                  ps.keywordSearch(keyword, (data: any, status: any) => {
                    console.log(`카카오맵 검색 결과 (${keyword} 페이지 ${page}):`, { status, dataLength: data?.length });
                    if (status === window.kakao.maps.services.Status.OK) {
                      console.log(`카카오맵 검색 성공 (${keyword} 페이지 ${page})`);
                      resolve(data);
                    } else {
                      console.log(`카카오맵 검색 실패 (${keyword} 페이지 ${page}):`, status);
                      resolve([]); // 실패해도 빈 배열 반환
                    }
                  }, searchOptions);
                });
                
                allKakaoResults.push(...(kakaoResults as any[]));
                
                // 검색 결과가 적으면 다음 페이지는 건너뛰기
                if ((kakaoResults as any[]).length < 15) break;
              }
            } catch (err) {
              console.error(`카카오맵 API 호출 오류 (${keyword}):`, err);
            }
          }

          // 중복 제거 (ID 기준)
          const uniqueKakaoResults = allKakaoResults.filter((restaurant, index, self) => 
            index === self.findIndex(r => r.id === restaurant.id)
          );
          
          console.log(`카카오맵 총 검색 결과: ${allKakaoResults.length}개, 중복 제거 후: ${uniqueKakaoResults.length}개`);

          const filteredKakao = uniqueKakaoResults
            .map((restaurant: any) => ({
              id: restaurant.id || restaurant.kakao_id,
              name: restaurant.place_name,
              rating: restaurant.rating,
              address: restaurant.address_name,
              category: restaurant.category_name,
              type: 'kakao' as const,
              detail: restaurant
            }));
          allRestaurants.push(...filteredKakao);
        } catch (err) {
          console.error('카카오맵 API 호출 오류:', err);
        }
      }

      // 2. 배달 설정된 경우 요기요 API 호출
      console.log('요기요 API 호출 조건 확인:', { delivery: groupData.delivery });
      if (groupData.delivery) {
        try {
          console.log('요기요 API 호출 시작');
          const yogiyoResponse = await fetch(`${BACKEND_URL}/groups/${groupId}/yogiyo-restaurants`);
          if (yogiyoResponse.ok) {
            const yogiyoData = await yogiyoResponse.json();
            const filteredYogiyo = yogiyoData.restaurants
              .filter((restaurant: any) => restaurant.review_avg >= 4.7)
              .map((restaurant: any) => ({
                id: restaurant.id.toString(),
                name: restaurant.name,
                rating: restaurant.review_avg,
                address: restaurant.address || '배달 가능 지역',
                category: restaurant.categories.join(', '),
                type: 'yogiyo' as const,
                detail: restaurant
              }));
            allRestaurants.push(...filteredYogiyo);
          }
        } catch (err) {
          console.error('요기요 API 호출 오류:', err);
        }
      }

      // 3. 데이터 분배 로직 (카테고리별로 하나씩 선택)
      let finalRestaurants: Restaurant[] = [];
      
      if (groupData.offline && groupData.delivery) {
        const kakaoRestaurants = allRestaurants.filter(r => r.type === 'kakao');
        const yogiyoRestaurants = allRestaurants.filter(r => r.type === 'yogiyo');
        
        const selectByCategory = (restaurants: Restaurant[], maxCount: number): Restaurant[] => {
          const selected: Restaurant[] = [];
          
          const categoryGroups = new Map<string, Restaurant[]>();
          restaurants.forEach(restaurant => {
            const category = normalizeCategory(restaurant.category);
            if (!categoryGroups.has(category)) {
              categoryGroups.set(category, []);
            }
            categoryGroups.get(category)!.push(restaurant);
          });
          
          const categories = Array.from(categoryGroups.keys());
          const shuffledCategories = categories.sort(() => Math.random() - 0.5);
          
          // 1단계: 카테고리별로 하나씩 선택
          for (const category of shuffledCategories) {
            if (selected.length >= maxCount) break;
            
            const restaurantsInCategory = categoryGroups.get(category)!;
            const randomRestaurant = restaurantsInCategory[Math.floor(Math.random() * restaurantsInCategory.length)];
            selected.push(randomRestaurant);
          }
          
          // 2단계: 10개가 안 되면 중복 카테고리에서 추가 선택
          if (selected.length < maxCount) {
            console.log(`카테고리별 선택 후 ${selected.length}개, ${maxCount}개까지 추가 선택`);
            
            // 이미 선택된 식당 ID 집합
            const selectedIds = new Set(selected.map(r => r.id));
            
            // 모든 식당을 하나의 배열로 합치고 랜덤하게 섞기
            const allRestaurants = restaurants.filter(r => !selectedIds.has(r.id));
            const shuffledAll = allRestaurants.sort(() => Math.random() - 0.5);
            
            // 남은 자리만큼 추가 선택
            for (const restaurant of shuffledAll) {
              if (selected.length >= maxCount) break;
              selected.push(restaurant);
            }
          }
          
          console.log(`최종 선택된 식당 개수: ${selected.length}`);
          return selected;
        };
        
        const selectedKakao = selectByCategory(kakaoRestaurants, 5);
        const selectedYogiyo = selectByCategory(yogiyoRestaurants, 5);
        finalRestaurants = [...selectedKakao, ...selectedYogiyo];
      } else if (groupData.offline || groupData.delivery) {
        const selectByCategory = (restaurants: Restaurant[], maxCount: number): Restaurant[] => {
          const selected: Restaurant[] = [];
          
          const categoryGroups = new Map<string, Restaurant[]>();
          restaurants.forEach(restaurant => {
            const category = normalizeCategory(restaurant.category);
            if (!categoryGroups.has(category)) {
              categoryGroups.set(category, []);
            }
            categoryGroups.get(category)!.push(restaurant);
          });
          
          const categories = Array.from(categoryGroups.keys());
          const shuffledCategories = categories.sort(() => Math.random() - 0.5);
          
          // 1단계: 카테고리별로 하나씩 선택
          for (const category of shuffledCategories) {
            if (selected.length >= maxCount) break;
            
            const restaurantsInCategory = categoryGroups.get(category)!;
            const randomRestaurant = restaurantsInCategory[Math.floor(Math.random() * restaurantsInCategory.length)];
            selected.push(randomRestaurant);
          }
          
          // 2단계: 10개가 안 되면 중복 카테고리에서 추가 선택
          if (selected.length < maxCount) {
            console.log(`카테고리별 선택 후 ${selected.length}개, ${maxCount}개까지 추가 선택`);
            
            // 이미 선택된 식당 ID 집합
            const selectedIds = new Set(selected.map(r => r.id));
            
            // 모든 식당을 하나의 배열로 합치고 랜덤하게 섞기
            const allRestaurants = restaurants.filter(r => !selectedIds.has(r.id));
            const shuffledAll = allRestaurants.sort(() => Math.random() - 0.5);
            
            // 남은 자리만큼 추가 선택
            for (const restaurant of shuffledAll) {
              if (selected.length >= maxCount) break;
              selected.push(restaurant);
            }
          }
          
          console.log(`최종 선택된 식당 개수: ${selected.length}`);
          return selected;
        };
        
        finalRestaurants = selectByCategory(allRestaurants, 10);
      }

      // 4. 최종 결과 설정
      console.log('최종 식당 개수:', finalRestaurants.length);
      console.log('최종 식당 목록:', finalRestaurants);
      
      if (finalRestaurants.length === 0) {
        console.log('조건에 맞는 식당이 없음');
        setError('조건에 맞는 식당을 찾을 수 없습니다.');
      } else {
        console.log('식당 목록 설정 완료');
        setRestaurants(finalRestaurants);
      }
      } catch (err) {
      console.error('식당 정보 가져오기 오류:', err);
        setError('식당 정보를 가져올 수 없습니다.');
      } finally {
        setIsLoading(false);
      }
    };

  // groupData가 설정되면 자동으로 새로운 식당 데이터 가져오기
  useEffect(() => {
    if (groupData) {
    fetchRestaurants();
    }
  }, [groupData]);

  // 텍스트를 자동으로 줄바꿈하는 함수
  const formatTextForRoulette = (text: string): string => {
    const cleanName = text
      .replace(/[-_]\s*[가-힣\w\s]*점\s*$/, '')
      .replace(/[-_]\s*[가-힣\w\s]*지점\s*$/, '')
      .replace(/[-_]\s*[가-힣\w\s]*매장\s*$/, '')
      .replace(/[-_]\s*[가-힣\w\s]*스토어\s*$/, '')
      .replace(/[-_]\s*[가-힣\w\s]*센터\s*$/, '')
      .trim();
    
    if (cleanName.length >= 9) {
      const mid = Math.ceil(cleanName.length / 2);
      const firstLine = cleanName.substring(0, mid);
      const secondLine = cleanName.substring(mid);
      return firstLine.split('').join(' ') + '  ' + secondLine.split('').join(' ');
    } else {
      return cleanName.split('').join(' ');
    }
  };

  // react-custom-roulette용 데이터 변환
  const rouletteData = restaurants.map((restaurant, index) => {
    const formattedText = formatTextForRoulette(restaurant.name);
    const isLongText = restaurant.name.replace(/[-_]\s*[가-힣\w\s]*점\s*$/, '').replace(/[-_]\s*[가-힣\w\s]*지점\s*$/, '').replace(/[-_]\s*[가-힣\w\s]*매장\s*$/, '').replace(/[-_]\s*[가-힣\w\s]*스토어\s*$/, '').replace(/[-_]\s*[가-힣\w\s]*센터\s*$/, '').trim().length >= 9;
    
    return {
      option: formattedText,
    style: { 
        backgroundColor: index % 4 === 0 ? '#FFE4E1' :
                  index % 4 === 1 ? '#E6F3FF' :
                  index % 4 === 2 ? '#F0FFF0' :
                  '#FFF8DC',
        textColor: '#4A4A4A',
        fontSize: isLongText ? 10 : 14,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: '1.1'
      }
    };
  });

  // 룰렛 돌리기
  const handleSpinClick = () => {
    if (!mustSpin) {
      const newPrizeNumber = Math.floor(Math.random() * restaurants.length);
      setPrizeNumber(newPrizeNumber);
      setMustSpin(true);
      setSelectedRestaurant(null);
    }
  };

  // 룰렛이 멈췄을 때 호출
  const handleStopSpinning = () => {
    setMustSpin(false);
    
    // 정확한 각도 기반 계산
    // react-custom-roulette는 0도가 양의 x축(3시 방향), 시계방향으로 회전
    // 포인터는 90도(중앙 상단, 12시 방향)에 위치
    // 각 세그먼트의 크기 = 360도 / 세그먼트 개수
    const segmentSize = 360 / restaurants.length;
    
    // prizeNumber는 세그먼트의 중심점을 가리킴 (0도 기준)
    // 포인터는 90도에 있으므로, 실제 포인터가 가리키는 세그먼트는 90도 앞에 있는 세그먼트
    // 90도 = 1/4 회전 = restaurants.length / 4 개의 세그먼트
    const pointerOffset = Math.floor(restaurants.length / 4);
    
    // 포인터가 실제로 가리키는 세그먼트 계산 (90도 앞의 세그먼트)
    const actualPointerIndex = (prizeNumber + pointerOffset) % restaurants.length;
    
    // 실제 당첨되어야 하는 것보다 4칸 오른쪽이 당첨으로 나오므로, 4칸 왼쪽으로 조정
    const finalIndex = (actualPointerIndex - 3 + restaurants.length) % restaurants.length;
    
    console.log('룰렛 결과 계산 (포인터 위치 보정):');
    console.log('- prizeNumber (0도 기준):', prizeNumber);
    console.log('- restaurants.length:', restaurants.length);
    console.log('- segmentSize:', segmentSize);
    console.log('- pointerOffset (90도):', pointerOffset);
    console.log('- actualPointerIndex (90도 기준):', actualPointerIndex);
    console.log('- finalIndex (4칸 왼쪽 조정):', finalIndex);
    console.log('- 선택된 식당:', restaurants[finalIndex]?.name);
    console.log('- 모든 식당:', restaurants.map((r, i) => `${i}: ${r.name}`));
    
    setSelectedRestaurant(restaurants[finalIndex]);
  };

  // 홈으로 이동
  const handleGoHome = () => {
    router.push('/');
  };

  // 새로고침 (새로운 식당 가져오기)
  const handleRefresh = () => {
    setSelectedRestaurant(null);
    setMustSpin(false);
    setPrizeNumber(0);
    if (groupData) {
      fetchRestaurants();
    }
  };

  // 식당 클릭 시 상세정보/메뉴 모달
  const handleRestaurantClick = async (restaurant: Restaurant) => {
    console.log('식당 클릭됨:', restaurant);
    console.log('식당 타입:', restaurant.type);
    console.log('식당 상세정보:', restaurant.detail);
    console.log('요기요 ID 확인:', restaurant.detail?.id);
    console.log('카카오 ID 확인:', restaurant.detail?.kakao_id);
    
    if (restaurant.type === 'kakao' && (restaurant.detail?.kakao_id || restaurant.detail?.id)) {
      const kakaoId = restaurant.detail?.kakao_id || restaurant.detail?.id;
      console.log('카카오 모달 열기, ID:', kakaoId);
      setModalInfo({
        type: 'kakao',
        url: `https://place.map.kakao.com/${kakaoId}`,
        label: `카카오@https://place.map.kakao.com/${kakaoId}`
      });
      setModalOpen(true);
    } else if (restaurant.type === 'yogiyo' && restaurant.detail?.id) {
      console.log('요기요 메뉴 모달 열기');
      setMenuModalOpen(true);
      setMenuLoading(true);
      setMenuError(null);
      setMenuList([]);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/yogiyo-menu/${restaurant.detail.id}`);
        if (!res.ok) throw new Error("메뉴 정보를 불러올 수 없습니다");
        const data = await res.json();
        setMenuList(data.menus || []);
      } catch (e: any) {
        setMenuError(e.message || "메뉴 정보를 불러올 수 없습니다");
      } finally {
        setMenuLoading(false);
      }
    } else {
      console.log('기타 모달 열기 - 조건 확인:');
      console.log('- type이 yogiyo인가?', restaurant.type === 'yogiyo');
      console.log('- detail이 있는가?', !!restaurant.detail);
      console.log('- id가 있는가?', !!restaurant.detail?.id);
      setModalInfo({
        type: 'etc',
        url: '',
        label: `${restaurant.name}\n\n📍 주소: ${restaurant.address}\n⭐ 평점: ${restaurant.rating || '정보 없음'}\n🍽️ 카테고리: ${restaurant.category}`
      });
      setModalOpen(true);
    }
  };

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorMessage}>
          <h2>오류 발생</h2>
          <p>{error}</p>
          <button
            onClick={handleGoHome}
            style={{ 
              background: "#dc3545", 
              color: "#fff", 
              border: "none", 
              borderRadius: "25px", 
              padding: "12px 24px", 
              fontSize: "16px", 
              fontWeight: "bold", 
              cursor: "pointer",
              transition: "all 0.3s ease",
              marginTop: "20px"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#c82333";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#dc3545";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            홈으로
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingMessage}>
          <h2>식당 정보를 가져오는 중...</h2>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.errorMessage}>
          <h2>😔 조건에 맞는 식당을 찾을 수 없어요</h2>
          <p>다음 중 하나를 시도해보세요:</p>
          <ul style={{ textAlign: 'left', marginTop: '15px' }}>
            <li>• 배달 시간을 늘려보세요</li>
            <li>• 방문 가능 거리를 늘려보세요</li>
            <li>• 다른 위치를 선택해보세요</li>
          </ul>
          <button
            onClick={handleGoHome}
            style={{ 
              background: "#dc3545", 
              color: "#fff", 
              border: "none", 
              borderRadius: "25px", 
              padding: "12px 24px", 
              fontSize: "16px", 
              fontWeight: "bold", 
              cursor: "pointer",
              transition: "all 0.3s ease",
              marginTop: "20px"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#c82333";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#dc3545";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            홈으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🍽️ 랜덤 식당 룰렛 🍽️</h1>
        <p>무엇을 먹을까요?</p>
        {restaurants.length < 10 && restaurants.length > 0 && (
          <>
          <p style={{ color: '#ffd700', fontSize: '0.9rem', marginTop: '10px'}}>
            ⚠️ 조건에 맞는 식당이 {restaurants.length}개만 있어요.
          </p>
          <p style={{ color: '#ffd700', fontSize: '0.8rem', marginTop: '0px' }}>
          더 많은 식당을 찾기 위해 조건을 조정해보세요!
        </p>
        </>
        )}
      </div>

      <div className={styles.wheelContainer}>
        <div className={styles.wheelWrapper}>
          <Wheel
            mustStartSpinning={mustSpin}
            prizeNumber={prizeNumber}
            data={rouletteData}
            onStopSpinning={handleStopSpinning}
            backgroundColors={['#ff6b6b', '#4ecdc4']}
            textColors={['white']}
            fontSize={12}
            fontWeight="bold"
            spinDuration={0.8}
            innerRadius={0}
            innerBorderColor="#333"
            innerBorderWidth={3}
            outerBorderColor="#333"
            outerBorderWidth={3}
            radiusLineColor="#333"
            radiusLineWidth={1}
            perpendicularText={false}
            textDistance={50}
            pointerProps={{
              style: {
                transform: 'translate(-50%, -50%)',
                top: '50%',
                left: '50%'
              }
            }}
          />
        </div>

        <button
          className={`${styles.spinButton} ${mustSpin ? styles.spinning : ''}`}
          onClick={handleSpinClick}
          disabled={mustSpin || restaurants.length === 0}
        >
          {mustSpin ? '돌리는 중...' : 'GO!'}
        </button>
      </div>

      {selectedRestaurant && (
        <div className={styles.resultContainer}>
          <h2>🎉 오늘의 식당! 🎉</h2>
          <div 
            className={styles.resultCard}
            onClick={() => handleRestaurantClick(selectedRestaurant)}
            style={{ cursor: 'pointer' }}
          >
            <h3>{selectedRestaurant.name}</h3>
            {selectedRestaurant.type === 'yogiyo' && (
              <p className={styles.rating}>⭐ {selectedRestaurant.rating}</p>
            )}
            <p className={styles.category}>{selectedRestaurant.category}</p>
            <p className={styles.address}>{selectedRestaurant.address}</p>
            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '10px' }}>
              👆 클릭하여 상세정보 보기
            </p>
          </div>
        </div>
      )}

      <div className={styles.restaurantList}>
        <h3>후보 식당들</h3>
        <div className={styles.listContainer}>
          {restaurants.map((restaurant, index) => (
            <div 
              key={restaurant.id} 
              className={styles.restaurantItem}
              onClick={() => handleRestaurantClick(restaurant)}
              style={{ cursor: 'pointer' }}
            >
              <span className={styles.itemNumber}>{index + 1}</span>
              <div className={styles.itemInfo}>
                <h4>{restaurant.name}</h4>
                <p>
                  {restaurant.type === 'yogiyo' && `⭐ ${restaurant.rating} • `}
                  {restaurant.category}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: "30px", marginBottom: "30px", textAlign: "center", display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
        <button
          onClick={handleRefresh}
          style={{ 
            background: "#28a745", 
            color: "#fff", 
            border: "none", 
            borderRadius: "25px", 
            padding: "12px 24px", 
            fontSize: "16px", 
            fontWeight: "bold", 
            cursor: "pointer",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "#218838";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "#28a745";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          🔄 새로운 식당
        </button>
        <button
          onClick={handleGoHome}
          style={{ 
            background: "#dc3545", 
            color: "#fff", 
            border: "none", 
            borderRadius: "25px", 
            padding: "12px 24px", 
            fontSize: "16px", 
            fontWeight: "bold", 
            cursor: "pointer",
            transition: "all 0.3s ease"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "#c82333";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "#dc3545";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          홈으로
        </button>
      </div>

      {modalOpen && modalInfo && (
        <div
          onClick={() => setModalOpen(false)}
          style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 12, width: "90vw", maxWidth: 600, height: "80vh", position: "relative", padding: 0, textAlign: 'center', overflow: 'hidden'
            }}
          >
            <button
              onClick={() => setModalOpen(false)}
              style={{
                position: "absolute", top: 20, right: 20, background: "none", border: "none", fontSize: 24, cursor: "pointer", zIndex: 2
              }}
            >✕</button>
            {modalInfo.type === 'kakao' ? (
              <iframe
                src={modalInfo.url}
                style={{ width: "100%", height: "100%", border: "none", borderRadius: 12 }}
                title="카카오 플레이스"
              />
            ) : modalInfo.type === 'yogiyo' ? (
              <>
                <div style={{fontWeight:'bold', marginBottom:8}}>요기요</div>
                <a href={modalInfo.url} target="_blank" rel="noopener noreferrer" style={{color:'#994d52', wordBreak:'break-all'}}>{modalInfo.label}</a>
              </>
            ) : modalInfo.type === 'custom' ? (
              <>
                <div style={{fontWeight:'bold', marginBottom:8}}>커스텀 링크</div>
                <a href={modalInfo.url} target="_blank" rel="noopener noreferrer" style={{color:'#994d52', wordBreak:'break-all'}}>{modalInfo.label}</a>
              </>
            ) : (
              <div style={{ 
                padding: '20px', 
                whiteSpace: 'pre-line', 
                textAlign: 'left',
                fontSize: '16px',
                lineHeight: '1.6'
              }}>
                {modalInfo.label}
              </div>
            )}
          </div>
        </div>
      )}

      {menuModalOpen && (
        <div
          onClick={() => setMenuModalOpen(false)}
          style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 12, width: "90vw", maxWidth: 500, maxHeight: '80vh', overflowY: 'auto', position: "relative", padding: 24, textAlign: 'center'
            }}
          >
            <button
              onClick={() => setMenuModalOpen(false)}
              style={{
                position: "absolute", top: 20, right: 20, background: "none", border: "none", fontSize: 24, cursor: "pointer", color: '#222'
              }}
            >✕</button>
            <h3 style={{fontWeight:'bold', marginBottom:16, fontSize:20, color:'#222'}}>메뉴</h3>
            {menuLoading ? (
              <div style={{color:'#999', padding:40}}>메뉴 불러오는 중...</div>
            ) : menuError ? (
              <div style={{color:'#e57373', padding:40}}>{menuError}</div>
            ) : menuList.length === 0 ? (
              <div style={{color:'#999', padding:40}}>메뉴가 없습니다</div>
            ) : (
              <div style={{display:'flex', flexWrap:'wrap', gap:20, justifyContent:'center'}}>
                {menuList.map((menu, idx) => (
                  <div key={menu.name + '-' + idx} style={{width:120, textAlign:'center'}}>
                    {menu.image ? (
                      <img src={menu.image} alt={menu.name} style={{width:100, height:80, objectFit:'cover', borderRadius:8, marginBottom:8}} />
                    ) : (
                      <div style={{width:100, height:80, background:'#eee', borderRadius:8, marginBottom:8, display:'flex', alignItems:'center', justifyContent:'center', color:'#aaa', fontSize:13}}>
                        이미지 없음
                      </div>
                    )}
                    <div style={{fontSize:14, color:'#222', fontWeight:500}}>{menu.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 