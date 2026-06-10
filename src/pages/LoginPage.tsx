import React from 'react';
import { motion } from 'framer-motion';
import { Code2, Zap, Users, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const features = [
  { icon: Zap, label: 'Real-time sync', desc: 'See every keystroke instantly' },
  { icon: Users, label: 'Team rooms', desc: 'Invite anyone with a link' },
  { icon: Lock, label: 'Secure sessions', desc: 'Signed in via Google' },
];

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export const LoginPage: React.FC = () => {
  const { signInWithGoogle, loading } = useAuth();

  return (
    <div className="min-h-screen w-screen bg-[#080810] flex items-center justify-center overflow-hidden relative">
      {/* Ambient background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-700/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-700/15 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-900/10 rounded-full blur-[150px]" />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 w-full max-w-md px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl shadow-2xl p-8"
          style={{ boxShadow: '0 0 80px rgba(139,92,246,0.15), 0 0 0 1px rgba(255,255,255,0.06)' }}
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="flex flex-col items-center mb-8"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-violet-600 to-blue-500 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30">
              <Code2 className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">CodeAdda</h1>
            <p className="text-white/45 text-sm mt-1 text-center">
              Code together. Learn faster. Build more.
            </p>
          </motion.div>

          {/* Features list */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="space-y-3 mb-8"
          >
            {features.map(({ icon: Icon, label, desc }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-white/85 text-sm font-medium">{label}</p>
                  <p className="text-white/35 text-xs">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Google sign-in button */}
          <motion.button
            id="google-signin-btn"
            onClick={signInWithGoogle}
            disabled={loading}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.4 }}
            whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(139,92,246,0.25)' }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-white text-gray-800 font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
          >
            <GoogleIcon />
            Continue with Google
          </motion.button>

          <p className="text-white/25 text-xs text-center mt-5 leading-relaxed">
            By continuing, you agree to collaborate responsibly.
            <br />Your Google profile name & avatar will be shown to room members.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
