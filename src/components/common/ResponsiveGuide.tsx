import React from 'react';

/**
 * Responsive Design Guide Component
 * 
 * This component demonstrates how to use the responsive utilities
 * for all the devices mentioned in your requirements.
 * 
 * Device List Covered:
 * - iPhone SE, iPhone XR, iPhone 12 Pro, iPhone 14 Pro Max
 * - Pixel 7, Samsung Galaxy S8+, Samsung Galaxy S20 Ultra, Samsung Galaxy A51/71
 * - iPad Mini, iPad Air, iPad Pro
 * - Surface Pro 7, Surface Duo, Galaxy Z Fold 5, Asus Zenbook Fold
 * - Nest Hub, Nest Hub Max
 */

const ResponsiveGuide: React.FC = () => {
  return (
    <div className="responsive-container">
      {/* Page Title */}
      <h1 className="responsive-text-2xl font-bold text-gray-900 mb-6">
        Responsive Design Guide
      </h1>

      {/* Grid Layout Example */}
      <section className="responsive-m-md">
        <h2 className="responsive-text-xl font-semibold text-gray-800 mb-4">
          Responsive Grid Layout
        </h2>
        <div className="
          grid responsive-gap
          responsive-grid-cols-cards
        ">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="
              bg-white border border-gray-200 shadow-sm
              responsive-card
            ">
              <h3 className="responsive-text-lg font-medium text-gray-900 mb-2">
                Card {item}
              </h3>
              <p className="responsive-text-sm text-gray-600">
                This card adapts to different screen sizes automatically.
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Button Examples */}
      <section className="responsive-m-md">
        <h2 className="responsive-text-xl font-semibold text-gray-800 mb-4">
          Responsive Buttons
        </h2>
        <div className="flex flex-wrap responsive-gap">
          <button className="
            bg-purple-600 text-white hover:bg-purple-700 transition-colors
            responsive-btn
          ">
            Primary Button
          </button>
          <button className="
            bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors
            responsive-btn
          ">
            Secondary Button
          </button>
          <button className="
            border border-purple-600 text-purple-600 hover:bg-purple-50 transition-colors
            responsive-btn
          ">
            Outline Button
          </button>
        </div>
      </section>

      {/* Form Elements */}
      <section className="responsive-m-md">
        <h2 className="responsive-text-xl font-semibold text-gray-800 mb-4">
          Responsive Form Elements
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block responsive-text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              className="
                w-full border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500
                responsive-input
              "
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label className="block responsive-text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              rows={4}
              className="
                w-full border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500
                responsive-input
              "
              placeholder="Enter your message"
            />
          </div>
        </div>
      </section>

      {/* Typography Examples */}
      <section className="responsive-m-md">
        <h2 className="responsive-text-xl font-semibold text-gray-800 mb-4">
          Responsive Typography
        </h2>
        <div className="space-y-4">
          <h1 className="responsive-text-2xl font-bold text-gray-900">
            Heading 1 - Main Title
          </h1>
          <h2 className="responsive-text-xl font-semibold text-gray-800">
            Heading 2 - Section Title
          </h2>
          <h3 className="responsive-text-lg font-medium text-gray-700">
            Heading 3 - Subsection
          </h3>
          <p className="responsive-text-base text-gray-600">
            Body text - This paragraph demonstrates how text scales across different devices.
            It maintains readability on small screens while utilizing space efficiently on larger displays.
          </p>
          <p className="responsive-text-sm text-gray-500">
            Small text - Used for captions, metadata, and secondary information.
          </p>
        </div>
      </section>

      {/* Icon Examples */}
      <section className="responsive-m-md">
        <h2 className="responsive-text-xl font-semibold text-gray-800 mb-4">
          Responsive Icons
        </h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="responsive-icon-sm bg-purple-100 rounded p-1">
              <div className="responsive-icon-sm bg-purple-600 rounded"></div>
            </div>
            <span className="responsive-text-sm">Small Icon</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="responsive-icon-md bg-purple-100 rounded p-1">
              <div className="responsive-icon-md bg-purple-600 rounded"></div>
            </div>
            <span className="responsive-text-sm">Medium Icon</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="responsive-icon-lg bg-purple-100 rounded p-1">
              <div className="responsive-icon-lg bg-purple-600 rounded"></div>
            </div>
            <span className="responsive-text-sm">Large Icon</span>
          </div>
        </div>
      </section>

      {/* Device-Specific Examples */}
      <section className="responsive-m-md">
        <h2 className="responsive-text-xl font-semibold text-gray-800 mb-4">
          Device-Specific Adaptations
        </h2>
        <div className="
          bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg
          responsive-p-md
        ">
          <h3 className="responsive-text-lg font-medium text-purple-900 mb-2">
            Current Device Optimization
          </h3>
          <p className="responsive-text-sm text-purple-700">
            This content automatically adapts based on your device:
          </p>
          <ul className="responsive-text-sm text-purple-600 mt-2 space-y-1">
            <li className="iphone-se:block galaxy-s8:block galaxy-fold:block hidden">
              📱 Optimized for small mobile screens
            </li>
            <li className="iphone-xr:block iphone-12-pro:block pixel-7:block galaxy-s20:block galaxy-a51:block hidden">
              📱 Optimized for standard mobile screens
            </li>
            <li className="iphone-14-pro-max:block surface-duo:block hidden">
              📱 Optimized for large mobile screens
            </li>
            <li className="ipad-mini:block ipad-air:block surface-pro:block hidden">
              📱 Optimized for tablets
            </li>
            <li className="ipad-pro:block zenbook-fold:block lg:block hidden">
              💻 Optimized for large tablets and laptops
            </li>
            <li className="nest-hub:block nest-hub-max:block xl:block hidden">
              🖥️ Optimized for desktop and large displays
            </li>
          </ul>
        </div>
      </section>

      {/* Best Practices */}
      <section className="responsive-m-md">
        <h2 className="responsive-text-xl font-semibold text-gray-800 mb-4">
          Responsive Design Best Practices
        </h2>
        <div className="
          bg-white border border-gray-200 rounded-lg
          responsive-p-md
        ">
          <div className="space-y-4">
            <div>
              <h4 className="responsive-text-base font-medium text-gray-900 mb-2">
                1. Use Responsive Utility Classes
              </h4>
              <p className="responsive-text-sm text-gray-600">
                Always use the responsive utility classes (responsive-text-*, responsive-p-*, etc.) 
                instead of fixed sizes to ensure consistent scaling across all devices.
              </p>
            </div>
            <div>
              <h4 className="responsive-text-base font-medium text-gray-900 mb-2">
                2. Test on Multiple Devices
              </h4>
              <p className="responsive-text-sm text-gray-600">
                Use browser dev tools to test your layouts on all the supported device sizes, 
                especially the foldable devices and ultra-wide displays.
              </p>
            </div>
            <div>
              <h4 className="responsive-text-base font-medium text-gray-900 mb-2">
                3. Consider Touch Targets
              </h4>
              <p className="responsive-text-sm text-gray-600">
                Ensure buttons and interactive elements are large enough for touch interaction 
                on mobile devices (minimum 44px touch target).
              </p>
            </div>
            <div>
              <h4 className="responsive-text-base font-medium text-gray-900 mb-2">
                4. Optimize Content Hierarchy
              </h4>
              <p className="responsive-text-sm text-gray-600">
                Use responsive typography to maintain clear content hierarchy across all screen sizes.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ResponsiveGuide;