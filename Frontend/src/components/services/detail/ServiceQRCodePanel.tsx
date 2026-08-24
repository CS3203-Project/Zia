import React from 'react';
import { QrCode, Download, Share2 } from 'lucide-react';
import QRCode from 'react-qr-code';

interface ServiceQRCodePanelProps {
  qrCodeUrl: string;
  onDownload: () => void;
  onShare: () => void;
}

/**
 * QR code section of the booking sidebar: renders a scannable code linking
 * to the current page, plus download/share actions.
 */
const ServiceQRCodePanel: React.FC<ServiceQRCodePanelProps> = ({ qrCodeUrl, onDownload, onShare }) => {
  return (
    <div className="pt-6 border-t border-gray-100">
      <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
        <QrCode className="w-4 h-4 mr-2" />
        QR Code
      </h4>
      <div className="flex flex-col items-center space-y-3">
        {/* QR Code */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="w-24 h-24 flex items-center justify-center">
            {qrCodeUrl ? (
              <QRCode
                value={qrCodeUrl}
                size={96}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox={`0 0 256 256`}
                fgColor="currentColor"
                bgColor="transparent"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 rounded animate-pulse"></div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onDownload}
            className="flex items-center space-x-1 bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-100 rounded-lg px-3 py-2 shadow-sm transition-all duration-200 text-xs"
            title="Download QR Code"
          >
            <Download className="w-3 h-3" />
            <span>Download</span>
          </button>
          <button
            onClick={onShare}
            className="flex items-center space-x-1 bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-100 rounded-lg px-3 py-2 shadow-sm transition-all duration-200 text-xs"
            title="Share Service"
          >
            <Share2 className="w-3 h-3" />
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceQRCodePanel;
