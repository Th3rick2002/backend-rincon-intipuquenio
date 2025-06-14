# Documentación API - Rutas para Frontend Vue

## 🔧 Configuración Base

**Base URL:** `http://localhost:3000/api` (ajusta según tu configuración)

**Headers requeridos:**
```javascript
{
  'Content-Type': 'application/json',
  // Las cookies de autenticación se envían automáticamente
}
```

---

## 🔐 Rutas de Autenticación (`/auth`)

### **POST** `/auth/register`
Registrar nuevo usuario

**Body:**
```json
{
  "name": "string (1-20 chars)",
  "lastname": "string (1-20 chars)", 
  "email": "string (email válido)",
  "password": "string (8-30 chars)",
  "role": "string (opcional, 1-10 chars)"
}
```

**Ejemplo Vue:**
```javascript
const register = async (userData) => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  return response.json();
};
```

### **POST** `/auth/login`
Iniciar sesión

**Body:**
```json
{
  "email": "string (email válido)",
  "password": "string (8-30 chars)"
}
```

**Ejemplo Vue:**
```javascript
const login = async (credentials) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Importante para cookies
    body: JSON.stringify(credentials)
  });
  return response.json();
};
```

### **POST** `/auth/refresh`
Refrescar token de acceso

**Ejemplo Vue:**
```javascript
const refreshToken = async () => {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include'
  });
  return response.json();
};
```

### **GET** `/auth/profile`
Obtener perfil del usuario autenticado

**Requiere:** Autenticación (cookie)

**Ejemplo Vue:**
```javascript
const getProfile = async () => {
  const response = await fetch('/api/auth/profile', {
    credentials: 'include'
  });
  return response.json();
};
```

---

## 👥 Rutas de Usuarios (`/users`)

### **GET** `/users`
Obtener todos los usuarios

**Requiere:** Admin
**Ejemplo Vue:**
```javascript
const getUsers = async () => {
  const response = await fetch('/api/users', {
    credentials: 'include'
  });
  return response.json();
};
```

### **GET** `/users/:id`
Obtener usuario por ID

**Requiere:** Admin
**Parámetros:** `id` (UUID)

**Ejemplo Vue:**
```javascript
const getUserById = async (userId) => {
  const response = await fetch(`/api/users/${userId}`, {
    credentials: 'include'
  });
  return response.json();
};
```

### **PATCH** `/users/:id`
Actualizar usuario

**Requiere:** Admin (cualquier usuario) o Client (solo a sí mismo)
**Parámetros:** `id` (UUID)

**Body (todos opcionales):**
```json
{
  "name": "string (1-20 chars)",
  "lastname": "string (1-20 chars)",
  "email": "string (email válido)", 
  "password": "string (8-30 chars)",
  "role": "string (1-10 chars)"
}
```

**Ejemplo Vue:**
```javascript
const updateUser = async (userId, userData) => {
  const response = await fetch(`/api/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(userData)
  });
  return response.json();
};
```

### **DELETE** `/users/:id`
Eliminar usuario

**Requiere:** Admin
**Parámetros:** `id` (UUID)

**Ejemplo Vue:**
```javascript
const deleteUser = async (userId) => {
  const response = await fetch(`/api/users/${userId}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  return response.json();
};
```

---

## 🛍️ Rutas de Productos (`/products`)

### **GET** `/products`
Obtener todos los productos

**Público** (sin autenticación)

**Ejemplo Vue:**
```javascript
const getProducts = async () => {
  const response = await fetch('/api/products');
  return response.json();
};
```

### **GET** `/products/:id`
Obtener producto por ID

**Público** (sin autenticación)
**Parámetros:** `id` (MongoDB ObjectId - 24 chars hex)

**Ejemplo Vue:**
```javascript
const getProductById = async (productId) => {
  const response = await fetch(`/api/products/${productId}`);
  return response.json();
};
```

### **POST** `/products`
Crear producto

**Requiere:** Admin
**Content-Type:** `multipart/form-data` (para imagen)

**FormData:**
```javascript
const formData = new FormData();
formData.append('name', 'Nombre del producto');
formData.append('price', '29.99');
formData.append('description', 'Descripción del producto');
formData.append('image', imageFile); // File object
```

**Validaciones:**
- `name`: 3-100 caracteres
- `price`: número positivo
- `description`: 3-255 caracteres
- `image`: archivo de imagen o URL

**Ejemplo Vue:**
```javascript
const createProduct = async (productData, imageFile) => {
  const formData = new FormData();
  formData.append('name', productData.name);
  formData.append('price', productData.price);
  formData.append('description', productData.description);
  if (imageFile) {
    formData.append('image', imageFile);
  }
  
  const response = await fetch('/api/products', {
    method: 'POST',
    credentials: 'include',
    body: formData
  });
  return response.json();
};
```

### **PATCH** `/products/:id`
Actualizar producto

**Requiere:** Admin
**Parámetros:** `id` (MongoDB ObjectId)
**Content-Type:** `multipart/form-data`

**FormData (todos opcionales):**
```javascript
const formData = new FormData();
formData.append('name', 'Nuevo nombre'); // opcional
formData.append('price', '35.99'); // opcional
formData.append('description', 'Nueva descripción'); // opcional
formData.append('image', newImageFile); // opcional
```

**Ejemplo Vue:**
```javascript
const updateProduct = async (productId, updates, imageFile = null) => {
  const formData = new FormData();
  
  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined) {
      formData.append(key, updates[key]);
    }
  });
  
  if (imageFile) {
    formData.append('image', imageFile);
  }
  
  const response = await fetch(`/api/products/${productId}`, {
    method: 'PATCH',
    credentials: 'include',
    body: formData
  });
  return response.json();
};
```

### **DELETE** `/products/:id`
Eliminar producto

**Requiere:** Admin
**Parámetros:** `id` (MongoDB ObjectId)

**Ejemplo Vue:**
```javascript
const deleteProduct = async (productId) => {
  const response = await fetch(`/api/products/${productId}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  return response.json();
};
```

---

## 📦 Rutas de Pedidos (`/orders`)

### **POST** `/orders`
Crear pedido

**Requiere:** Client (autenticado)

**Body:**
```json
{
  "items": [
    {
      "productId": "string (MongoDB ObjectId - 24 chars hex)",
      "quantity": "number (entero positivo)"
    }
  ],
  "deliveryAddress": "string (10-200 chars, opcional)",
  "phone": "string (8-15 chars, opcional)",
  "notes": "string (max 500 chars, opcional)"
}
```

**Ejemplo Vue:**
```javascript
const createOrder = async (orderData) => {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(orderData)
  });
  return response.json();
};
```

### **GET** `/orders/my-orders`
Obtener mis pedidos

**Requiere:** Client (autenticado)

**Ejemplo Vue:**
```javascript
const getMyOrders = async () => {
  const response = await fetch('/api/orders/my-orders', {
    credentials: 'include'
  });
  return response.json();
};
```

### **GET** `/orders`
Obtener todos los pedidos

**Requiere:** Admin

**Ejemplo Vue:**
```javascript
const getAllOrders = async () => {
  const response = await fetch('/api/orders', {
    credentials: 'include'
  });
  return response.json();
};
```

### **GET** `/orders/stats`
Obtener estadísticas de pedidos

**Requiere:** Admin

**Ejemplo Vue:**
```javascript
const getOrderStats = async () => {
  const response = await fetch('/api/orders/stats', {
    credentials: 'include'
  });
  return response.json();
};
```

### **GET** `/orders/:id`
Obtener pedido por ID

**Requiere:** Admin (puede ver todos) o Client (solo los suyos)
**Parámetros:** `id` (MongoDB ObjectId)

**Ejemplo Vue:**
```javascript
const getOrderById = async (orderId) => {
  const response = await fetch(`/api/orders/${orderId}`, {
    credentials: 'include'
  });
  return response.json();
};
```

### **PATCH** `/orders/:id/status`
Actualizar estado del pedido

**Requiere:** Admin
**Parámetros:** `id` (MongoDB ObjectId)

**Body:**
```json
{
  "status": "pending | confirmed | preparing | ready | delivered | cancelled"
}
```

**Ejemplo Vue:**
```javascript
const updateOrderStatus = async (orderId, status) => {
  const response = await fetch(`/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status })
  });
  return response.json();
};
```

### **PATCH** `/orders/:id/cancel`
Cancelar pedido

**Requiere:** Admin (cualquier pedido) o Client (solo los suyos)
**Parámetros:** `id` (MongoDB ObjectId)

**Ejemplo Vue:**
```javascript
const cancelOrder = async (orderId) => {
  const response = await fetch(`/api/orders/${orderId}/cancel`, {
    method: 'PATCH',
    credentials: 'include'
  });
  return response.json();
};
```

---

## 🖼️ Ruta de Imágenes

### **GET** `/images/*`
Servir imágenes estáticas

**Público** (sin autenticación)

**Ejemplo de uso:**
```html
<img :src="`/api/images/${product.image}`" alt="Producto" />
```

---

## 🔍 Ruta de Salud

### **GET** `/health`
Verificar estado del servidor

**Público**

**Ejemplo Vue:**
```javascript
const checkHealth = async () => {
  const response = await fetch('/api/health');
  return response.text(); // Retorna "OK"
};
```

---

## 🛠️ Composable Vue Recomendado

```javascript
// composables/useApi.js
import { ref } from 'vue'

export function useApi() {
  const loading = ref(false)
  const error = ref(null)
  
  const apiCall = async (url, options = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`/api${url}`, {
        credentials: 'include',
        ...options
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }
  
  return {
    loading,
    error,
    apiCall
  }
}
```

**Uso del composable:**
```javascript
// En un componente Vue
import { useApi } from '@/composables/useApi'

export default {
  setup() {
    const { loading, error, apiCall } = useApi()
    
    const login = async (credentials) => {
      return await apiCall('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })
    }
    
    return {
      loading,
      error,
      login
    }
  }
}
```