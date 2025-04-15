import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Sua configuração do Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: "G-X4MP4PG4Q8"
};

// Log para debug
console.log('Verificando configuração do Firebase:', {
  apiKey: firebaseConfig.apiKey ? 'Configurado' : 'Não configurado',
  authDomain: firebaseConfig.authDomain ? 'Configurado' : 'Não configurado',
  projectId: firebaseConfig.projectId ? 'Configurado' : 'Não configurado',
  storageBucket: firebaseConfig.storageBucket ? 'Configurado' : 'Não configurado',
  messagingSenderId: firebaseConfig.messagingSenderId ? 'Configurado' : 'Não configurado',
  appId: firebaseConfig.appId ? 'Configurado' : 'Não configurado'
});

// Inicializa o Firebase apenas se não houver uma instância já inicializada
let app;
if (getApps().length === 0) {
  try {
    app = initializeApp(firebaseConfig);
    console.log('Firebase inicializado com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar Firebase:', error);
  }
} else {
  app = getApps()[0];
}

// Exportar os serviços do Firebase
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage }; 