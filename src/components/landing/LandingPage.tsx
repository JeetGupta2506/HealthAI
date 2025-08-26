import { 
  Heart, 
  Brain, 
  Shield, 
  Zap, 
  ArrowRight, 
  Star,
  Play,
  Activity,
  MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { SimpleThemeToggle } from '../ui/ThemeToggle';

const features = [
  {
    icon: <Brain className="w-8 h-8" />,
    title: 'AI-Powered Health Insights',
    description: 'Get personalized health recommendations powered by advanced machine learning algorithms.',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: <MessageSquare className="w-8 h-8" />,
    title: 'Multi-Agent AI Assistant',
    description: 'Chat with specialized AI agents for different health concerns - from symptoms to nutrition.',
    color: 'from-gray-500 to-gray-600'
  },
  {
    icon: <Activity className="w-8 h-8" />,
    title: 'Real-Time Health Monitoring',
    description: 'Track vital signs, medications, and health metrics with intelligent trend analysis.',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: 'Secure & Private',
    description: 'Your health data is encrypted and protected with enterprise-grade security.',
    color: 'from-red-500 to-orange-500'
  }
];

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Patient',
    content: 'This AI health assistant has transformed how I manage my chronic condition. The insights are incredibly accurate.',
    rating: 5,
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    name: 'Dr. Michael Chen',
    role: 'Cardiologist',
    content: 'The AI-powered symptom checker is remarkably sophisticated. It helps my patients make informed decisions.',
    rating: 5,
    avatar: 'https://images.pexels.com/photos/612608/pexels-photo-612608.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    name: 'Emily Rodriguez',
    role: 'Wellness Coach',
    content: 'The nutrition AI agent provides evidence-based recommendations that my clients love. Highly recommended!',
    rating: 5,
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  }
];



export function LandingPage() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-700 z-50 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-green-500 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-800 dark:text-gray-100">HealthAI</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition-colors">How it Works</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition-colors">Testimonials</a>
            </div>
            
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/signin')}
              >
                Sign In
              </Button>
              <SimpleThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-blue-100 via-indigo-50 to-emerald-100 dark:from-gray-950 dark:via-blue-950/40 dark:to-emerald-950/60 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-200 text-blue-800 dark:bg-blue-700 dark:text-blue-200 rounded-full text-sm font-medium transition-colors duration-200 shadow-md">
                  <Zap className="w-4 h-4" />
                  Powered by Advanced AI
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                  Your AI-Powered
                  <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent"> Health Companion</span>
                </h1>
                <p className="text-xl text-gray-700 dark:text-gray-200 leading-relaxed">
                  Experience the future of healthcare with our multi-agent AI system. Get personalized health insights, 
                  symptom analysis, and 24/7 medical guidance powered by cutting-edge technology.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="group bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300" onClick={() => navigate('/signup')}>
                  Start Your Health Journey
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="group border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/20 shadow-md hover:shadow-lg transition-all duration-300"
                  onClick={() => navigate('/signup')}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative z-10 bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 rounded-2xl shadow-2xl p-8 border border-blue-100 dark:border-blue-800 transition-colors duration-200">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white">AI Health Analysis</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Real-time insights</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 rounded-lg border border-emerald-200">
                      <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Heart Rate</span>
                      <span className="text-sm text-emerald-600 dark:text-emerald-400">72 bpm ↗️</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg border border-blue-200">
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Sleep Quality</span>
                      <span className="text-sm text-blue-600 dark:text-blue-400">85% ↗️</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg border border-purple-200">
                      <span className="text-sm font-medium text-purple-800 dark:text-purple-300">Stress Level</span>
                      <span className="text-sm text-purple-600 dark:text-purple-400">Low ↘️</span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>AI Insight:</strong> Your sleep pattern has improved by 15% this week. 
                      Consider maintaining your current bedtime routine.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full opacity-30 animate-pulse shadow-lg"></div>
              <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full opacity-30 animate-pulse delay-1000 shadow-lg"></div>
            </div>
          </div>
        </div>
      </section>



      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Revolutionizing Healthcare with AI
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our advanced AI system combines multiple specialized agents to provide comprehensive 
              health management tailored to your unique needs.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-blue-900/20 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">How HealthAI Works</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">Simple steps to better health management</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Connect Your Data',
                description: 'Securely link your health devices and input your medical history.',
                icon: <Shield className="w-8 h-8" />,
                color: 'from-red-500 to-orange-500'
              },
              {
                step: '02',
                title: 'AI Analysis',
                description: 'Our multi-agent AI system analyzes your data and identifies patterns.',
                icon: <Brain className="w-8 h-8" />,
                color: 'from-purple-500 to-pink-500'
              },
              {
                step: '03',
                title: 'Get Insights',
                description: 'Receive personalized recommendations and track your progress.',
                icon: <Heart className="w-8 h-8" />,
                color: 'from-blue-600 to-blue-700'
              }
            ].map((item, index) => (
              <div key={index} className="text-center group">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                  <div className="relative mb-8">
                    <div className={`w-20 h-20 bg-gradient-to-br ${item.color} rounded-full shadow-lg flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300`}>
                      <div className="text-white">{item.icon}</div>
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Technology Showcase */}
<section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-blue-900/30">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center mb-16">
      <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        Powered by Cutting-Edge AI Technology
      </h2>
      <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
        Our multi-agent system combines Gemini, LangGraph, and CrewAI for intelligent health analysis
      </p>
    </div>
    
    <div className="grid md:grid-cols-3 gap-8">
      {[
        {
          icon: <Brain className="w-8 h-8" />,
          title: 'Multi-Agent Architecture',
          description: 'Specialized AI agents work together - from symptom analysis to nutrition planning',
          tech: 'LangGraph + CrewAI',
          color: 'from-purple-500 to-pink-500'
        },
        {
          icon: <Zap className="w-8 h-8" />,
          title: 'Advanced Language Model',
          description: 'Powered by Google Gemini for natural, contextual health conversations',
          tech: 'Gemini Pro',
          color: 'from-green-500 to-emerald-500'
        },
        {
          icon: <Shield className="w-8 h-8" />,
          title: 'Real-time Processing',
          description: 'Instant health insights and recommendations with secure data handling',
          tech: 'FastAPI + React',
          color: 'from-red-500 to-orange-500'
        }
      ].map((item, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
          <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center text-white mb-4`}>
            {item.icon}
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-3">{item.description}</p>
          <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 text-sm rounded-full">
            {item.tech}
          </span>
        </div>
      ))}
    </div>
  </div>
</section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gradient-to-br from-blue-50 to-slate-50 dark:from-gray-900 dark:to-blue-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">What Our Users Say</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">Trusted by healthcare professionals and patients worldwide</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 transition-colors duration-200">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center gap-4">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      



      {/* Footer */}
      <footer className="bg-black text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-green-500 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">HealthAI</span>
              </div>
              <p className="text-gray-300">
                Revolutionizing healthcare with AI-powered insights and personalized health management.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
                              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
                              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
                              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          
                      <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-300">
            <p>&copy; 2025 HealthAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}