// 치카치카 친구들 - Service Worker
// 버전 올리면 캐시 갱신됨
const CACHE_NAME = 'chika-v15';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './icons/apple-touch-icon.png',
  './icons/icon-maskable-512.png',
  './audio/music_mountain.mp3',
  './audio/music_hitslab.mp3',
  './audio/music_sigma.mp3',
  './audio/start_1.mp3',
  './audio/start_2.mp3',
  './audio/step0_1.mp3',
  './audio/step0_2.mp3',
  './audio/step1_1.mp3',
  './audio/step1_2.mp3',
  './audio/step2_1.mp3',
  './audio/step2_2.mp3',
  './audio/step3_1.mp3',
  './audio/step3_2.mp3',
  './audio/step4_1.mp3',
  './audio/step4_2.mp3',
  './audio/step5_1.mp3',
  './audio/step5_2.mp3',
  './audio/step6_1.mp3',
  './audio/step6_2.mp3',
  './audio/step7_1.mp3',
  './audio/step7_2.mp3',
  './audio/done_1.mp3',
  './audio/done_2.mp3',
  './audio/pause_1.mp3',
];

// 설치: 핵심 파일 캐시
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] 캐시 설치 중...');
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 활성화: 오래된 캐시 삭제
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] 오래된 캐시 삭제:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// fetch: 캐시 우선, 없으면 네트워크
self.addEventListener('fetch', event => {
  // Anthropic API 요청은 캐시 안 함 (항상 네트워크)
  if (event.request.url.includes('api.anthropic.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // 유효한 응답만 캐시에 저장
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const toCache = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, toCache));
        return response;
      }).catch(() => {
        // 오프라인 + 캐시 없을 때 기본 응답
        return caches.match('./index.html');
      });
    })
  );
});

// 알림 메시지 수신
self.addEventListener('message', event => {
  if(event.data?.type === 'SCHEDULE_NOTIF'){
    const {settings, childName} = event.data;
    // 스케줄 저장 (주기적 체크)
    self.notifSettings = settings;
    self.childName = childName || '친구';
  }
});

// 알림 클릭 시 앱 열기
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({type:'window'}).then(cs=>{
      if(cs.length>0){ cs[0].focus(); return; }
      clients.openWindow('./');
    })
  );
});

// 백그라운드 동기화
self.addEventListener('sync', event => {
  if (event.tag === 'chika-sync') {
    console.log('[SW] 백그라운드 동기화');
  }
});
