import React from 'react';
import { Keyboard, Hand } from 'lucide-react';

export const Instructions: React.FC = () => {
  return (
    <div className="card">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
        {/* El İşaretleri */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-1">
            <Hand className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h4 className="font-medium text-gray-800 dark:text-white text-sm">
            Kullanım Talimatları
            </h4>
          </div>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Elinizi kameranın önünde tutun</li>
            <li>• 💡 Her harfi 1 saniye boyunca aynı pozisyonda tutun veya "Harfi Onayla" butonunu kullanın</li>
            <li>• Harf onaylandığında kelimeye eklenir</li>
          </ul>
        </div>

        {/* Klavye Kısayolları */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2 mb-2">
            <Keyboard className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h4 className="font-medium text-gray-800 dark:text-white text-sm">
              Klavye Kısayolları
            </h4>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <div className="flex items-center justify-between">
              <span>Boşluk ekle</span>
              <kbd className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                Space
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span>Son karakteri sil</span>
              <kbd className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                Backspace
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span>Tümünü temizle</span>
              <kbd className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                C
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span>Metni tamamla</span>
              <kbd className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                Enter
              </kbd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};