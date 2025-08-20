import { useState } from "react";
import { useConnectWithOtp, useEmbeddedWallet } from "@dynamic-labs/sdk-react-core";
import { useForm, type SubmitHandler } from "react-hook-form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { toast } from 'react-toastify';

type EmailInputs = {
  email: string
}

const check2FAEnabled = () => {
  try {
    const setup = localStorage.getItem('dynamic-2fa-setup');
    if (!setup) return false;
    const parsed = JSON.parse(setup);
    return parsed.isEnabled === true;
  } catch {
    return false;
  }
};


const verifyTOTPCode = async (code: string) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return code.length === 6 && /^\d+$/.test(code);
};

export const AuthPage = () => {
    const { createEmbeddedWallet } = useEmbeddedWallet();
    const [isOTPMode, setIsOTPMode] = useState(false);
    const [is2FAMode, setIs2FAMode] = useState(false);
    const [userEmail, setUserEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [totpCode, setTotpCode] = useState("");
    const [isVerifying2FA, setIsVerifying2FA] = useState(false);
    
    const { connectWithEmail, verifyOneTimePassword } = useConnectWithOtp();
    
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<EmailInputs>()

    const onEmailSubmit: SubmitHandler<EmailInputs> = async (data) => {
        try {
            await connectWithEmail(data.email);
            setUserEmail(data.email);
            setIsOTPMode(true);
            toast.success("Check your email for the login OTP!");
        } catch (error) {
            toast.error("Failed to send OTP. Please try again.");
        }
    };

    const onOTPSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length !== 6) {
            toast.error("Please enter a 6-digit OTP");
            return;
        }
        
        try {
            await verifyOneTimePassword(otp);
            const has2FA = check2FAEnabled();
            
            if (has2FA) {
                setIs2FAMode(true);
                setIsOTPMode(false);
                toast.success("Email verified! Please enter your authenticator code.");
            } else {
                toast.success("Successfully authenticated!");
                await createEmbeddedWallet();
            }
        } catch (error) {
            toast.error("Invalid OTP. Please try again.");
        }
    };

    const on2FASubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (totpCode.length !== 6) {
            toast.error("Please enter a 6-digit authenticator code");
            return;
        }
        setIsVerifying2FA(true);
        try {
            const isValid = await verifyTOTPCode(totpCode);
            
            if (isValid) {
                toast.success("2FA verified! Welcome back!");
                await createEmbeddedWallet();
            } else {
                toast.error("Invalid authenticator code. Please try again.");
            }
        } catch (error) {
            toast.error("2FA verification failed. Please try again.");
        } finally {
            setIsVerifying2FA(false);
        }
    };

    const handleBackToOTP = () => {
        setIs2FAMode(false);
        setIsOTPMode(true);
        setTotpCode("");
    };

    const handleBackToEmail = () => {
        setIsOTPMode(false);
        setIs2FAMode(false);
        setOtp("");
        setTotpCode("");
    };

    if (is2FAMode) {
        return (
            <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center p-4 z-10">
                <div className="w-full max-w-md">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl backdrop-blur-sm border border-gray-200 dark:border-gray-700 p-8">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                                Two-Factor Authentication
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                Enter the 6-digit code from your authenticator app
                            </p>
                        </div>

                        <form onSubmit={on2FASubmit} className="space-y-6">
                            <div className="flex flex-col items-center space-y-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Authenticator Code
                                </label>
                                <InputOTP
                                    maxLength={6}
                                    value={totpCode}
                                    onChange={(value) => setTotpCode(value)}
                                    className="justify-center"
                                >
                                    <InputOTPGroup>
                                        <InputOTPSlot 
                                            index={0} 
                                            className="w-12 h-12 text-lg font-bold border-2 rounded-xl transition-all duration-300 hover:border-green-400 focus:border-green-500 focus:shadow-[0_0_0_3px_rgba(34,197,94,0.1)] dark:focus:shadow-[0_0_0_3px_rgba(34,197,94,0.2)] bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                        <InputOTPSlot 
                                            index={1} 
                                            className="w-12 h-12 text-lg font-bold border-2 rounded-xl transition-all duration-300 hover:border-green-400 focus:border-green-500 focus:shadow-[0_0_0_3px_rgba(34,197,94,0.1)] dark:focus:shadow-[0_0_0_3px_rgba(34,197,94,0.2)] bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                        <InputOTPSlot 
                                            index={2} 
                                            className="w-12 h-12 text-lg font-bold border-2 rounded-xl transition-all duration-300 hover:border-green-400 focus:border-green-500 focus:shadow-[0_0_0_3px_rgba(34,197,94,0.1)] dark:focus:shadow-[0_0_0_3px_rgba(34,197,94,0.2)] bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </InputOTPGroup>
                                    <InputOTPSeparator />
                                    <InputOTPGroup>
                                        <InputOTPSlot 
                                            index={3} 
                                            className="w-12 h-12 text-lg font-bold border-2 rounded-xl transition-all duration-300 hover:border-green-400 focus:border-green-500 focus:shadow-[0_0_0_3px_rgba(34,197,94,0.1)] dark:focus:shadow-[0_0_0_3px_rgba(34,197,94,0.2)] bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                        <InputOTPSlot 
                                            index={4} 
                                            className="w-12 h-12 text-lg font-bold border-2 rounded-xl transition-all duration-300 hover:border-green-400 focus:border-green-500 focus:shadow-[0_0_0_3px_rgba(34,197,94,0.1)] dark:focus:shadow-[0_0_0_3px_rgba(34,197,94,0.2)] bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                        <InputOTPSlot 
                                            index={5} 
                                            className="w-12 h-12 text-lg font-bold border-2 rounded-xl transition-all duration-300 hover:border-green-400 focus:border-green-500 focus:shadow-[0_0_0_3px_rgba(34,197,94,0.1)] dark:focus:shadow-[0_0_0_3px_rgba(34,197,94,0.2)] bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </InputOTPGroup>
                                </InputOTP>
                            </div>

                            <button
                                type="submit"
                                disabled={totpCode.length !== 6 || isVerifying2FA}
                                className="w-full py-3 px-4 border border-transparent rounded-xl shadow-sm text-white font-medium bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100"
                            >
                                {isVerifying2FA ? (
                                    <div className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Verifying...
                                    </div>
                                ) : (
                                    'Verify & Sign In'
                                )}
                            </button>

                            <div className="text-center space-y-4">
                                <button
                                    type="button"
                                    onClick={handleBackToOTP}
                                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                                >
                                    ← Back to Email Verification
                                </button>
                                
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <p className="text-xs text-blue-800 dark:text-blue-200">
                                        Open your authenticator app (Google Authenticator, Authy, etc.) and enter the 6-digit code for ScotScan App.
                                    </p>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    if (isOTPMode) {
        return (
            <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center p-4 z-10">
                <div className="w-full max-w-md">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl backdrop-blur-sm border border-gray-200 dark:border-gray-700 p-8">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                        Enter OTP
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        We sent a 6-digit code to <span className="font-medium">{userEmail}</span>
                    </p>
                </div>

                <form onSubmit={onOTPSubmit} className="space-y-6">
                    <div className="flex flex-col items-center space-y-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Verification Code
                        </label>
                        <InputOTP
                            maxLength={6}
                            value={otp}
                            onChange={(value) => setOtp(value)}
                            className="justify-center"
                        >
                            <InputOTPGroup>
                                <InputOTPSlot 
                                    index={0} 
                                    className="w-12 h-12 text-lg font-bold border-2 rounded-xl transition-all duration-300 hover:border-blue-400 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] dark:focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)] bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                                <InputOTPSlot 
                                    index={1} 
                                    className="w-12 h-12 text-lg font-bold border-2 rounded-xl transition-all duration-300 hover:border-blue-400 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] dark:focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)] bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                                <InputOTPSlot 
                                    index={2} 
                                    className="w-12 h-12 text-lg font-bold border-2 rounded-xl transition-all duration-300 hover:border-blue-400 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] dark:focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)] bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </InputOTPGroup>
                            <InputOTPSeparator />
                            <InputOTPGroup>
                                <InputOTPSlot 
                                    index={3} 
                                    className="w-12 h-12 text-lg font-bold border-2 rounded-xl transition-all duration-300 hover:border-blue-400 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] dark:focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)] bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                                <InputOTPSlot 
                                    index={4} 
                                    className="w-12 h-12 text-lg font-bold border-2 rounded-xl transition-all duration-300 hover:border-blue-400 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] dark:focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)] bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                                <InputOTPSlot 
                                    index={5} 
                                    className="w-12 h-12 text-lg font-bold border-2 rounded-xl transition-all duration-300 hover:border-blue-400 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] dark:focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)] bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </InputOTPGroup>
                        </InputOTP>
                    </div>

                    <div className="space-y-3">
                        <button
                            type="submit"
                            disabled={otp.length !== 6}
                            className={`
                                w-full py-3 px-4 rounded-xl font-semibold text-white
                                transition-all duration-300 transform
                                focus:outline-none focus:ring-0
                                ${otp.length !== 6
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_0_30px_rgba(34,197,94,0.4)]'
                                }
                            `}
                        >
                            Verify OTP
                        </button>

                        <button
                            type="button"
                            onClick={handleBackToEmail}
                            className="w-full py-2 px-4 rounded-xl font-medium text-gray-600 dark:text-gray-400 border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-300"
                        >
                            Back to Email
                        </button>
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Didn't receive the code?{' '}
                            <button
                                type="button"
                                onClick={() => {
                                    connectWithEmail(userEmail);
                                    toast.info("OTP resent to your email!");
                                }}
                                className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors duration-200"
                            >
                                Resend
                            </button>
                        </p>
                    </div>
                </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center p-4 z-10">
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl backdrop-blur-sm border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                    dynamic authenticator.
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    sign in.
                </p>
            </div>

            <form onSubmit={handleSubmit(onEmailSubmit)} className="space-y-6">
                <div>
                    <label 
                        htmlFor="email" 
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                        Email Address
                    </label>
                    <div className="relative">
                        <input
                            {...register("email", {
                                required: "Email is required",
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: "Invalid email address"
                                }
                            })}
                            type="email"
                            id="email"
                            placeholder="Enter your email address"
                            className={`
                                w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 
                                bg-gray-50 dark:bg-gray-700 
                                text-gray-900 dark:text-white 
                                placeholder-gray-500 dark:placeholder-gray-400
                                focus:outline-none focus:ring-0
                                ${errors.email 
                                    ? 'border-red-400 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)] dark:focus:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]' 
                                    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] dark:focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)]'
                                }
                                hover:border-gray-400 dark:hover:border-gray-500
                            `}
                        />
                        <div className={`
                            absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-300
                            ${errors.email 
                                ? 'shadow-[0_0_20px_rgba(239,68,68,0.3)] opacity-100' 
                                : 'shadow-[0_0_20px_rgba(59,130,246,0.3)] opacity-0 group-focus-within:opacity-100'
                            }
                        `} />
                    </div>
                    {errors.email && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.email.message}
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`
                        w-full py-3 px-4 rounded-xl font-semibold text-white
                        transition-all duration-300 transform
                        focus:outline-none focus:ring-0
                        ${isSubmitting
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]'
                        }
                    `}
                >
                    {isSubmitting ? (
                        <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Signing in...
                        </div>
                    ) : (
                        'Sign In'
                    )}
                </button>

                <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Don't have an account?{' '}
                        <button
                            type="button"
                            className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors duration-200"
                        >
                            Sign up
                        </button>
                    </p>
                </div>
            </form>
                </div>
            </div>
        </div>
    );
};
