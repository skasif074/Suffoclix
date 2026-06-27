import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { paymentAPI } from '../services/api';
import Navbar from '../components/Navbar';

const Subscribe = () => {
  const { user, updateUser, isSubscribed } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    fetchPlans();
    loadRazorpay();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await paymentAPI.getPlans();
      setPlans(res.data.plans);
    } catch (err) {
      console.error('Fetch plans error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (plan) => {
    setSelectedPlan(plan);
    setPaying(true);
    try {
      // Create order
      const orderRes = await paymentAPI.createOrder({ plan_id: plan.id });
      const { order, key } = orderRes.data;

      const options = {
        key,
        amount: order.amount,
        currency: order.currency,
        name: 'Suffoclix',
        description: `${plan.name} Plan - ${plan.months} Month(s)`,
        image: '🎬',
        order_id: order.id,
        handler: async (response) => {
          try {
            // Verify payment
            const verifyRes = await paymentAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan_id: plan.id,
            });

            if (verifyRes.data.success) {
              // Update user context
              updateUser({ ...user, is_subscribed: true });
              alert(`🎉 ${verifyRes.data.message}`);
              navigate('/dashboard');
            }
          } catch (err) {
            alert('Payment verification failed. Contact support.');
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: {
          color: '#e50914',
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
            setSelectedPlan(null);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (err) {
      console.error('Payment error:', err);
      alert('Payment failed. Try again.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Navbar />
      <div className="page-loader"><div className="spinner" /></div>
    </div>
  );

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Navbar />

      <div className="container" style={{ paddingTop: '48px', paddingBottom: '80px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 20px',
            background: 'rgba(229,9,20,0.1)',
            border: '1px solid rgba(229,9,20,0.3)',
            borderRadius: '50px',
            fontSize: '13px',
            color: 'var(--accent)',
            fontWeight: '600',
            marginBottom: '24px',
          }}>
            ⭐ Choose Your Plan
          </div>

          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontWeight: '800',
            marginBottom: '16px',
            letterSpacing: '-1px',
          }}>
            Unlock All Content
          </h1>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '16px',
            maxWidth: '500px',
            margin: '0 auto',
          }}>
            Get unlimited access to all movies and series.
            Starting at just ₹1/month!
          </p>

          {/* Already subscribed */}
          {isSubscribed && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '20px',
              padding: '10px 20px',
              background: 'rgba(70,211,105,0.1)',
              border: '1px solid rgba(70,211,105,0.3)',
              borderRadius: '8px',
              color: 'var(--success)',
              fontSize: '14px',
              fontWeight: '600',
            }}>
              ✅ You already have an active subscription!
            </div>
          )}
        </div>

        {/* Plans */}
        <div style={{
          display: 'flex',
          gap: '24px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          maxWidth: '960px',
          margin: '0 auto 60px',
        }}>
          {plans.map((plan, i) => (
            <div key={plan.id} style={{
              flex: '1',
              minWidth: '260px',
              maxWidth: '300px',
              background: i === 1
                ? 'linear-gradient(135deg, rgba(229,9,20,0.12), rgba(178,7,16,0.06))'
                : 'var(--bg-card)',
              border: i === 1 ? '2px solid var(--accent)' : '1px solid var(--border)',
              borderRadius: '20px',
              padding: '36px 28px',
              position: 'relative',
              transition: 'var(--transition)',
              textAlign: 'center',
            }}>
              {/* Popular badge */}
              {i === 1 && (
                <div style={{
                  position: 'absolute',
                  top: '-16px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--gradient)',
                  color: 'white',
                  padding: '5px 24px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '700',
                  whiteSpace: 'nowrap',
                }}>
                  ⭐ MOST POPULAR
                </div>
              )}

              {/* Plan icon */}
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>
                {i === 0 ? '🥉' : i === 1 ? '🥈' : '🥇'}
              </div>

              {/* Plan name */}
              <h2 style={{
                fontSize: '20px',
                fontWeight: '800',
                marginBottom: '8px',
              }}>
                {plan.name}
              </h2>

              {/* Price */}
              <div style={{
                fontSize: '56px',
                fontWeight: '800',
                color: i === 1 ? 'var(--accent)' : 'white',
                lineHeight: '1',
                marginBottom: '4px',
              }}>
                ₹{plan.price}
              </div>
              <div style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                marginBottom: '28px',
              }}>
                for {plan.months} month{plan.months > 1 ? 's' : ''}
              </div>

              {/* Features */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '32px',
                textAlign: 'left',
              }}>
                {[
                  '✅ All Movies & Series',
                  '✅ HD Streaming',
                  '✅ Watch History',
                  '✅ Resume Anytime',
                  `✅ ${plan.months} Month${plan.months > 1 ? 's' : ''} Access`,
                ].map((f, j) => (
                  <div key={j} style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                  }}>
                    {f}
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <button
                onClick={() => handlePayment(plan)}
                disabled={paying && selectedPlan?.id === plan.id}
                className={`btn ${i === 1 ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '14px',
                  fontSize: '15px',
                  fontWeight: '700',
                  opacity: paying && selectedPlan?.id === plan.id ? 0.7 : 1,
                }}
              >
                {paying && selectedPlan?.id === plan.id
                  ? '⏳ Processing...'
                  : isSubscribed
                    ? '🔄 Renew Plan'
                    : `Get ${plan.name}`}
              </button>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div style={{
          display: 'flex',
          gap: '32px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '48px',
        }}>
          {[
            { icon: '🔒', text: 'Secure Payment' },
            { icon: '⚡', text: 'Instant Activation' },
            { icon: '🎬', text: 'All Content Unlocked' },
            { icon: '📱', text: 'Watch on Any Device' },
          ].map((badge, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
            }}>
              <span style={{ fontSize: '20px' }}>{badge.icon}</span>
              {badge.text}
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: '24px',
          }}>
            Frequently Asked Questions
          </h2>
          {[
            {
              q: 'Can I cancel anytime?',
              a: 'Yes! Your subscription is valid for the chosen period. No auto-renewal.'
            },
            {
              q: 'What payment methods are accepted?',
              a: 'UPI, Credit/Debit Cards, Net Banking via Razorpay.'
            },
            {
              q: 'Is my payment secure?',
              a: 'Yes! All payments are processed securely through Razorpay.'
            },
            {
              q: 'What happens after my plan expires?',
              a: 'You can renew your subscription to continue watching.'
            },
          ].map((faq, i) => (
            <div key={i} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '20px 24px',
              marginBottom: '12px',
            }}>
              <h3 style={{
                fontSize: '15px',
                fontWeight: '600',
                marginBottom: '8px',
              }}>
                {faq.q}
              </h3>
              <p style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                lineHeight: '1.6',
              }}>
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Subscribe;