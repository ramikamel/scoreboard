import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  const showSuccessAndClose = () => {
    // Replace the entire page with a simple auto-closing page
    setTimeout(() => {
      document.open();
      document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Email Verified</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px; 
              background: linear-gradient(135deg, #f0f9ff, #f0fdf4);
            }
            .container {
              max-width: 400px;
              margin: 0 auto;
              background: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .success { color: #059669; font-size: 18px; margin-bottom: 10px; }
            .countdown { color: #6b7280; font-size: 14px; }
            .close-btn { 
              background: #059669; 
              color: white; 
              border: none; 
              padding: 10px 20px; 
              border-radius: 5px; 
              cursor: pointer; 
              font-size: 14px;
              margin-top: 15px;
            }
            .close-btn:hover { background: #047857; }
          </style>
        </head>
        <body>
          <div class="container">
            <div style="font-size: 48px; color: #059669; margin-bottom: 15px;">✅</div>
            <div class="success">Email Verified Successfully!</div>
            <div class="countdown" id="countdown">This tab will close in 3 seconds...</div>
            <button class="close-btn" onclick="closeTab()">Close Now</button>
          </div>
          
          <script>
            let timeLeft = 3;
            const countdownEl = document.getElementById('countdown');
            
            function closeTab() {
              window.close();
              // If window.close() doesn't work, try other methods
              setTimeout(() => {
                try {
                  window.location.href = 'about:blank';
                  window.close();
                } catch(e) {
                  countdownEl.innerHTML = 'Please close this tab manually.';
                }
              }, 100);
            }
            
            const countdown = setInterval(() => {
              timeLeft--;
              if (timeLeft > 0) {
                countdownEl.innerHTML = 'This tab will close in ' + timeLeft + ' second' + (timeLeft !== 1 ? 's' : '') + '...';
              } else {
                clearInterval(countdown);
                closeTab();
              }
            }, 1000);
          </script>
        </body>
        </html>
      `);
      document.close();
    }, 500);
  };

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Debug: Log all URL parameters to see what Supabase is actually sending
        console.log('EmailVerification: All URL parameters:', Object.fromEntries(searchParams.entries()));
        
        // First, check if Supabase has already processed the verification automatically
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('EmailVerification: Current session:', session, 'Session error:', sessionError);
        
        if (session?.user) {
          console.log('EmailVerification: User already authenticated via session:', session.user.id);
          console.log('EmailVerification: User email confirmed:', session.user.email_confirmed_at);
          setStatus('success');
          showSuccessAndClose();
          return;
        }
        
        // If no session, try manual OTP verification
        // Check for multiple possible parameter names that Supabase might use
        const tokenHash = searchParams.get('token_hash') || searchParams.get('token') || searchParams.get('access_token');
        const type = searchParams.get('type') || 'signup';
        
        console.log('EmailVerification: Extracted params:', { tokenHash, type });

        if (!tokenHash) {
          console.log('EmailVerification: No token found in URL parameters');
          setStatus('error');
          return;
        }

        console.log('EmailVerification: Attempting verification with:', { tokenHash, type });

        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as any,
        });

        console.log('EmailVerification: Verification result:', { data, error });

        if (error) {
          console.error('EmailVerification: Verification error:', error);
          // Give a short delay before showing error in case there's a race condition
          setTimeout(() => {
            setStatus('error');
          }, 2000);
          return;
        }

        if (data.user) {
          console.log('EmailVerification: Verification successful for user:', data.user.id);
          console.log('EmailVerification: User email confirmed:', data.user.email_confirmed_at);
          setStatus('success');
          showSuccessAndClose();
        } else {
          console.log('EmailVerification: No user in verification data, setting error after delay');
          // Give a short delay in case the session is still being processed
          setTimeout(() => {
            setStatus('error');
          }, 2000);
        }
      } catch (error) {
        console.error('EmailVerification: Caught error:', error);
        // Give a delay before showing error
        setTimeout(() => {
          setStatus('error');
        }, 2000);
      }
    };

    verifyEmail();
  }, [searchParams]);

  // Loading state while verification is in progress
  if (status === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f9ff, #f0fdf4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '15px' }}>⏳</div>
          <div style={{ color: '#6b7280' }}>Verifying your email...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f9ff, #f0fdf4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', color: '#dc2626', marginBottom: '15px' }}>❌</div>
          <div style={{ color: '#dc2626', fontSize: '18px', marginBottom: '10px' }}>
            Email Verification Issue
          </div>
          <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '15px' }}>
            There was a problem verifying your email. This could be due to an expired or invalid link. Please try signing up again or contact support if the problem persists.
          </div>
          <button 
            onClick={() => window.location.href = '/auth'}
            style={{
              background: '#2563eb',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return null; // This shouldn't render for success case
};

export default EmailVerification;
