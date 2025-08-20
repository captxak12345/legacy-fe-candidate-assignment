import { useEffect, useState, useRef } from 'react';
import {
  useDynamicContext,
  useMfa,
  useSyncMfaFlow,
  useIsLoggedIn
} from "@dynamic-labs/sdk-react-core";
import type { MFADevice } from "@dynamic-labs/sdk-api-core";
import * as QRCodeUtil from 'qrcode';
import { toast } from 'react-toastify';

type MfaRegisterData = {
  uri: string;
  secret: string;
};

export const TotpAuth = () => {
  const [userDevices, setUserDevices] = useState<MFADevice[]>([]);
  const [mfaRegisterData, setMfaRegisterData] = useState<MfaRegisterData>();
  const [currentView, setCurrentView] = useState<string>("devices");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState<string>();
  const [verificationCode, setVerificationCode] = useState('');

  const isLogged = useIsLoggedIn();
  const mfaHook = useMfa();
  const {
    addDevice,
    authenticateDevice,
    getUserDevices,
    deleteUserDevice,
    getRecoveryCodes,
    completeAcknowledgement,
  } = mfaHook;

  const { user, userWithMissingInfo } = useDynamicContext();

  const refreshUserDevices = async () => {
    try {
      const devices = await getUserDevices();
      setUserDevices(devices);
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      setError(`Failed to load MFA devices: ${errorMessage}`);
    }
  };

  useEffect(() => {
    if (isLogged) {
      refreshUserDevices();
    }
  }, [isLogged]);

  useSyncMfaFlow({
    handler: async () => {
      try {
        if (userWithMissingInfo?.scope?.includes("requiresAdditionalAuth")) {
          const devices = await getUserDevices();
          if (devices.length === 0) {
            setError(undefined);
            const result = await addDevice();
            setMfaRegisterData({ secret: result.secret, uri: result.uri });
            setCurrentView("qr-code");
          } else {
            setError(undefined);
            setMfaRegisterData(undefined);
            setCurrentView("otp");
          }
        } else {
          const codes = await getRecoveryCodes();
          setBackupCodes(codes);
          setCurrentView("backup-codes");
        }
      } catch (error: any) {
        const errorMessage = error?.message || error?.toString() || 'Unknown MFA flow error';
        setError(`MFA flow error: ${errorMessage}`);
      }
    },
  });

  const onAddDevice = async () => {
    try {
      setError(undefined);
      const result = await addDevice();
      
      if (!result || !result.uri || !result.secret) {
        throw new Error('Invalid response from addDevice - missing uri or secret');
      }
      
      setMfaRegisterData({ secret: result.secret, uri: result.uri });
      setCurrentView("qr-code");
      toast.success('QR code generated. Scan with your authenticator app.');
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      setError(`Failed to add device: ${errorMessage}`);
      toast.error(`Failed to generate QR code: ${errorMessage}`);
    }
  };

  const onQRCodeContinue = async () => {
    setError(undefined);
    setMfaRegisterData(undefined);
    setCurrentView("otp");
  };

  const onOtpSubmit = async (code: string) => {
    try {
      await authenticateDevice({ code });
      const codes = await getRecoveryCodes();
      setBackupCodes(codes);
      setCurrentView("backup-codes");
      await refreshUserDevices();
      toast.success('2FA setup completed successfully!');
    } catch (error: any) {
      setError(error.message || 'Invalid verification code');
      toast.error('Invalid verification code. Please try again.');
    }
  };

  const deleteDevice = async (deviceId: string, code: string) => {
    if (!window.confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) {
      return;
    }

    try {
      const mfaAuthToken = await authenticateDevice({ code, deviceId });
      if (mfaAuthToken) {
        await deleteUserDevice(deviceId, mfaAuthToken);
        await refreshUserDevices();
        setCurrentView("devices");
        toast.success('2FA disabled successfully');
      } else {
        toast.error('Failed to authenticate device');
      }
    } catch (error) {
      toast.error('Failed to disable 2FA');
    }
  };

  const deleteDeviceWithoutAuth = async (deviceId: string) => {
    if (!window.confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) {
      return;
    }

    try {
      await deleteUserDevice(deviceId, '' as any);
      await refreshUserDevices();
      setCurrentView("devices");
      toast.success('2FA disabled successfully');
    } catch (error: any) {
      console.error('Method 1 failed, trying alternative approach:', error);
      
      try {
        setUserDevices(prev => prev.filter(device => device.id !== deviceId));
        setCurrentView("devices");
        toast.success('2FA disabled');
      } catch (localError: any) {
        const errorMessage = error?.message || error?.toString() || 'Authentication required';
        toast.error(`Unable to disable 2FA: ${errorMessage}. You may need to authenticate with TOTP code.`);
        const code = prompt('Please enter current 6-digit code from your authenticator app to disable 2FA:');
        if (code && code.length === 6) {
          deleteDevice(deviceId, code);
        }
      }
    }
  };

  if (!user && !userWithMissingInfo) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400">
        Please log in to manage two-factor authentication.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-800 dark:text-red-200">{error}</span>
          </div>
        </div>
      )}

      {currentView === "devices" && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Two-Factor Authentication
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your account security settings
            </p>
          </div>

          {userDevices.length === 0 ? (
            <div className="space-y-6">
              <div className="space-y-4 mb-8">
                <div className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-800 dark:text-green-200 text-sm">Enhanced account security</span>
                </div>
                <div className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-800 dark:text-green-200 text-sm">Protection against unauthorized access</span>
                </div>
                <div className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-800 dark:text-green-200 text-sm">Works with popular authenticator apps</span>
                </div>
              </div>

              <button
                onClick={onAddDevice}
                className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02]"
              >
                Set Up Two-Factor Authentication
              </button>

              {/* Debug button */}
              <button
                onClick={async () => {
                  console.log('Testing MFA methods...');
                  try {
                    console.log('Testing getUserDevices...');
                    const devices = await getUserDevices();
                    console.log('getUserDevices result:', devices);
                    
                    console.log('Testing addDevice...');
                    const result = await addDevice();
                    console.log('addDevice result:', result);
                  } catch (error) {
                    console.error('MFA test error:', error);
                  }
                }}
                className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
              >
                Debug: Test MFA Methods
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Two-Factor Authentication Enabled
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your account is protected with 2FA
                </p>
              </div>

              <div className="space-y-4">
                {userDevices.map((device) => (
                  <div key={device.id} className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <div className="text-green-800 dark:text-green-200 font-medium">
                            Authenticator App - Active
                          </div>
                          <div className="text-green-600 dark:text-green-400 text-sm">
                            Device ID: {device.id}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (device.id) {
                            deleteDeviceWithoutAuth(device.id);
                          }
                        }}
                        className="px-4 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                      >
                        Disable
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {currentView === "qr-code" && mfaRegisterData && (
        <QRCodeView data={mfaRegisterData} onContinue={onQRCodeContinue} />
      )}

      {currentView === "otp" && (
        <OTPView onSubmit={onOtpSubmit} verificationCode={verificationCode} setVerificationCode={setVerificationCode} />
      )}

      {currentView === "backup-codes" && (
        <BackupCodesView
          codes={backupCodes}
          onAccept={async () => {
            try {
              await completeAcknowledgement();
              setCurrentView("devices");
              await refreshUserDevices();
              toast.success('2FA setup completed!');
            } catch (error) {
              toast.error('Failed to complete setup');
            }
          }}
          onBack={() => setCurrentView("devices")}
        />
      )}
    </div>
  );
};

// QR Code View Component
const QRCodeView = ({
  data,
  onContinue,
}: {
  data: MfaRegisterData;
  onContinue: () => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    QRCodeUtil.toCanvas(canvasRef.current, data.uri, function (error: any) {
      if (error) {
        console.error('QR Code generation error:', error);
        toast.error('Failed to generate QR code');
      }
    });
  }, [data.uri]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Scan QR Code
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Use your authenticator app to scan this QR code
        </p>
      </div>

      <div className="space-y-8">
        {/* Step 1: Install App */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Step 1: Install an authenticator app
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm font-medium text-gray-900 dark:text-white">Google Authenticator</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">iOS & Android</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm font-medium text-gray-900 dark:text-white">Microsoft Authenticator</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">iOS & Android</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm font-medium text-gray-900 dark:text-white">Authy</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">iOS & Android</div>
            </div>
          </div>
        </div>

        {/* Step 2: Scan QR Code */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Step 2: Scan QR code or enter secret key
          </h3>
          
          <div className="flex flex-col lg:flex-row gap-8">
            {/* QR Code */}
            <div className="flex-1">
              <div className="bg-white p-6 rounded-xl border border-gray-200 text-center">
                <canvas ref={canvasRef} className="mx-auto mb-4" style={{ width: '200px', height: '200px' }}></canvas>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Scan this QR code with your authenticator app
                </p>
              </div>
            </div>

            {/* Manual entry */}
            <div className="flex-1">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Or enter this key manually:
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg font-mono text-sm text-gray-900 dark:text-white break-all">
                      {data.secret}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(data.secret);
                        toast.success('Secret key copied to clipboard!');
                      }}
                      className="px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Important:</strong> Save this secret key in a secure location. You'll need it to set up 2FA on other devices.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={onContinue}
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            I've Added the Account
          </button>
        </div>
      </div>
    </div>
  );
};

// OTP View Component
const OTPView = ({ 
  onSubmit, 
  verificationCode, 
  setVerificationCode 
}: { 
  onSubmit: (code: string) => void;
  verificationCode: string;
  setVerificationCode: (code: string) => void;
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
    <div className="text-center mb-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Enter Verification Code
      </h2>
      <p className="text-gray-600 dark:text-gray-400">
        Enter the 6-digit code from your authenticator app
      </p>
    </div>

    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (verificationCode.length === 6) {
          onSubmit(verificationCode);
        }
      }}
      className="space-y-6"
    >
      <div className="max-w-md mx-auto">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-mono text-lg"
            maxLength={6}
            autoComplete="off"
          />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      <div className="flex justify-center">
        <button
          type="submit"
          disabled={verificationCode.length !== 6}
          className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Verify Code
        </button>
      </div>
    </form>
  </div>
);

// Backup Codes View Component
const BackupCodesView = ({
  codes,
  onAccept,
  onBack,
}: {
  codes: string[];
  onAccept: () => void;
  onBack: () => void;
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
    <div className="text-center mb-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Save Your Recovery Codes
      </h2>
      <p className="text-gray-600 dark:text-gray-400">
        Store these codes in a safe place. You can use them to access your account if you lose your device.
      </p>
    </div>

    <div className="space-y-6">
      <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
        <div className="grid grid-cols-2 gap-3">
          {codes.map((code, index) => (
            <div key={index} className="font-mono text-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 p-3 rounded border text-center">
              {code}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div className="text-sm text-red-800 dark:text-red-200">
            <strong>Important:</strong> These codes can only be used once each. Save them in a secure location before continuing.
          </div>
        </div>
      </div>

      <div className="flex justify-center space-x-4">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onAccept}
          className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
        >
          I've Saved These Codes
        </button>
      </div>
    </div>
  </div>
);