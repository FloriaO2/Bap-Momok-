import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ onNavigate }) {
  const [isCreating, setIsCreating] = useState(false);

  // 고유 방 ID 생성
  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // 방 생성 함수
  const createRoom = () => {
    setIsCreating(true);
    
    // 방 ID 생성
    const roomId = generateRoomId();
    const roomUrl = `https://bapmomok.com/room/${roomId}`;
    
    // 실제로는 서버에 방 정보를 저장해야 함
    console.log('방 생성됨:', roomId);
    console.log('방 URL:', roomUrl);
    
    // 잠시 후 알림 표시
    setTimeout(() => {
      setIsCreating(false);
      Alert.alert(
        '방 생성 완료!',
        `방 ID: ${roomId}\nURL: ${roomUrl}`,
        [{ text: '확인', style: 'default' }]
      );
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* 배경 그라데이션 */}
      <LinearGradient
        colors={['#FFB6C1', '#FFA07A', '#FF6347']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* 메인 콘텐츠 */}
      <View style={styles.content}>
        {/* 제목 */}
        <Text style={styles.title}>Bap! Momok?</Text>
        
        {/* 버튼들 */}
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
                    onPress: (roomId) => {
                      if (roomId) {
                        const roomUrl = `https://bapmomok.com/room/${roomId}`;
                        Alert.alert(
                          '방 참여 완료!',
                          `방 ID: ${roomId}\nURL: ${roomUrl}`,
                          [{ text: '확인', style: 'default' }]
                        );
                      }
                    }
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
}); 