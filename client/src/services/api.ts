import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // 处理未授权错误
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// 数据类型定义
export interface Product {
  id: number;
  name: string;
  version: string;
  description?: string;
  file_path?: string;
  file_name?: string;
  file_size?: number;
  upload_time?: string;
  created_at: string;
  updated_at: string;
}

export interface Channel {
  id: number;
  name: string;
  type: string;
  description?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  customer_names?: string;
  product_names?: string;
  customers?: Customer[];
  products?: Product[];
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  name: string;
  industry?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  address?: string;
  delivery_person?: string;
  deployment_plan?: string;
  channel_names?: string;
  product_names?: string;
  license_count?: number;
  channels?: Channel[];
  products?: Product[];
  licenses?: License[];
  created_at: string;
  updated_at: string;
}

export interface License {
  id: number;
  customer_id: number;
  license_object: string;
  start_date: string;
  end_date: string;
  feature_code?: string;
  valid_points: number;
  description?: string;
  customer_name?: string;
  customer_industry?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  created_at: string;
  updated_at: string;
}

// 产品API
export const productApi = {
  getAll: (): Promise<Product[]> => api.get('/products'),
  getById: (id: number): Promise<Product> => api.get(`/products/${id}`),
  create: (data: FormData): Promise<any> => 
    api.post('/products', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: number, data: FormData): Promise<any> => 
    api.put(`/products/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: number): Promise<any> => api.delete(`/products/${id}`),
  download: (id: number): Promise<any> => api.get(`/products/${id}/download`, { responseType: 'blob' }),
};

// 渠道API
export const channelApi = {
  getAll: (): Promise<Channel[]> => api.get('/channels'),
  getById: (id: number): Promise<Channel> => api.get(`/channels/${id}`),
  create: (data: Partial<Channel> & { customer_ids?: number[], product_ids?: number[] }): Promise<any> => 
    api.post('/channels', data),
  update: (id: number, data: Partial<Channel> & { customer_ids?: number[], product_ids?: number[] }): Promise<any> => 
    api.put(`/channels/${id}`, data),
  delete: (id: number): Promise<any> => api.delete(`/channels/${id}`),
  getAvailableCustomers: (): Promise<{ id: number, name: string }[]> => api.get('/channels/available/customers'),
  getAvailableProducts: (): Promise<{ id: number, name: string, version: string }[]> => api.get('/channels/available/products'),
};

// 客户API
export const customerApi = {
  getAll: (): Promise<Customer[]> => api.get('/customers'),
  getById: (id: number): Promise<Customer> => api.get(`/customers/${id}`),
  create: (data: Partial<Customer> & { channel_ids?: number[], product_ids?: number[] }): Promise<any> => 
    api.post('/customers', data),
  update: (id: number, data: Partial<Customer> & { channel_ids?: number[], product_ids?: number[] }): Promise<any> => 
    api.put(`/customers/${id}`, data),
  delete: (id: number): Promise<any> => api.delete(`/customers/${id}`),
  getAvailableChannels: (): Promise<{ id: number, name: string, type: string }[]> => api.get('/customers/available/channels'),
  getAvailableProducts: (): Promise<{ id: number, name: string, version: string }[]> => api.get('/customers/available/products'),
};

// 许可API
export const licenseApi = {
  getAll: (): Promise<License[]> => api.get('/licenses'),
  getById: (id: number): Promise<License> => api.get(`/licenses/${id}`),
  getByCustomerId: (customerId: number): Promise<License[]> => api.get(`/licenses/customer/${customerId}`),
  create: (data: Partial<License>): Promise<any> => api.post('/licenses', data),
  update: (id: number, data: Partial<License>): Promise<any> => api.put(`/licenses/${id}`, data),
  delete: (id: number): Promise<any> => api.delete(`/licenses/${id}`),
  getExpiringSoon: (): Promise<License[]> => api.get('/licenses/expiring/soon'),
  getExpired: (): Promise<License[]> => api.get('/licenses/expired/all'),
  getAvailableCustomers: (): Promise<{ id: number, name: string, industry: string }[]> => api.get('/licenses/available/customers'),
};

export default api;