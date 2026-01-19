importScripts('https://unpkg.com/dexie@3.2.4/dist/dexie.min.js');

// Mude este nome sempre que atualizar o código para forçar a atualização nos usuários
const CACHE_NAME = 'ensina-mais-v8'; 

// Lista COMPLETA dos seus novos arquivos modulares
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css', // Verifique se o nome do seu CSS está correto
  '/app.js',
  '/manifest.json', // Importante para o PWA
  '/firebase-config.js',
  
  // Ícones (se tiver criado a pasta icons)
   '/icons/appstore.png',
   '/icons/playstore.png',

  // Core
  '/js/core/store.js',
  '/js/core/utils.js',

  // Modules
  '/js/modules/scheduler.js',
  '/js/modules/scripts.js',
  '/js/modules/dailyLog.js',
  '/js/modules/reports.js',

  // Components
  '/js/components/Toast.js',
  '/js/components/ScheduleGrid.js',
  '/js/components/TemplatesList.js',

  // Services & DB
  '/js/services/auth.js',
  '/js/services/firestore.js',
  '/js/services/analytics.js',
  '/js/services/forecast.js',
  '/js/services/ai.js',
  '/js/services/whatsapp.js',
  '/js/services/notifications.js',
  '/js/db.js',
  '/js/offline.js',

  // Bibliotecas Externas (Dexie, Firebase, Chart.js se estiver local ou CDN confiável)
  'https://unpkg.com/dexie@3.2.4/dist/dexie.min.js'
];

// ---------- 1. INSTALAÇÃO (Cacheamento Inicial) ----------
self.addEventListener('install', event => {
  // Força o SW a ativar imediatamente, sem esperar o usuário fechar a aba
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Abrindo cache e salvando arquivos...');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('[SW] Falha ao cachear arquivos:', err))
  );
});

// ---------- 2. ATIVAÇÃO (Limpeza de Cache Antigo) ----------
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Apagando cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // Controla a página imediatamente
  );
});

// ---------- 3. FETCH (Interceptação de Rede) ----------
self.addEventListener('fetch', event => {
  // Ignora requisições para o Firestore, Auth e Google APIs (deixa passar direto pra rede)
  // Isso é crucial para não cachear dados dinâmicos do banco de dados
  const url = event.request.url;
  if (url.includes('firestore.googleapis.com') || 
      url.includes('identitytoolkit') || 
      url.includes('securetoken') ||
      url.includes('chrome-extension')) {
    return; 
  }

  // Estratégia: Cache First, falling back to Network
  // Tenta pegar do cache. Se não tiver, vai na rede.
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
            return cachedResponse;
        }
        return fetch(event.request).catch(() => {
            // Se falhar (offline) e não estiver no cache, você poderia retornar uma página de offline customizada aqui
            // return caches.match('/offline.html');
        });
    })
  );
});

// ---------- 4. BACKGROUND SYNC (Sua Lógica Existente) ----------
self.addEventListener('sync', event => {
  if (event.tag === 'sync-atividades') {
    console.info('[SW] Sync event disparado (Background Sync)');
    event.waitUntil(syncAtividades());
  }
});

// Mantive sua função original, mas adicionei proteções
async function syncAtividades() {
  try {
      const db = new Dexie('EnsinaMaisDB');
      db.version(1).stores({ syncQueue: '++queueId, operation, table, payload, timestamp' });
      
      const queue = await db.syncQueue.orderBy('timestamp').toArray();
      if (queue.length === 0) return;

      // ATENÇÃO: O 'self.firebase' não existe nativamente no Service Worker a menos que você importe os scripts do Firebase AQUI dentro também.
      // O SW roda em uma thread separada do app.js.
      // Se essa parte estiver falhando, é porque precisa de importScripts das libs do Firebase no topo.
      
      if (!self.firebase) {
          console.warn('[SW] Firebase SDK não carregado no Worker. Sync adiado.');
          return;
      }

      const user = self.firebase.auth().currentUser;
      if (!user) return;

      for (const q of queue) {
        try {
          const ref = self.firebase.firestore().collection('userData').doc(user.uid).collection('atividades').doc(q.payload.id.toString());
          
          if (q.operation === 'create' || q.operation === 'update') {
              await ref.set(q.payload, { merge: true });
          } else if (q.operation === 'delete') {
              await ref.delete();
          }
          
          await db.syncQueue.delete(q.queueId);
          console.log('[SW] Item sincronizado:', q.queueId);
        } catch (err) {
          console.warn('[SW] Falha ao sincronizar item:', q, err);
        }
      }
  } catch (e) {
      console.error('[SW] Erro geral no sync:', e);
  }
}