import React from 'react';
import { Camera, MapPin, AlertCircle, Shield } from 'lucide-react';

interface PermissionGateProps {
  onRequestPermissions: () => void;
  cameraError?: string;
  locationError?: string;
  isLoading?: boolean;
}

/**
 * Permission gate component that handles camera and location permission requests
 * Provides a friendly, game-like interface for granting necessary permissions
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  onRequestPermissions,
  cameraError,
  locationError,
  isLoading = false,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-auto transform transition-all duration-300 hover:scale-105">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            AR Navigation
          </h1>
          <p className="text-gray-600">
            Let's get you ready for an amazing AR experience!
          </p>
        </div>

        {/* Permission Cards */}
        <div className="space-y-4 mb-8">
          {/* Camera Permission */}
          <div className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
            cameraError 
              ? 'border-red-200 bg-red-50' 
              : 'border-blue-200 bg-blue-50 hover:border-blue-300'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${
                cameraError ? 'bg-red-100' : 'bg-blue-100'
              }`}>
                {cameraError ? (
                  <AlertCircle className="w-6 h-6 text-red-600" />
                ) : (
                  <Camera className="w-6 h-6 text-blue-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">Camera Access</h3>
                <p className="text-sm text-gray-600">
                  {cameraError || 'For AR arrow overlays and navigation'}
                </p>
              </div>
            </div>
          </div>

          {/* Location Permission */}
          <div className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
            locationError 
              ? 'border-red-200 bg-red-50' 
              : 'border-green-200 bg-green-50 hover:border-green-300'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${
                locationError ? 'bg-red-100' : 'bg-green-100'
              }`}>
                {locationError ? (
                  <AlertCircle className="w-6 h-6 text-red-600" />
                ) : (
                  <MapPin className="w-6 h-6 text-green-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">Location Access</h3>
                <p className="text-sm text-gray-600">
                  {locationError || 'For real-time navigation and positioning'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onRequestPermissions}
          disabled={isLoading}
          className={`w-full py-4 px-6 rounded-2xl font-semibold text-white text-lg transition-all duration-300 transform ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:scale-105 active:scale-95'
          } shadow-lg hover:shadow-xl`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Getting Ready...</span>
            </div>
          ) : (
            'Grant Permissions & Start'
          )}
        </button>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Your privacy is important. Permissions are only used for navigation features.
          </p>
        </div>
      </div>
    </div>
  );
};