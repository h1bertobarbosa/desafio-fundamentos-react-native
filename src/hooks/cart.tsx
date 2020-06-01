import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsCart = await AsyncStorage.getItem('@marketPlace:cart');
      if (productsCart) {
        setProducts(JSON.parse(productsCart));
      }
    }
    // AsyncStorage.removeItem('@marketPlace:cart');
    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const idx = products.findIndex(item => item.id === id);

      if (idx !== -1) {
        if (products[idx].quantity === 0) {
          products[idx].quantity = 1;
        } else {
          products[idx].quantity += Number(1);
        }

        setProducts([...products]);
        await AsyncStorage.setItem(
          '@marketPlace:cart',
          JSON.stringify(products),
        );
      }
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const idx = products.findIndex(item => item.id === id);

      if (products[idx].quantity > 0) {
        products[idx].quantity -= Number(1);
        setProducts([...products]);
        await AsyncStorage.setItem(
          '@marketPlace:cart',
          JSON.stringify(products),
        );
      }
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const idx = products.findIndex(item => item.id === product.id);
      if (idx !== -1) {
        return increment(product.id);
      }

      const newProduct = [...products, { ...product, quantity: 1 }];
      setProducts(newProduct);
      await AsyncStorage.setItem(
        '@marketPlace:cart',
        JSON.stringify(newProduct),
      );
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
