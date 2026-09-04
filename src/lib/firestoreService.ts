import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Product, Order, Customer } from '../types';

// Collection Names
export const COLLECTIONS = {
  USERS: 'users',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  REVIEWS: 'reviews',
};

// ============================================================================
// PRODUCTS CRUD OPERATIONS
// ============================================================================

/**
 * Fetch all products from Firestore
 */
export async function getProductsFromFirestore(): Promise<Product[]> {
  const path = COLLECTIONS.PRODUCTS;
  try {
    const querySnapshot = await getDocs(collection(db, path));
    const products: Product[] = [];
    querySnapshot.forEach((docSnap) => {
      products.push({ id: docSnap.id, ...docSnap.data() } as Product);
    });
    return products;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Get single product by ID
 */
export async function getProductByIdFromFirestore(productId: string): Promise<Product | null> {
  const path = `${COLLECTIONS.PRODUCTS}/${productId}`;
  try {
    const docRef = doc(db, COLLECTIONS.PRODUCTS, productId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Product;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Save or create a new product in Firestore
 */
export async function saveProductToFirestore(product: Partial<Product> & { id: string }): Promise<void> {
  const path = `${COLLECTIONS.PRODUCTS}/${product.id}`;
  try {
    const docRef = doc(db, COLLECTIONS.PRODUCTS, product.id);
    await setDoc(docRef, {
      ...product,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Update product fields in Firestore
 */
export async function updateProductInFirestore(productId: string, updates: Partial<Product>): Promise<void> {
  const path = `${COLLECTIONS.PRODUCTS}/${productId}`;
  try {
    const docRef = doc(db, COLLECTIONS.PRODUCTS, productId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Delete a product from Firestore
 */
export async function deleteProductFromFirestore(productId: string): Promise<void> {
  const path = `${COLLECTIONS.PRODUCTS}/${productId}`;
  try {
    const docRef = doc(db, COLLECTIONS.PRODUCTS, productId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Realtime listener for products
 */
export function subscribeProductsFromFirestore(onUpdate: (products: Product[]) => void): () => void {
  const path = COLLECTIONS.PRODUCTS;
  try {
    const q = query(collection(db, path));
    return onSnapshot(q, (snapshot) => {
      const products: Product[] = [];
      snapshot.forEach((docSnap) => {
        products.push({ id: docSnap.id, ...docSnap.data() } as Product);
      });
      onUpdate(products);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

// ============================================================================
// ORDERS CRUD OPERATIONS
// ============================================================================

/**
 * Fetch all orders from Firestore
 */
export async function getOrdersFromFirestore(): Promise<Order[]> {
  const path = COLLECTIONS.ORDERS;
  try {
    const querySnapshot = await getDocs(collection(db, path));
    const orders: Order[] = [];
    querySnapshot.forEach((docSnap) => {
      orders.push({ id: docSnap.id, ...docSnap.data() } as Order);
    });
    return orders;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Get orders for a specific customer/user
 */
export async function getOrdersByUserIdFromFirestore(userId: string): Promise<Order[]> {
  const path = COLLECTIONS.ORDERS;
  try {
    const q = query(collection(db, path), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const orders: Order[] = [];
    querySnapshot.forEach((docSnap) => {
      orders.push({ id: docSnap.id, ...docSnap.data() } as Order);
    });
    return orders;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Create or save an order in Firestore
 */
export async function saveOrderToFirestore(order: Partial<Order> & { id: string }): Promise<void> {
  const path = `${COLLECTIONS.ORDERS}/${order.id}`;
  try {
    const docRef = doc(db, COLLECTIONS.ORDERS, order.id);
    await setDoc(docRef, {
      ...order,
      createdAt: order.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Update order status or fields in Firestore
 */
export async function updateOrderInFirestore(orderId: string, updates: Partial<Order>): Promise<void> {
  const path = `${COLLECTIONS.ORDERS}/${orderId}`;
  try {
    const docRef = doc(db, COLLECTIONS.ORDERS, orderId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Delete an order from Firestore
 */
export async function deleteOrderFromFirestore(orderId: string): Promise<void> {
  const path = `${COLLECTIONS.ORDERS}/${orderId}`;
  try {
    const docRef = doc(db, COLLECTIONS.ORDERS, orderId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Realtime listener for orders
 */
export function subscribeOrdersFromFirestore(onUpdate: (orders: Order[]) => void): () => void {
  const path = COLLECTIONS.ORDERS;
  try {
    const q = query(collection(db, path));
    return onSnapshot(q, (snapshot) => {
      const orders: Order[] = [];
      snapshot.forEach((docSnap) => {
        orders.push({ id: docSnap.id, ...docSnap.data() } as Order);
      });
      onUpdate(orders);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

// ============================================================================
// USERS / CUSTOMERS CRUD OPERATIONS
// ============================================================================

/**
 * Fetch user profile by UID
 */
export async function getUserProfileFromFirestore(uid: string): Promise<DocumentData | null> {
  const path = `${COLLECTIONS.USERS}/${uid}`;
  try {
    const docRef = doc(db, COLLECTIONS.USERS, uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Save user profile to Firestore
 */
export async function saveUserProfileToFirestore(uid: string, profileData: Record<string, any>): Promise<void> {
  const path = `${COLLECTIONS.USERS}/${uid}`;
  try {
    const docRef = doc(db, COLLECTIONS.USERS, uid);
    await setDoc(docRef, {
      ...profileData,
      uid,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ============================================================================
// REVIEWS CRUD OPERATIONS
// ============================================================================

export interface FirestoreReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

/**
 * Get reviews for a specific product
 */
export async function getReviewsForProduct(productId: string): Promise<FirestoreReview[]> {
  const path = COLLECTIONS.REVIEWS;
  try {
    const q = query(collection(db, path), where('productId', '==', productId));
    const querySnapshot = await getDocs(q);
    const reviews: FirestoreReview[] = [];
    querySnapshot.forEach((docSnap) => {
      reviews.push({ id: docSnap.id, ...docSnap.data() } as FirestoreReview);
    });
    return reviews;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Save or create a review
 */
export async function saveReviewToFirestore(review: FirestoreReview): Promise<void> {
  const path = `${COLLECTIONS.REVIEWS}/${review.id}`;
  try {
    const docRef = doc(db, COLLECTIONS.REVIEWS, review.id);
    await setDoc(docRef, {
      ...review,
      createdAt: review.createdAt || new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
