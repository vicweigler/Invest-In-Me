import { create } from 'zustand';
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { subscribeUserData, unsubscribeUserData } from '../lib/firestoreSync';

function friendlyAuthError(code: string): string {
  switch (code) {
    case 'auth/invalid-email': return 'Invalid email address.';
    case 'auth/user-not-found': return 'No account found with that email.';
    case 'auth/wrong-password': return 'Incorrect password.';
    case 'auth/invalid-credential': return 'Incorrect email or password.';
    case 'auth/email-already-in-use': return 'An account with that email already exists.';
    case 'auth/weak-password': return 'Password must be at least 6 characters.';
    case 'auth/too-many-requests': return 'Too many attempts. Please try again later.';
    default: return 'Something went wrong. Please try again.';
  }
}

interface AuthState {
  user: User | null;
  /** True while we're waiting for Firebase to resolve the initial auth state. */
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  loading: true,
  error: null,

  signInWithGoogle: async () => {
    set({ error: null });
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (e: any) {
      if (e.code !== 'auth/popup-closed-by-user') set({ error: e.message });
    }
  },

  signInWithEmail: async (email: string, password: string) => {
    set({ error: null });
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      set({ error: friendlyAuthError(e.code) });
    }
  },

  registerWithEmail: async (email: string, password: string) => {
    set({ error: null });
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      set({ error: friendlyAuthError(e.code) });
    }
  },

  signOut: async () => {
    await firebaseSignOut(auth);
  },

  clearError: () => set({ error: null }),
}));

// ── Auth state listener ──────────────────────────────────────────────────
// Runs once when the module is first imported.
onAuthStateChanged(auth, async (user) => {
  useAuthStore.setState({ user, loading: false });

  if (user) {
    // Start real-time Firestore subscriptions for portfolio + settings
    subscribeUserData(user.uid);
  } else {
    // Stop subscriptions and reset stores on sign-out
    unsubscribeUserData();

    const [{ usePortfolioStore }, { useSettingsStore }] = await Promise.all([
      import('./portfolioStore'),
      import('./settingsStore'),
    ]);
    usePortfolioStore.getState().reset();
    useSettingsStore.getState().reset();
  }
});
