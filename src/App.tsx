/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { CartDrawer } from './components/cart/CartDrawer';
import { AppRoutes } from './routes/AppRoutes';

export default function App() {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="flex flex-col min-h-screen">
            {/* Header Navbar */}
            <Navbar onOpenCart={() => setCartOpen(true)} />

            {/* Main Application Content Page Stage */}
            <main className="flex-1 bg-stone-50/20">
              <AppRoutes />
            </main>

            {/* Footer informational */}
            <Footer />

            {/* Shopping Item Selection Drawer / Slide checkout panel */}
            <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

