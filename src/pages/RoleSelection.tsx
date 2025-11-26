import { useNavigate, Link } from "react-router-dom";

const RoleSelection = () => {
  const navigate = useNavigate();

	return (
		<div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
			{/* Premium Background Effects */}
			<div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 via-purple-900/80 to-pink-900/90"></div>
			<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-600/20 via-transparent to-transparent"></div>
			<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-600/20 via-transparent to-transparent"></div>
			<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-pink-600/10 via-transparent to-transparent"></div>
			{/* Animated Background Elements */}
			<div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
			<div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
			<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
			<div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center relative z-10">
				{/* Left Side Content */}
				<div className="text-white space-y-4 sm:space-y-6 text-center md:text-left relative z-10">
					<div className="space-y-3 sm:space-y-4">
						<div className="flex items-center justify-center md:justify-start space-x-2 sm:space-x-3">
							<div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
								<span className="text-base sm:text-lg">CAR</span>
							</div>
							<h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-300 via-indigo-300 to-blue-300 bg-clip-text text-transparent">
								ParkFlow
							</h1>
						</div>
						<p className="text-base sm:text-lg text-white/80 font-light">
							Smart Parking Management Made Easy
						</p>
					</div>
					
					<div className="space-y-2 sm:space-y-3">
						<div className="flex items-center justify-center md:justify-start space-x-2 sm:space-x-3 text-white/90">
							<div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
								<span className="text-white text-xs font-bold">✓</span>
							</div>
							<span className="text-sm sm:text-base">Real-time Parking Analytics</span>
						</div>
						<div className="flex items-center justify-center md:justify-start space-x-2 sm:space-x-3 text-white/90">
							<div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
								<span className="text-white text-xs font-bold">✓</span>
							</div>
							<span className="text-sm sm:text-base">Secure Role-based Access</span>
						</div>
						<div className="flex items-center justify-center md:justify-start space-x-2 sm:space-x-3 text-white/90">
							<div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
								<span className="text-white text-xs font-bold">✓</span>
							</div>
							<span className="text-sm sm:text-base">Scalable Multi-location Management</span>
						</div>
					</div>
				</div>

				{/* Right Side Card */}
				<div className="w-full max-w-md mx-auto">
					<div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl overflow-hidden">
						{/* Header */}
						<div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-4 sm:p-6 text-white text-center relative">
							<div className="absolute inset-0 bg-gradient-to-r from-purple-600/80 via-indigo-600/80 to-blue-600/80"></div>
							<div className="relative z-10">
								<h2 className="text-xl sm:text-2xl font-bold mb-1">Welcome to ParkFlow</h2>
								<p className="text-purple-100 text-xs sm:text-sm">Select a role to sign in to your dashboard</p>
							</div>
						</div>

						{/* Content */}
						<div className="p-4 sm:p-6 space-y-3 sm:space-y-4 bg-white/5 backdrop-blur-sm">
							{/* Role Selection Buttons */}
							<div className="space-y-2 sm:space-y-3">
								<button 
									className="w-full flex items-center justify-center space-x-2 p-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-[1.02]"
									onClick={() => navigate("/login?role=contractor")}
								>
									<span className="text-sm">👔</span>
									<span className="text-xs sm:text-sm">Continue as Contractor</span>
								</button>
								
								<button 
									className="w-full flex items-center justify-center space-x-2 p-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-[1.02]"
									onClick={() => navigate("/login?role=attendant")}
								>
									<span className="text-sm">🧑‍💼</span>
									<span className="text-xs sm:text-sm">Continue as Attendant</span>
								</button>
								
								<button
									className="w-full flex items-center justify-center space-x-2 p-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-[1.02]"
									onClick={() => navigate("/superadmin-verification")}
								>
									<span className="text-sm">⚡</span>
									<span className="text-xs sm:text-sm">Continue as Super Admin</span>
								</button>
							</div>

							{/* Security Indicators */}
							<div className="flex items-center justify-center space-x-4 sm:space-x-6 pt-2 sm:pt-3 text-white/70 text-xs">
								<span className="flex items-center space-x-1">
									<span className="text-green-400">🔒</span>
									<span>SSL Secured</span>
								</span>
								<span className="flex items-center space-x-1">
									<span className="text-blue-400">🛡️</span>
									<span>MFA Supported</span>
								</span>
							</div>

							{/* Terms */}
							<p className="text-center text-xs text-white/60 leading-relaxed">
								By clicking continue, you agree to our{' '}
								<Link to="/terms-of-service" className="text-purple-300 hover:text-purple-200 underline">
									Terms of Service
								</Link>{' '}
								and{' '}
								<Link to="/privacy-policy" className="text-purple-300 hover:text-purple-200 underline">
									Privacy Policy
								</Link>
								.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
  );
};

export default RoleSelection;
