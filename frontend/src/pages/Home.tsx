
import { useState, useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { toast } from 'react-toastify';
import { apiClient } from '@/api/backend';

type MessageInputs = {
    message: string
}

type SignedMessage = {
    id: string;
    message: string;
    signature: string;
    timestamp: number;
    walletAddress: string;
    userEmail: string;
    network: string;
}

type VerificationResponse = {
    isValid: boolean;
    signer: string | null;
    originalMessage: string;
    error?: string;
}

type VerificationResult = {
    isVerified: boolean;
    backendSigner: string | null;
    isSignerMatch: boolean;
    originalMessage: string | null;
    error?: string;
}

const STORAGE_KEY = 'dynamic-signed-messages';
const saveSignedMessage = (signedMessage: SignedMessage) => {
    try {
        const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const updated = [signedMessage, ...existing];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
        console.error('Failed to save signed message:', error);
    }
};

const getSignedMessages = (): SignedMessage[] => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (error) {
        console.error('Failed to load signed messages:', error);
        return [];
    }
};

const clearSignedMessages = () => {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Failed to clear signed messages:', error);
    }
};

export const Home = () => {
    const { user, primaryWallet } = useDynamicContext();
    const [sig, setSig] = useState<string | null>(null);
    const [signedMessages, setSignedMessages] = useState<SignedMessage[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [currentMessage, setCurrentMessage] = useState<string>('');
    const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<MessageInputs>()

    useEffect(() => {
        const messages = getSignedMessages();
        setSignedMessages(messages);
    }, []);

    const onVerify = async (message: string, signature: string) => {
        setIsVerifying(true);
        try {
            const { data }: { data: VerificationResponse } = await apiClient.post('/verify-signature', { message, signature });
            setVerificationResult({
                isVerified: data.isValid,
                originalMessage: data.originalMessage,
                backendSigner: data.signer,
                isSignerMatch: data.signer === primaryWallet?.address,
                error: data.error || (!data.isValid ? 'Backend verification failed' : undefined),
            });
            toast.success('Verification successful!');
        } catch {
            setVerificationResult({
                isVerified: false,
                originalMessage: null,
                backendSigner: null,
                isSignerMatch: false,
                error: 'Failed to connect to verification server',
            });
        } finally {
            setIsVerifying(false);
        }
    };

    const onSubmit: SubmitHandler<MessageInputs> = async (data) => {
        if (!primaryWallet) {
            toast.error('No wallet connected');
            return;
        }

        try {
            const signedMessage = await primaryWallet.signMessage(data.message);
            if (!signedMessage) {
                throw new Error('Invalid signature');
            }

            const newSignedMessage: SignedMessage = {
                id: Date.now().toString() + Math.random().toString(36).slice(2, 11),
                message: data.message,
                signature: signedMessage,
                timestamp: Date.now(),
                walletAddress: primaryWallet.address || '',
                userEmail: user?.email || '',
                network: primaryWallet.chain || 'Unknown'
            };

            saveSignedMessage(newSignedMessage);

            setSignedMessages(prev => [newSignedMessage, ...prev]);
            setSig(signedMessage);
            setCurrentMessage(data.message);
            toast.success('Message signed and saved successfully!');

        } catch (error) {
            toast.error((error as Error).message || 'Failed to sign message');
        }
    };

    const handleClearHistory = () => {
        clearSignedMessages();
        setSignedMessages([]);
        toast.success('Message history cleared!');
        setVerificationResult(null);
        setCurrentMessage('');
        setShowHistory(false);
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    const truncateText = (text: string, maxLength: number = 50) => {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    return (
        <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="h-full px-6 py-12 overflow-y-auto">
                <div className="max-w-4xl mx-auto mb-12">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                account overview.
                            </h2>
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-xs text-green-600 dark:text-green-400 font-medium">Connected</span>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Email</label>
                                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                                        {user?.email || 'Not available'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">User ID</label>
                                    <p className="text-sm text-gray-900 dark:text-white font-mono bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg truncate">
                                        {user?.userId || 'Not available'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Wallet Address</label>
                                    <p className="text-sm text-gray-900 dark:text-white font-mono bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg truncate">
                                        {primaryWallet?.address || 'No wallet connected'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Network</label>
                                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                                        {primaryWallet?.chain || 'Not connected'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="max-w-3xl mx-auto mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            {signedMessages.length > 0 && (
                                <button
                                    onClick={handleClearHistory}
                                    className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                                >
                                    Clear History
                                </button>
                            )}
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className={`
                                    px-4 py-2 rounded-xl font-semibold transition-all duration-300 transform
                                    ${showHistory
                                        ? 'bg-blue-500 text-white shadow-lg hover:bg-blue-600'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }
                                    hover:scale-105 active:scale-95
                                `}
                            >
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {showHistory ? 'Hide History' : `View History (${signedMessages.length})`}
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {showHistory && (
                    <div className="max-w-3xl mx-auto mb-12">
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                                    <svg className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    history.
                                </h3>
                            </div>

                            {signedMessages.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No messages signed yet</h4>
                                    <p className="text-gray-500 dark:text-gray-400">Sign your first message below to see it appear here.</p>
                                </div>
                            ) : (
                                <div className="max-h-96 overflow-y-auto">
                                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {signedMessages.map((msg, index) => (
                                            <div key={msg.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {formatDate(msg.timestamp)}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                {msg.network} • {truncateText(msg.walletAddress, 20)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => navigator.clipboard.writeText(msg.signature)}
                                                        className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                                                    >
                                                        Copy Signature
                                                    </button>
                                                </div>

                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Message</label>
                                                        <p className="text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mt-1">
                                                            {msg.message}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Signature</label>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mt-1 break-all">
                                                            {msg.signature}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                <div className="max-w-3xl mx-auto mb-12">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">
                                message signer.
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 font-sm">
                                cryptographically sign custom messages with your wallet
                            </p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div>
                                <label
                                    htmlFor="message"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                                >
                                    Your Message
                                </label>
                                <div className="relative">
                                    <textarea
                                        {...register("message", {
                                            required: "Message is required",
                                            minLength: {
                                                value: 1,
                                                message: "Message cannot be empty"
                                            },
                                            maxLength: {
                                                value: 500,
                                                message: "Message cannot exceed 500 characters"
                                            }
                                        })}
                                        id="message"
                                        rows={4}
                                        placeholder="Enter your message to sign..."
                                        className={`
                                            w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 
                                            bg-gray-50 dark:bg-gray-700 
                                            text-gray-900 dark:text-white 
                                            placeholder-gray-500 dark:placeholder-gray-400
                                            focus:outline-none focus:ring-0 resize-none
                                            ${errors.message
                                                ? 'border-red-400 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)] dark:focus:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]'
                                                : 'border-gray-300 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400 focus:shadow-[0_0_0_3px_rgba(147,51,234,0.1)] dark:focus:shadow-[0_0_0_3px_rgba(147,51,234,0.2)]'
                                            }
                                            hover:border-gray-400 dark:hover:border-gray-500
                                        `}
                                    />
                                    <div className={`
                                        absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-300
                                        ${errors.message
                                            ? 'shadow-[0_0_20px_rgba(239,68,68,0.3)] opacity-100'
                                            : 'shadow-[0_0_20px_rgba(147,51,234,0.3)] opacity-0 group-focus-within:opacity-100'
                                        }
                                    `} />
                                </div>
                                {errors.message && (
                                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {errors.message.message}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !primaryWallet}
                                    className={`
                                        flex-1 py-3 px-6 rounded-xl font-semibold text-white
                                        transition-all duration-300 transform
                                        focus:outline-none focus:ring-0
                                        ${isSubmitting || !primaryWallet
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_0_30px_rgba(147,51,234,0.4)]'
                                        }
                                    `}
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Signing Message...
                                        </div>
                                    ) : !primaryWallet ? (
                                        <div className="flex items-center justify-center">
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                            </svg>
                                            No Wallet Connected
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center">
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                            Sign Message
                                        </div>
                                    )}
                                </button>

                                {sig && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSig(null);
                                            reset();
                                            setCurrentMessage('');
                                            setShowHistory(false);
                                            setVerificationResult(null);
                                        }}
                                        className="px-6 py-3 rounded-xl font-semibold text-gray-600 dark:text-gray-400 border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </form>
                        {sig && (
                            <div className="mt-8 p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mr-3">
                                            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                                            Message Signed Successfully!
                                        </h3>
                                    </div>
                                    <span className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-800 px-2 py-1 rounded-full">
                                        Saved to History
                                    </span>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-green-700 dark:text-green-300">Signature:</label>
                                        <p className="text-xs text-green-800 dark:text-green-200 font-mono bg-green-100 dark:bg-green-800/30 p-3 rounded-lg mt-1 break-all">
                                            {sig}
                                        </p>
                                    </div>
                                    {verificationResult?.isVerified && (
                                        <>
                                            <div>
                                                <label className="text-sm font-medium text-green-700 dark:text-green-300">Verification Result:</label>
                                                <p className="text-sm text-green-800 dark:text-green-200 bg-green-100 dark:bg-green-800/30 p-3 rounded-lg mt-1">
                                                    {verificationResult.isVerified ? 'Verified' : 'Not Verified'}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-green-700 dark:text-green-300">Message Signer:</label>
                                                <p className="text-sm text-green-800 dark:text-green-200 bg-green-100 dark:bg-green-800/30 p-3 rounded-lg mt-1">
                                                    {verificationResult.backendSigner}
                                                </p>
                                            </div>
                                        </>

                                    )}
                                    <div className="flex items-center justify-between pt-2">
                                        <span className="text-sm text-green-700 dark:text-green-300">
                                            please verify your message to validate the signature
                                        </span>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => onVerify(currentMessage, sig)}
                                                className={`px-3 py-1 text-xs rounded-md transition-colors ${isVerifying
                                                        ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                                        : 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-700'
                                                    }`}
                                                disabled={isVerifying}
                                            >
                                                {isVerifying ? (
                                                    <svg
                                                        className="animate-spin h-4 w-4 text-green-700 dark:text-green-300"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <circle
                                                            className="opacity-25"
                                                            cx="12"
                                                            cy="12"
                                                            r="10"
                                                            stroke="currentColor"
                                                            strokeWidth="4"
                                                        ></circle>
                                                        <path
                                                            className="opacity-75"
                                                            fill="currentColor"
                                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                        ></path>
                                                    </svg>
                                                ) : (
                                                    'Verify'
                                                )}
                                            </button>
                                        </div>
                                        <div>
                                            {verificationResult && (
                                                <span className={`text-xs ${verificationResult.isVerified ? 'text-green-600' : 'text-red-600'} dark:${verificationResult.isVerified ? 'text-green-400' : 'text-red-400'} bg-${verificationResult.isVerified ? 'green-100' : 'red-100'} dark:bg-${verificationResult.isVerified ? 'green-800' : 'red-800'} px-2 py-1 rounded-full`}>
                                                    {verificationResult.isVerified ? 'Verified' : verificationResult.error || 'Not Verified'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
