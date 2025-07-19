import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import TinderCard from 'react-tinder-card';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const [isCreating, setIsCreating] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [roomId, setRoomId] = useState('');
  
  // 사람 이름 카드 데이터
  const peopleCards = [
    { id: 1, name: '김철수', emoji: '👨' },
    { id: 2, name: '이영희', emoji: '👩' },
    { id: 3, name: '박민수', emoji: '👨‍🦱' },
    { id: 4, name: '최지영', emoji: '👩‍🦰' },
    { id: 5, name: '정현우', emoji: '👨‍💼' },
    { id: 6, name: '한소영', emoji: '👩‍💼' },
    { id: 7, name: '윤태호', emoji: '👨‍🎓' },
    { id: 8, name: '송미라', emoji: '👩‍🎓' },
  ];

  // 고유 방 ID 생성
  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // 방 생성 함수
  const createRoom = () => {
    setIsCreating(true);
    
    // 방 ID 생성
    const roomId = generateRoomId();
    console.log('방 생성됨:', roomId);
    
    // 잠시 후 카드 화면 표시
    setTimeout(() => {
      setIsCreating(false);
      setShowCards(true);
      setCurrentCardIndex(0);
    }, 1000);
  };

  // 방 참여 함수
  const joinRoom = (inputRoomId) => {
    if (inputRoomId && inputRoomId.trim()) {
      setRoomId(inputRoomId.trim());
      setShowMap(true);
    } else {
      Alert.alert('오류', '방 ID를 입력해주세요.');
    }
  };

  // 카드 스와이프 처리
  const onSwipe = (direction, cardId) => {
    const card = peopleCards.find(c => c.id === cardId);
    
    let directionText = '';
    switch (direction) {
      case 'up':
        directionText = '⬆️ 위쪽';
        break;
      case 'down':
        directionText = '⬇️ 아래쪽';
        break;
      case 'left':
        directionText = '⬅️ 왼쪽';
        break;
      case 'right':
        directionText = '➡️ 오른쪽';
        break;
    }
    
    console.log(`${directionText}으로 스와이프: ${card.name}`);
    
    setCurrentCardIndex(prev => prev + 1);
  };

  // 카드가 화면을 벗어났을 때
  const onCardLeftScreen = (cardId) => {
    console.log(`${cardId} 카드가 화면을 벗어났습니다.`);
  };

  // 카드가 끝났을 때
  React.useEffect(() => {
    if (currentCardIndex >= peopleCards.length && showCards) {
      Alert.alert(
        '모든 사람을 확인했습니다!',
        '결과를 확인하시겠습니까?',
        [
          { text: '다시하기', onPress: () => {
            setCurrentCardIndex(0);
            setShowCards(false);
          }},
          { text: '홈으로', onPress: () => {
            setCurrentCardIndex(0);
            setShowCards(false);
          }}
        ]
      );
    }
  }, [currentCardIndex, showCards]);

  // 홈으로 돌아가기
  const goHome = () => {
    setShowCards(false);
    setShowMap(false);
    setCurrentCardIndex(0);
    setRoomId('');
  };

  // 맵 화면에서 뒤로가기
  const goBackFromMap = () => {
    setShowMap(false);
    setRoomId('');
  };

  // 맵 화면 표시 (임시로 간단한 UI)
  if (showMap) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        
        <LinearGradient
          colors={['#FFB6C1', '#FFA07A', '#FF6347']}
          style={styles.background}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={goBackFromMap} style={styles.backButton}>
            <Text style={styles.backButtonText}>← 뒤로</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>위치 선택</Text>
          <Text style={styles.roomId}>방: {roomId}</Text>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.title}>🗺️ 카카오맵</Text>
          <Text style={styles.subtitle}>여기에 카카오맵이 표시됩니다</Text>
          <Text style={styles.description}>
            방 ID: {roomId}
          </Text>
        </View>
      </View>
    );
  }

  // 카드 화면 표시
  if (showCards && currentCardIndex < peopleCards.length) {
    const currentCard = peopleCards[currentCardIndex];
    
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        
        <LinearGradient
          colors={['#FFB6C1', '#FFA07A', '#FF6347']}
          style={styles.background}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={goHome} style={styles.backButton}>
            <Text style={styles.backButtonText}>← 홈으로</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>사람 선택하기</Text>
          <Text style={styles.progressText}>{currentCardIndex + 1} / {peopleCards.length}</Text>
        </View>
        
        <View style={styles.cardContainer}>
          <TinderCard
            key={currentCard.id}
            onSwipe={(dir) => onSwipe(dir, currentCard.id)}
            onCardLeftScreen={() => onCardLeftScreen(currentCard.id)}
            preventSwipe={[]}
            swipeThreshold={20}
            swipeRequirementType="position"
          >
            <View style={styles.card}>
              <Text style={styles.cardEmoji}>{currentCard.emoji}</Text>
              <Text style={styles.cardName}>{currentCard.name}</Text>
            </View>
          </TinderCard>
        </View>
        
        <View style={styles.directionContainer}>
          <View style={styles.directionRow}>
            <View style={styles.directionItem}>
              <Text style={styles.directionText}>⬆️ 위쪽</Text>
            </View>
          </View>
          <View style={styles.directionRow}>
            <View style={styles.directionItem}>
              <Text style={styles.directionText}>⬅️ 왼쪽</Text>
            </View>
            <View style={styles.directionItem}>
              <Text style={styles.directionText}>오른쪽 ➡️</Text>
            </View>
          </View>
          <View style={styles.directionRow}>
            <View style={styles.directionItem}>
              <Text style={styles.directionText}>아래쪽 ⬇️</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>
            카드를 원하는 방향으로 스와이프하세요!
          </Text>
        </View>
      </View>
    );
  }

  // 홈 화면
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <LinearGradient
        colors={['#FFB6C1', '#FFA07A', '#FF6347']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <View style={styles.content}>
        <Text style={styles.title}>Bap! Momok?</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.createButton, isCreating && styles.createButtonDisabled]} 
            activeOpacity={0.8}
            onPress={createRoom}
            disabled={isCreating}
          >
            <Text style={styles.createButtonText}>
              {isCreating ? '방 생성 중...' : 'Create Room'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.joinButton} 
            activeOpacity={0.8}
            onPress={() => {
              Alert.prompt(
                '방 참여',
                '방 ID를 입력하세요:',
                [
                  { text: '취소', style: 'cancel' },
                  { 
                    text: '참여', 
                    onPress: joinRoom
                  }
                ]
              );
            }}
          >
            <Text style={styles.joinButtonText}>Join Room</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 60,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 24,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    opacity: 0.8,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 20,
  },
  createButton: {
    backgroundColor: '#8B0000',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#666',
  },
  createButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  joinButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  joinButtonText: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  progressText: {
    color: 'white',
    fontSize: 14,
  },
  roomId: {
    color: 'white',
    fontSize: 14,
    opacity: 0.8,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: 120,
    height: 120,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  cardEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  directionContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  directionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  directionItem: {
    marginHorizontal: 15,
  },
  directionText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  instructionContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  instructionText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
}); 