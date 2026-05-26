import { useState } from 'react';
import { auth, googleProvider } from '@/firebaseConfig';
import { signInWithEmailAndPassword, signInWithPopup, createUserWithEmailAndPassword } from 'firebase/auth';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error(err);
      alert("Google Auth Cancelled / Failed");
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden bg-black">
      {/* Background Stadium Cover */}
      <div className="absolute inset-0 bg-[#0a0a0c]" />
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-neon-purple/10 rounded-full blur-3xl" />
      <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-neon-volt/5 rounded-full blur-3xl" />

      {/* Glassmorphism Login Card Container */}
      <div className="relative z-10 w-full max-w-sm animate-fadeIn">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white tracking-tighter italic">
            AYO <span className="text-neon-purple">MAIN</span> BOLA
          </h1>
          <p className="text-gray-500 text-[9px] mt-1.5 uppercase tracking-widest font-black">Community Arena Platform</p>
        </div>

        <div className="bg-[#14141a] border border-gray-800/80 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-base font-black text-white mb-5 uppercase tracking-wide text-center">
            {isLogin ? 'Welcome Back, Coach!' : 'Register Account'}
          </h2>

          <form onSubmit={handleAuth} className="flex flex-col gap-3.5">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={15} />
              <input 
                type="email" 
                placeholder="Email Address"
                className="w-full bg-black/40 border border-gray-800 rounded-xl py-3 pl-11 pr-4 text-xs text-white focus:border-neon-purple outline-none transition-all shadow-inner"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={15} />
              <input 
                type="password" 
                placeholder="Password"
                className="w-full bg-black/40 border border-gray-800 rounded-xl py-3 pl-11 pr-4 text-xs text-white focus:border-neon-purple outline-none transition-all shadow-inner"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="mt-2 py-3.5 bg-gradient-to-r from-neon-purple to-indigo-600 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-neon-purple/10 uppercase tracking-wider"
            >
              {loading ? <Loader2 className="animate-spin" size={14} /> : (isLogin ? 'Sign In' : 'Create Account')}
              <ArrowRight size={14} />
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="h-[1px] flex-1 bg-gray-800/60" />
            <span className="text-[8px] text-gray-600 font-black uppercase tracking-wider">OR SIGN IN WITH</span>
            <div className="h-[1px] flex-1 bg-gray-800/60" />
          </div>

          {/* Tombol Google Dengan SVG Inline Custom (100% Bebas Crash Import) */}
          <button 
            onClick={handleGoogleLogin}
            className="w-full py-3 bg-[#1b1b22] border border-gray-800 hover:border-gray-700 text-gray-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2.5 transition-all active:scale-95"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.227C18.283 1.514 15.485 0 12.24 0 5.58 0 0 5.58 0 12.24s5.58 12.24 12.24 12.24c6.96 0 11.57-4.894 11.57-11.79 0-.795-.085-1.4-.195-2.015H12.24z"/>
            </svg>
            Google Account
          </button>

          <p className="text-center mt-6 text-[11px] text-gray-500 font-medium">
            {isLogin ? "Don't have an arena ID?" : "Already registered?"}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="ml-1.5 text-neon-purple font-black hover:underline uppercase text-[10px] tracking-wide"
            >
              {isLogin ? 'Register' : 'Log In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}