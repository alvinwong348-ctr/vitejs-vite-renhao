import React, { useState, useMemo, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import {
  Users,
  LayoutDashboard,
  Settings,
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Phone,
  Mail,
  Building2,
  Calendar,
  Briefcase,
  Truck,
  Package,
  FileText,
  Tag,
  Box,
  MessageSquare,
  ShoppingCart,
  Clock,
  PlusCircle,
  MapPin,
  Printer,
  MoreVertical,
  Hash,
  Globe,
  LogOut,
  Paperclip,
  Download,
  FileUp,
  Landmark,
  FolderOpen,
  CreditCard,
  Menu,
  X,
} from 'lucide-react';

// --- LOGO 設定 ---
const rhLogoUrl = '/logo.png';

// --- 初始模擬資料 ---
const initialProducts = [
  {
    id: 1,
    productId: 'RHP001',
    name: '高碳鋼精密齒輪',
    category: '傳動零件',
    specs: '外徑 50mm / 內徑 20mm',
    purchasePrice: 850,
    purchaseUnit: 'PCS',
    sellingPrice: 1250,
    sellingUnit: 'PCS',
    supplier: '某某五金精密',
    customers: ['全新包裝工業', '通用機械設備'],
  },
  {
    id: 2,
    productId: 'RHP002',
    name: '工業級不鏽鋼螺絲組',
    category: '五金配件',
    specs: 'M8 x 50mm',
    purchasePrice: 200,
    purchaseUnit: 'KG',
    sellingPrice: 450,
    sellingUnit: 'KG',
    supplier: '高雄螺絲廠',
    customers: ['通用機械設備'],
  },
  {
    id: 3,
    productId: 'RHP003',
    name: '防撞氣泡袋 (大)',
    category: '包材',
    specs: '100cm x 100m',
    purchasePrice: 500,
    purchaseUnit: 'ROLL',
    sellingPrice: 850,
    sellingUnit: 'ROLL',
    supplier: '包裝材料行',
    customers: ['全新包裝工業'],
  },
];

const defaultCompanyInfo = {
  basic: {
    name: '仁豪興業有限公司',
    nameEn: 'REN HAO INDUSTRIAL CO., LTD.',
    taxId: '',
    phone: '',
    fax: '',
    email: '',
    address: '',
    website: '',
  },
  bank: {
    bankName: '',
    branch: '',
    accountName: '',
    accountNumber: '',
    swift: '',
  },
  documents: [],
};

// --- Firebase 雲端資料庫設定 ---
const firebaseConfig = {
  apiKey: 'AIzaSyCfKnt2ITG0FA5YWkGdGJPxNmGSZKlNeJw',
  authDomain: 'rh-crm-system.firebaseapp.com',
  projectId: 'rh-crm-system',
  storageBucket: 'rh-crm-system.firebasestorage.app',
  messagingSenderId: '416690239815',
  appId: '1:416690239815:web:319ec4fa7a09c982f57462',
  measurementId: 'G-Z3S9VHNX3F',
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

export default function App() {
  // 資料狀態
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState(initialProducts);
  const [companyInfo, setCompanyInfo] = useState(defaultCompanyInfo);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState('');

  const [activeModule, setActiveModule] = useState('dashboard');
  const [view, setView] = useState('list');
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // RWD: 控制手機版側邊欄開關
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- Firebase 登入與資料同步 ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (
          typeof __initial_auth_token !== 'undefined' &&
          __initial_auth_token
        ) {
          try {
            await signInWithCustomToken(auth, __initial_auth_token);
          } catch (e) {
            console.warn('使用自訂 Firebase 專案，改為匿名登入');
            await signInAnonymously(auth);
          }
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error('初始驗證失敗:', error);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    setLoginError('');
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Google 登入失敗:', error);
      setLoginError(
        `登入失敗 (${error.code})。如果出現未授權網域，請將當前網址加入 Firebase 的 Authorized domains。`
      );
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      await signInAnonymously(auth);
    } catch (error) {
      console.error('登出失敗:', error);
    }
  };

  useEffect(() => {
    if (!user || user.isAnonymous) {
      setIsLoading(false);
      return;
    }

    const unsubCustomers = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data', 'customers'),
      (snap) =>
        setCustomers(snap.docs.map((doc) => ({ ...doc.data(), id: doc.id }))),
      (err) => console.error('讀取客戶失敗:', err)
    );

    const unsubSuppliers = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data', 'suppliers'),
      (snap) =>
        setSuppliers(snap.docs.map((doc) => ({ ...doc.data(), id: doc.id }))),
      (err) => console.error('讀取供應商失敗:', err)
    );

    const unsubProducts = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data', 'products'),
      (snap) => {
        setProducts(snap.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
        setIsLoading(false);
      },
      (err) => console.error('讀取產品失敗:', err)
    );

    const unsubCompany = onSnapshot(
      doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'company_info'),
      (docSnap) => {
        if (docSnap.exists()) {
          setCompanyInfo({ ...defaultCompanyInfo, ...docSnap.data() });
        }
      },
      (err) => console.error('讀取本公司資料失敗:', err)
    );

    return () => {
      unsubCustomers();
      unsubSuppliers();
      unsubProducts();
      unsubCompany();
    };
  }, [user]);

  const handleNavigate = (module, newView = 'list', item = null) => {
    setActiveModule(module);
    setView(newView);
    setSelectedItem(item);
    setSearchQuery('');
    setIsSidebarOpen(false); // 在手機版切換模組後自動關閉側邊欄
  };

  const handleSaveItem = async (module, data) => {
    if (!user) return;
    const id = data.id ? String(data.id) : String(Date.now());
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', module, id);
    const cleanData = JSON.parse(JSON.stringify({ ...data, id }));
    await setDoc(docRef, cleanData);
    handleNavigate(module, 'list');
  };

  const handleUpdateCustomerData = async (updatedCustomer) => {
    if (!user) return;
    const docRef = doc(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'customers',
      String(updatedCustomer.id)
    );
    const cleanData = JSON.parse(JSON.stringify(updatedCustomer));
    await setDoc(docRef, cleanData);
    setSelectedItem(updatedCustomer);
  };

  const handleUpdateSupplierData = async (updatedSupplier) => {
    if (!user) return;
    const docRef = doc(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'suppliers',
      String(updatedSupplier.id)
    );
    const cleanData = JSON.parse(JSON.stringify(updatedSupplier));
    await setDoc(docRef, cleanData);
    setSelectedItem(updatedSupplier);
  };

  const handleSaveCompanyInfo = async (data) => {
    if (!user) return;
    const docRef = doc(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'settings',
      'company_info'
    );
    await setDoc(docRef, data);
  };

  const handleDeleteItem = async (module, id) => {
    if (!window.confirm('確定要刪除這筆資料嗎？此操作無法復原。')) return;
    if (!user) return;
    const docRef = doc(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      module,
      String(id)
    );
    await deleteDoc(docRef);
    if (view === 'detail' && selectedItem?.id === id) {
      handleNavigate(module, 'list');
    }
  };

  const getFilteredList = (list, searchFields) => {
    if (!searchQuery) return list;
    const lowerQuery = searchQuery.toLowerCase();
    return list.filter((item) =>
      searchFields.some((field) =>
        String(item[field] || '')
          .toLowerCase()
          .includes(lowerQuery)
      )
    );
  };

  const filteredCustomers = getFilteredList(customers, [
    'companyName',
    'contactPerson',
    'phone',
  ]);
  const filteredSuppliers = getFilteredList(suppliers, [
    'name',
    'contactPerson',
    'category',
  ]);

  const mappedProducts = getFilteredList(products, [
    'productId',
    'name',
    'category',
    'specs',
  ]).map((p) => ({
    ...p,
    priceDisplay: p.sellingPrice
      ? `NT$ ${Number(p.sellingPrice).toLocaleString()} / ${
          p.sellingUnit || 'M'
        }`
      : '-',
    customersDisplay: (p.customers || []).join(', ') || '-',
  }));

  const dashboardStats = {
    customers: {
      total: customers.length,
      active: customers.filter((c) => c.status === '活躍').length,
    },
    suppliers: {
      total: suppliers.length,
      active: suppliers.filter((s) => s.status === '合作中').length,
    },
    products: { total: products.length, active: products.length },
  };

  // --- 登入畫面 ---
  if (!user || user.isAnonymous) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900 px-4">
        <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-indigo-100/50 border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 mx-auto mb-6 p-1">
            <img
              src={rhLogoUrl}
              alt="仁豪興業 LOGO"
              className="w-full h-full object-contain rounded-xl bg-white"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML =
                  '<div class="text-white font-bold text-2xl">RH</div>';
              }}
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight mb-1">
            仁豪興業有限公司
          </h1>
          <h2 className="text-xs sm:text-sm font-semibold text-slate-600 tracking-tight mb-2">
            REN HAO INDUSTRIAL CO., LTD.
          </h2>
          <p className="text-slate-500 mb-8 text-sm">
            請登入您的企業帳號以存取系統
          </p>

          {loginError && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-sm text-left leading-relaxed">
              {loginError}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-6 py-3.5 rounded-xl font-semibold shadow-sm transition-all active:scale-95 text-sm sm:text-base"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            使用 Google 帳號登入
          </button>
          <div className="mt-8 pt-6 border-t border-slate-100 text-xs text-slate-400">
            &copy; {new Date().getFullYear()} 仁豪興業有限公司. All rights
            reserved.
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-medium tracking-wider">
            系統連線中，正在載入雲端資料庫...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900 relative">
      {/* 手機版側邊欄遮罩 */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 側邊欄 */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-[#0B1120] text-slate-300 w-[260px] flex-shrink-0 flex flex-col transition-transform duration-300 border-r border-slate-800/50 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-16 sm:h-20 flex items-center justify-between px-6 border-b border-white/5 bg-[#0B1120]/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 w-full">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 p-0.5 shrink-0">
              <img
                src={rhLogoUrl}
                alt="仁豪興業 LOGO"
                className="w-full h-full object-contain rounded-md bg-white"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentNode.innerHTML =
                    '<div class="text-white font-bold text-xs sm:text-sm">RH</div>';
                }}
              />
            </div>
            <div className="flex flex-col overflow-hidden">
              <h1 className="text-[13px] sm:text-[15px] font-bold text-white tracking-wide truncate leading-tight">
                仁豪興業有限公司
              </h1>
              <h2 className="text-[9px] sm:text-[10px] font-semibold text-slate-400 tracking-wide truncate leading-tight">
                REN HAO INDUSTRIAL CO.
              </h2>
            </div>
          </div>
          {/* 手機版關閉按鈕 */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 -mr-2 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 py-6 overflow-y-auto px-4 custom-scrollbar">
          <ul className="space-y-1">
            <NavItem
              icon={LayoutDashboard}
              label="系統儀表板"
              isActive={activeModule === 'dashboard'}
              onClick={() => handleNavigate('dashboard')}
            />

            <div className="px-4 pt-6 pb-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              業務管理
            </div>
            <NavItem
              icon={Users}
              label="客戶管理"
              isActive={activeModule === 'customers'}
              onClick={() => handleNavigate('customers')}
            />
            <NavItem
              icon={Truck}
              label="供應商管理"
              isActive={activeModule === 'suppliers'}
              onClick={() => handleNavigate('suppliers')}
            />
            <NavItem
              icon={Package}
              label="產品管理"
              isActive={activeModule === 'products'}
              onClick={() => handleNavigate('products')}
            />

            <div className="px-4 pt-6 pb-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              系統與設定
            </div>
            <NavItem
              icon={Building2}
              label="本公司專區"
              isActive={activeModule === 'company'}
              onClick={() => handleNavigate('company')}
            />
          </ul>
        </nav>
        <div className="p-4 m-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between group">
          <div className="flex items-center gap-3 min-w-0">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="User"
                className="w-9 h-9 rounded-full border border-indigo-500/30 object-cover shrink-0"
              />
            ) : (
              <div className="w-9 h-9 shrink-0 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm border border-indigo-500/30">
                {user?.displayName
                  ? user.displayName.charAt(0).toUpperCase()
                  : 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-sm font-medium text-white truncate">
                {user?.displayName || '使用者'}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {user?.email || '已登入'}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 shrink-0"
            title="登出"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 h-16 sm:h-20 flex items-center justify-between px-4 sm:px-8 flex-shrink-0 z-10 sticky top-0">
          <div className="flex items-center gap-3 w-full">
            {/* 手機版漢堡選單按鈕 */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 mr-1 text-slate-500 hover:bg-slate-100 rounded-xl lg:hidden transition-colors"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight truncate flex-1">
              {activeModule === 'dashboard' && '系統儀表板'}
              {activeModule === 'customers' && '客戶管理'}
              {activeModule === 'suppliers' && '供應商管理'}
              {activeModule === 'products' && '產品管理'}
              {activeModule === 'company' && '本公司專區'}
              <span className="text-slate-400 font-normal hidden sm:inline">
                {view === 'form' &&
                  (selectedItem ? ' / 編輯資料' : ' / 新增資料')}
                {view === 'detail' && ' / 詳細資訊'}
              </span>
            </h2>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-8 custom-scrollbar relative z-0">
          <div className="max-w-[1400px] mx-auto pb-12">
            {activeModule === 'dashboard' && (
              <DashboardView
                stats={dashboardStats}
                onNavigate={handleNavigate}
                customers={customers}
                suppliers={suppliers}
              />
            )}

            {activeModule === 'customers' && view === 'list' && (
              <GenericListView
                title="客戶列表"
                items={filteredCustomers}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onAdd={() => handleNavigate('customers', 'form')}
                columns={[
                  { key: 'companyName', label: '公司名稱' },
                  { key: 'contactPerson', label: '聯絡窗口' },
                  { key: 'phone', label: '電話' },
                  { key: 'status', label: '狀態', isBadge: true },
                ]}
                onView={(item) => handleNavigate('customers', 'detail', item)}
                onEdit={(item) => handleNavigate('customers', 'form', item)}
                onDelete={(id) => handleDeleteItem('customers', id)}
              />
            )}
            {activeModule === 'customers' && view === 'form' && (
              <CustomerFormView
                item={selectedItem}
                onSave={(data) => handleSaveItem('customers', data)}
                onCancel={() =>
                  handleNavigate(
                    'customers',
                    selectedItem ? 'detail' : 'list',
                    selectedItem
                  )
                }
              />
            )}
            {activeModule === 'customers' && view === 'detail' && (
              <CustomerDetailView
                item={selectedItem}
                onBack={() => handleNavigate('customers', 'list')}
                onEdit={() => handleNavigate('customers', 'form', selectedItem)}
                onDelete={() => handleDeleteItem('customers', selectedItem.id)}
                onUpdate={handleUpdateCustomerData}
              />
            )}

            {activeModule === 'suppliers' && view === 'list' && (
              <GenericListView
                title="供應商列表"
                items={filteredSuppliers}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onAdd={() => handleNavigate('suppliers', 'form')}
                columns={[
                  { key: 'name', label: '供應商名稱' },
                  { key: 'category', label: '供應物料' },
                  { key: 'contactPerson', label: '聯絡人' },
                  { key: 'status', label: '狀態', isBadge: true },
                ]}
                onView={(item) => handleNavigate('suppliers', 'detail', item)}
                onEdit={(item) => handleNavigate('suppliers', 'form', item)}
                onDelete={(id) => handleDeleteItem('suppliers', id)}
              />
            )}
            {activeModule === 'suppliers' && view === 'form' && (
              <SupplierFormView
                item={selectedItem}
                onSave={(data) => handleSaveItem('suppliers', data)}
                onCancel={() =>
                  handleNavigate(
                    'suppliers',
                    selectedItem ? 'detail' : 'list',
                    selectedItem
                  )
                }
              />
            )}
            {activeModule === 'suppliers' && view === 'detail' && (
              <SupplierDetailView
                item={selectedItem}
                customers={customers}
                onBack={() => handleNavigate('suppliers', 'list')}
                onEdit={() => handleNavigate('suppliers', 'form', selectedItem)}
                onDelete={() => handleDeleteItem('suppliers', selectedItem.id)}
                onUpdate={handleUpdateSupplierData}
              />
            )}

            {activeModule === 'products' && view === 'list' && (
              <GenericListView
                title="產品列表"
                items={mappedProducts}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onAdd={() => handleNavigate('products', 'form')}
                columns={[
                  { key: 'productId', label: '產品編號' },
                  { key: 'name', label: '品名' },
                  { key: 'category', label: '類別' },
                  { key: 'priceDisplay', label: '出售單價' },
                  { key: 'customersDisplay', label: '對應客人' },
                ]}
                onView={(item) => handleNavigate('products', 'detail', item)}
                onEdit={(item) => handleNavigate('products', 'form', item)}
                onDelete={(id) => handleDeleteItem('products', id)}
              />
            )}
            {activeModule === 'products' && view === 'form' && (
              <ProductFormView
                item={selectedItem}
                customers={customers}
                suppliers={suppliers}
                onSave={(data) => handleSaveItem('products', data)}
                onCancel={() =>
                  handleNavigate(
                    'products',
                    selectedItem ? 'detail' : 'list',
                    selectedItem
                  )
                }
              />
            )}
            {activeModule === 'products' && view === 'detail' && (
              <ProductDetailView
                item={selectedItem}
                onBack={() => handleNavigate('products', 'list')}
                onEdit={() => handleNavigate('products', 'form', selectedItem)}
                onDelete={() => handleDeleteItem('products', selectedItem.id)}
              />
            )}

            {activeModule === 'company' && (
              <CompanyProfileView
                data={companyInfo}
                onSave={handleSaveCompanyInfo}
              />
            )}
          </div>
        </div>
      </main>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `,
        }}
      />
    </div>
  );
}

function NavItem({ icon: Icon, label, isActive, onClick }) {
  return (
    <li>
      <button
        onClick={onClick}
        className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
          isActive
            ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
        }`}
      >
        <Icon
          size={18}
          className={`mr-3 transition-transform duration-200 ${
            isActive ? 'scale-110' : 'group-hover:scale-110'
          }`}
        />
        <span className="text-sm font-medium tracking-wide">{label}</span>
      </button>
    </li>
  );
}

// ==========================================
// 儀表板與行事曆 (全新升級)
// ==========================================
function DashboardView({ stats, onNavigate, customers, suppliers }) {
  // --- 統計卡片 ---
  const cards = [
    {
      title: '客戶管理',
      icon: Users,
      stat: stats.customers.total,
      subLabel: '活躍中',
      subStat: stats.customers.active,
      color: 'indigo',
      path: 'customers',
    },
    {
      title: '供應商管理',
      icon: Truck,
      stat: stats.suppliers.total,
      subLabel: '合作中',
      subStat: stats.suppliers.active,
      color: 'blue',
      path: 'suppliers',
    },
    {
      title: '產品管理',
      icon: Package,
      stat: stats.products.total,
      subLabel: '登錄總數',
      subStat: stats.products.active,
      color: 'emerald',
      path: 'products',
      alert: false,
    },
  ];
  const colorClasses = {
    indigo: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
    blue: 'bg-blue-50 text-blue-600 ring-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  };

  // --- 行事曆邏輯 ---
  const [currentDate, setCurrentDate] = useState(new Date());

  // 取得當天的 YYYY-MM-DD 格式 (避免時區問題，手動組裝)
  const formatYMD = (dObj) => {
    const y = dObj.getFullYear();
    const m = String(dObj.getMonth() + 1).padStart(2, '0');
    const d = String(dObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const todayStr = formatYMD(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(todayStr);

  // 整理所有行程事件
  const calendarEvents = useMemo(() => {
    const events = {};
    const addEvent = (dateStr, type, title, detail, styleStr, icon) => {
      if (!dateStr) return;
      if (!events[dateStr]) events[dateStr] = [];
      events[dateStr].push({ type, title, detail, styleStr, icon });
    };

    customers.forEach((c) => {
      (c.orders || []).forEach((o) => {
        addEvent(
          o.date,
          'customer_order',
          `客戶下單: ${c.companyName}`,
          `單號: ${o.quotationNumber || o.piNumber || '無'}`,
          'bg-indigo-100 text-indigo-700 border-indigo-200',
          '🔵'
        );
        if (o.deliveryDate) {
          addEvent(
            o.deliveryDate,
            'customer_delivery',
            `客戶交貨: ${c.companyName}`,
            `單號: ${o.quotationNumber || o.piNumber || '無'}`,
            'bg-emerald-100 text-emerald-700 border-emerald-200',
            '🟢'
          );
        }
      });
    });

    suppliers.forEach((s) => {
      (s.orders || []).forEach((o) => {
        addEvent(
          o.date,
          'supplier_order',
          `供應商採購: ${s.name}`,
          `PO: ${o.poNumber || '無'}`,
          'bg-blue-100 text-blue-700 border-blue-200',
          '🟦'
        );
        if (o.deliveryDate) {
          addEvent(
            o.deliveryDate,
            'supplier_delivery',
            `供應商進貨: ${s.name}`,
            `PO: ${o.poNumber || '無'}`,
            'bg-amber-100 text-amber-700 border-amber-200',
            '🟠'
          );
        }
      });
    });

    return events;
  }, [customers, suppliers]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => {
    setCurrentDate(new Date());
    setSelectedDateStr(todayStr);
  };

  const selectedEvents = calendarEvents[selectedDateStr] || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 上方統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {cards.map((card, idx) => (
          <div
            key={idx}
            onClick={() => onNavigate(card.path)}
            className="group bg-white rounded-2xl p-5 sm:p-6 shadow-sm shadow-slate-200/50 border border-slate-200 cursor-pointer hover:shadow-lg hover:border-slate-300 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-4 sm:mb-6">
              <div
                className={`p-3 rounded-xl ring-4 ${
                  colorClasses[card.color]
                } transition-transform group-hover:scale-110`}
              >
                <card.icon size={20} className="sm:w-6 sm:h-6" />
              </div>
              <button className="text-slate-300 hover:text-slate-500 transition-colors p-1">
                <ChevronRight size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
            <div>
              <p className="text-[11px] sm:text-[13px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                {card.title}
              </p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-800">
                  {card.stat}
                </h3>
                <span className="text-xs sm:text-sm font-medium text-slate-400">
                  總數
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 下方行事曆區塊 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 bg-indigo-100 text-indigo-600 rounded-lg">
              <Calendar size={18} className="sm:w-5 sm:h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
              訂單與交期行事曆
            </h3>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center">
              <button
                onClick={prevMonth}
                className="p-1.5 sm:p-2 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              >
                <ChevronLeft size={16} className="sm:w-4 sm:h-4" />
              </button>
              <div className="w-24 sm:w-32 text-center text-sm sm:text-base font-bold text-slate-800 tracking-wider">
                {year} 年 {month + 1} 月
              </div>
              <button
                onClick={nextMonth}
                className="p-1.5 sm:p-2 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              >
                <ChevronRight size={16} className="sm:w-4 sm:h-4" />
              </button>
            </div>
            <button
              onClick={goToday}
              className="px-3 py-1.5 sm:py-2 border border-slate-200 rounded-lg hover:bg-slate-100 text-xs sm:text-sm font-semibold text-slate-600 transition-colors whitespace-nowrap"
            >
              今天
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* 左側日曆主體 */}
          <div className="flex-1 p-2 sm:p-6 border-b lg:border-b-0 lg:border-r border-slate-100 overflow-x-auto">
            <div className="min-w-[400px]">
              <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                {/* 星期標題 */}
                {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
                  <div
                    key={day}
                    className="bg-slate-50 py-2 sm:py-3 text-center text-xs sm:text-sm font-bold text-slate-500"
                  >
                    {day}
                  </div>
                ))}

                {/* 日期格子 */}
                {days.map((dObj, idx) => {
                  if (!dObj)
                    return (
                      <div
                        key={`empty-${idx}`}
                        className="bg-slate-50/50 min-h-[60px] sm:min-h-[100px]"
                      ></div>
                    );

                  const dStr = formatYMD(dObj);
                  const isToday = dStr === todayStr;
                  const isSelected = dStr === selectedDateStr;
                  const dayEvents = calendarEvents[dStr] || [];

                  return (
                    <div
                      key={dStr}
                      onClick={() => setSelectedDateStr(dStr)}
                      className={`min-h-[60px] sm:min-h-[100px] bg-white p-1 sm:p-2 cursor-pointer hover:bg-slate-50 transition-colors border-t border-slate-100 relative ${
                        isSelected
                          ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50/20'
                          : ''
                      }`}
                    >
                      <div
                        className={`text-xs sm:text-sm font-semibold mb-1 w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center rounded-full ${
                          isToday
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-700'
                        }`}
                      >
                        {dObj.getDate()}
                      </div>
                      <div className="space-y-0.5 sm:space-y-1">
                        {dayEvents.slice(0, 2).map((ev, i) => (
                          <div
                            key={i}
                            className={`text-[9px] sm:text-[10px] px-1 py-0.5 sm:px-1.5 rounded truncate border ${ev.styleStr}`}
                            title={ev.title}
                          >
                            <span className="hidden sm:inline">{ev.icon}</span>{' '}
                            {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-[9px] sm:text-[10px] px-1 py-0.5 sm:px-1.5 rounded text-slate-500 font-medium">
                            + {dayEvents.length - 2} 筆
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 右側詳細行程列表 */}
          <div className="w-full lg:w-80 bg-slate-50/50 p-4 sm:p-6 flex flex-col h-[300px] lg:h-auto">
            <h4 className="text-sm font-bold text-slate-800 mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-slate-200 flex items-center justify-between">
              <span>{selectedDateStr} 行程明細</span>
              {selectedDateStr === todayStr && (
                <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold">
                  今天
                </span>
              )}
            </h4>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2 sm:space-y-3">
              {selectedEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60 py-8">
                  <Calendar size={24} className="mb-2 sm:w-8 sm:h-8" />
                  <p className="text-xs sm:text-sm font-medium">
                    此日無任何訂單或交期
                  </p>
                </div>
              ) : (
                selectedEvents.map((ev, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 sm:p-3.5 bg-white border rounded-xl shadow-sm hover:shadow transition-shadow ${ev.styleStr}`}
                  >
                    <div className="text-[11px] sm:text-xs font-bold mb-1 flex items-center gap-1.5">
                      <span>{ev.icon}</span> {ev.title}
                    </div>
                    <div className="text-[11px] sm:text-xs opacity-80 mt-1 sm:mt-1.5 pl-4 sm:pl-5">
                      {ev.detail}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 圖例說明 */}
            <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-200 grid grid-cols-2 lg:flex lg:flex-col gap-2 text-[10px] sm:text-xs font-medium text-slate-500">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-indigo-400"></span>{' '}
                客戶下單
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-400"></span>{' '}
                客戶交期
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-blue-400"></span>{' '}
                供應商採購
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-400"></span>{' '}
                供應商進貨
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 本公司專區
// ==========================================
function CompanyProfileView({ data, onSave }) {
  const [activeTab, setActiveTab] = useState('basic');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(data);
  const [newDoc, setNewDoc] = useState({ category: '公司簡介', file: null });

  useEffect(() => {
    setFormData(data);
  }, [data]);

  const handleSave = (e) => {
    e.preventDefault();
    onSave(formData);
    setIsEditing(false);
  };

  const handleChange = (section, field) => (e) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: e.target.value },
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('單一文件請保持在 5MB 以內。建議您壓縮 PDF 或圖片後再上傳！');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setNewDoc((prev) => ({
        ...prev,
        file: { name: file.name, data: ev.target.result, type: file.type },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddDocument = (e) => {
    e.preventDefault();
    if (!newDoc.file) return alert('請先選擇要上傳的檔案');
    const updatedDocs = [
      {
        id: Date.now(),
        category: newDoc.category,
        name: newDoc.file.name,
        data: newDoc.file.data,
        type: newDoc.file.type,
        date: new Date().toISOString().split('T')[0],
      },
      ...(formData.documents || []),
    ];

    onSave({ ...formData, documents: updatedDocs });
    setNewDoc({ category: '公司簡介', file: null });
    document.getElementById('companyFileInput').value = '';
  };

  const handleDeleteDoc = (docId) => {
    if (!window.confirm('確定要刪除這份文件嗎？')) return;
    onSave({
      ...formData,
      documents: (formData.documents || []).filter((d) => d.id !== docId),
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
          本公司資料維護
        </h2>
        {activeTab !== 'documents' &&
          (isEditing ? (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFormData(data);
                }}
                className="px-3 sm:px-5 py-2 sm:py-2.5 border border-slate-300 bg-white rounded-xl text-slate-700 hover:bg-slate-50 font-semibold transition-colors text-xs sm:text-sm"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-3 sm:px-6 py-2 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm active:scale-95 transition-all text-xs sm:text-sm whitespace-nowrap"
              >
                💾 儲存
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:border-slate-300 hover:bg-slate-50 text-xs sm:text-sm font-semibold shadow-sm transition-all"
            >
              <Edit size={14} className="sm:w-4 sm:h-4" /> 編輯資料
            </button>
          ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-4 sm:px-8 py-6 sm:py-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 bg-slate-50/50 border-b border-slate-100 text-center sm:text-left">
          <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm p-1">
            <img
              src={rhLogoUrl}
              alt="LOGO"
              className="w-full h-full object-contain rounded-xl"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML =
                  '<div class="text-indigo-600 font-bold text-lg sm:text-xl">RH</div>';
              }}
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight mb-1">
              {formData.basic.name || '仁豪興業有限公司'}
            </h1>
            <h2 className="text-xs sm:text-sm font-semibold text-slate-500">
              {formData.basic.nameEn || 'REN HAO INDUSTRIAL CO., LTD.'}
            </h2>
          </div>
        </div>

        <div className="flex border-b border-slate-200 px-2 sm:px-6 gap-1 sm:gap-2 bg-slate-50/30 overflow-x-auto custom-scrollbar">
          <TabButton
            active={activeTab === 'basic'}
            onClick={() => setActiveTab('basic')}
            icon={Building2}
            label="基本資料"
          />
          <TabButton
            active={activeTab === 'bank'}
            onClick={() => setActiveTab('bank')}
            icon={Landmark}
            label="匯款帳戶"
          />
          <TabButton
            active={activeTab === 'documents'}
            onClick={() => setActiveTab('documents')}
            icon={FolderOpen}
            label="企業文件庫"
          />
        </div>

        <div className="p-4 sm:p-6 md:p-8 min-h-[400px]">
          {activeTab === 'basic' && (
            <div className="animate-in fade-in">
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 sm:gap-y-6">
                  <FormInput
                    label="公司名稱 (中)"
                    value={formData.basic.name}
                    onChange={handleChange('basic', 'name')}
                    className="md:col-span-2"
                  />
                  <FormInput
                    label="公司名稱 (英)"
                    value={formData.basic.nameEn}
                    onChange={handleChange('basic', 'nameEn')}
                    className="md:col-span-2"
                  />
                  <FormInput
                    label="統一編號"
                    value={formData.basic.taxId}
                    onChange={handleChange('basic', 'taxId')}
                  />
                  <FormInput
                    label="公司網站"
                    value={formData.basic.website}
                    onChange={handleChange('basic', 'website')}
                  />
                  <FormInput
                    label="聯絡電話"
                    value={formData.basic.phone}
                    onChange={handleChange('basic', 'phone')}
                  />
                  <FormInput
                    label="傳真號碼"
                    value={formData.basic.fax}
                    onChange={handleChange('basic', 'fax')}
                  />
                  <FormInput
                    label="電子信箱"
                    value={formData.basic.email}
                    onChange={handleChange('basic', 'email')}
                  />
                  <FormInput
                    label="公司地址"
                    value={formData.basic.address}
                    onChange={handleChange('basic', 'address')}
                    className="md:col-span-2"
                  />
                </div>
              ) : (
                <div className="max-w-3xl space-y-4 sm:space-y-6">
                  <InfoRow
                    icon={Building2}
                    label="公司名稱"
                    value={`${formData.basic.name} / ${formData.basic.nameEn}`}
                  />
                  <InfoRow
                    icon={Hash}
                    label="統一編號"
                    value={formData.basic.taxId}
                  />
                  <InfoRow
                    icon={Phone}
                    label="聯絡電話"
                    value={formData.basic.phone}
                  />
                  <InfoRow
                    icon={Printer}
                    label="傳真號碼"
                    value={formData.basic.fax}
                  />
                  <InfoRow
                    icon={Mail}
                    label="電子信箱"
                    value={formData.basic.email}
                  />
                  <InfoRow
                    icon={Globe}
                    label="公司網站"
                    value={formData.basic.website}
                    isLink
                  />
                  <InfoRow
                    icon={MapPin}
                    label="公司地址"
                    value={formData.basic.address}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'bank' && (
            <div className="animate-in fade-in">
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 sm:gap-y-6">
                  <FormInput
                    label="收款銀行名稱"
                    value={formData.bank.bankName}
                    onChange={handleChange('bank', 'bankName')}
                  />
                  <FormInput
                    label="分行代碼 / 名稱"
                    value={formData.bank.branch}
                    onChange={handleChange('bank', 'branch')}
                  />
                  <FormInput
                    label="銀行戶名"
                    value={formData.bank.accountName}
                    onChange={handleChange('bank', 'accountName')}
                    className="md:col-span-2"
                  />
                  <FormInput
                    label="匯款帳號"
                    value={formData.bank.accountNumber}
                    onChange={handleChange('bank', 'accountNumber')}
                    className="md:col-span-2 font-mono"
                  />
                  <FormInput
                    label="SWIFT Code (國外匯款用)"
                    value={formData.bank.swift}
                    onChange={handleChange('bank', 'swift')}
                    className="font-mono"
                  />
                </div>
              ) : (
                <div className="max-w-2xl bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mt-16 -mr-16 w-32 h-32 sm:w-48 sm:h-48 bg-white/10 rounded-full blur-2xl"></div>
                  <Landmark
                    size={48}
                    className="text-white/20 absolute bottom-6 right-6 hidden sm:block"
                  />
                  <h3 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 sm:mb-6">
                    官方收款帳戶資訊
                  </h3>
                  <div className="space-y-4 sm:space-y-5 relative z-10">
                    <div>
                      <p className="text-[10px] sm:text-xs text-slate-400 mb-1">
                        銀行名稱 / 分行
                      </p>
                      <p className="text-base sm:text-lg font-semibold">
                        {formData.bank.bankName || '尚未設定'}{' '}
                        {formData.bank.branch
                          ? `(${formData.bank.branch})`
                          : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-slate-400 mb-1">
                        戶名 (Account Name)
                      </p>
                      <p className="text-base sm:text-lg font-semibold">
                        {formData.bank.accountName || '尚未設定'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-slate-400 mb-1">
                        匯款帳號 (Account Number)
                      </p>
                      <p className="text-lg sm:text-2xl font-mono tracking-widest break-all">
                        {formData.bank.accountNumber || '尚未設定'}
                      </p>
                    </div>
                    {formData.bank.swift && (
                      <div className="pt-1 sm:pt-2">
                        <span className="bg-white/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-mono border border-white/10">
                          SWIFT: {formData.bank.swift}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in">
              <form
                onSubmit={handleAddDocument}
                className="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-4 sm:gap-6 items-end shadow-sm"
              >
                <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormSelect
                    label="文件分類"
                    name="category"
                    value={newDoc.category}
                    onChange={(e) =>
                      setNewDoc({ ...newDoc, category: e.target.value })
                    }
                    options={[
                      '公司簡介',
                      '公司DM',
                      '名片',
                      '匯款資料',
                      '公司執照',
                      '其他重要文件',
                    ]}
                    className="bg-white"
                  />
                  <div>
                    <label className="text-xs sm:text-[13px] font-semibold text-slate-700 block mb-1.5">
                      選擇檔案 (.pdf, .jpg, .png)
                    </label>
                    <input
                      id="companyFileInput"
                      type="file"
                      accept=".pdf,image/*"
                      onChange={handleFileUpload}
                      className="block w-full text-xs sm:text-sm text-slate-500 file:mr-2 sm:file:mr-4 file:py-2 file:sm:py-2.5 file:px-3 sm:file:px-4 file:rounded-xl file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all cursor-pointer bg-white border border-slate-200 rounded-xl p-1"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl hover:bg-indigo-700 text-sm font-bold shadow-md hover:shadow-lg active:scale-95 transition-all w-full md:w-auto whitespace-nowrap h-[42px] sm:h-[46px]"
                >
                  <FileUp size={16} className="inline mr-1 sm:mr-2 mb-0.5" />{' '}
                  上傳至文件庫
                </button>
              </form>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left whitespace-nowrap min-w-[500px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 sm:py-4">文件名稱</th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4">分類</th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4">上傳日期</th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                      {(formData.documents || []).map((doc) => (
                        <tr
                          key={doc.id}
                          className="hover:bg-slate-50/50 transition-colors bg-white group"
                        >
                          <td className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-indigo-600 flex items-center gap-2 max-w-[150px] sm:max-w-[300px] truncate">
                            <Paperclip
                              size={14}
                              className="text-slate-400 shrink-0"
                            />{' '}
                            <span className="truncate">{doc.name}</span>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4">
                            <span className="bg-slate-100 text-slate-600 px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-bold">
                              {doc.category}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-500 font-medium">
                            {doc.date}
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                            <div className="flex justify-end gap-1 sm:gap-2">
                              <a
                                href={doc.data}
                                download={doc.name}
                                className="flex items-center gap-1 p-1.5 sm:p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors text-[10px] sm:text-xs font-bold"
                                title="下載檔案"
                              >
                                <Download size={14} />{' '}
                                <span className="hidden sm:inline">下載</span>
                              </a>
                              <button
                                onClick={() => handleDeleteDoc(doc.id)}
                                className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors sm:opacity-0 group-hover:opacity-100"
                                title="刪除"
                              >
                                <Trash2 size={14} className="sm:w-4 sm:h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!(
                        formData.documents && formData.documents.length > 0
                      ) && (
                        <tr>
                          <td
                            colSpan="4"
                            className="px-4 sm:px-6 py-12 sm:py-16 text-center text-slate-400"
                          >
                            <FolderOpen
                              size={24}
                              className="mx-auto mb-2 opacity-20 sm:w-8 sm:h-8 sm:mb-3"
                            />
                            文件庫目前是空的
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GenericListView({
  items,
  searchQuery,
  setSearchQuery,
  onAdd,
  columns,
  onView,
  onEdit,
  onDelete,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/50 border border-slate-200 flex flex-col h-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 bg-slate-50/50">
        <div className="relative w-full sm:w-[400px] group">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
            size={16}
          />
          <input
            type="text"
            placeholder="輸入關鍵字搜尋..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-xs sm:text-sm transition-all shadow-sm"
          />
        </div>
        <button
          onClick={onAdd}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          <Plus size={16} /> 新增資料
        </button>
      </div>

      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-white border-b border-slate-100 text-[11px] sm:text-[13px] font-semibold text-slate-400 uppercase tracking-wider">
              {columns.map((col) => (
                <th key={col.key} className="px-4 sm:px-6 py-3 sm:py-4">
                  {col.label}
                </th>
              ))}
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-xs sm:text-[14px]">
            {items.map((item) => (
              <tr
                key={item.id}
                onClick={() => onView(item)}
                className="bg-white hover:bg-slate-50/80 transition-colors group cursor-pointer"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 sm:px-6 py-3 sm:py-4 max-w-[150px] sm:max-w-[200px] truncate ${
                      col.key === columns[0].key
                        ? 'font-semibold text-slate-800'
                        : 'text-slate-600'
                    }`}
                  >
                    {col.isBadge ? (
                      <StatusBadge status={item[col.key]} />
                    ) : (
                      item[col.key]
                    )}
                  </td>
                ))}
                <td
                  className="px-4 sm:px-6 py-3 sm:py-4 text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-end gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(item)}
                      className="p-1.5 sm:p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="編輯"
                    >
                      <Edit size={14} className="sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="刪除"
                    >
                      <Trash2 size={14} className="sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-4 sm:px-6 py-12 sm:py-16 text-center"
                >
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Search
                      size={24}
                      className="mb-2 sm:mb-3 opacity-20 sm:w-8 sm:h-8"
                    />
                    <p className="text-xs sm:text-sm">沒有找到符合條件的資料</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CustomerFormView({ item, onSave, onCancel }) {
  const [formData, setFormData] = useState(
    item || {
      companyName: '',
      taxId: '',
      logo: '',
      contactPerson: '',
      phone: '',
      fax: '',
      email: '',
      website: '',
      address: '',
      status: '活躍',
      orders: [],
      communications: [],
    }
  );

  useEffect(() => {
    if (formData.website && !formData.logo) {
      const domain = formData.website
        .replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')
        .split('/')[0];
      if (domain)
        setFormData((prev) => ({
          ...prev,
          logo: `https://logo.clearbit.com/${domain}`,
        }));
    }
  }, [formData.website]);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-base sm:text-lg font-bold text-slate-800">
          {item ? '編輯客戶資料' : '新增客戶資料'}
        </h3>
      </div>
      <form
        onSubmit={handleSubmit}
        className="p-4 sm:p-8 space-y-6 sm:space-y-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 sm:gap-y-6">
          <FormInput
            label="公司名稱"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            required
            className="md:col-span-2"
          />
          <FormInput
            label="統一編號"
            name="taxId"
            value={formData.taxId}
            onChange={handleChange}
          />
          <FormInput
            label="公司網站"
            name="website"
            value={formData.website}
            onChange={handleChange}
            placeholder="輸入網址自動抓取 LOGO"
          />
          <FormInput
            label="聯絡窗口"
            name="contactPerson"
            value={formData.contactPerson}
            onChange={handleChange}
          />
          <FormSelect
            label="客戶狀態"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={['活躍', '潛在', '非活躍']}
          />
          <FormInput
            label="電話"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
          <FormInput
            label="傳真"
            name="fax"
            value={formData.fax}
            onChange={handleChange}
          />
          <FormInput
            label="電子信箱"
            name="email"
            value={formData.email}
            onChange={handleChange}
            type="email"
          />
          <FormInput
            label="LOGO 網址"
            name="logo"
            value={formData.logo}
            onChange={handleChange}
            placeholder="手動輸入圖片 URL"
          />
          <FormInput
            label="公司地址"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="md:col-span-2"
          />
        </div>
        <FormActions
          onCancel={onCancel}
          submitText={item ? '儲存變更' : '建立檔案'}
        />
      </form>
    </div>
  );
}

function CustomerDetailView({ item, onBack, onEdit, onDelete, onUpdate }) {
  const [activeTab, setActiveTab] = useState('info');
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [showAddComm, setShowAddComm] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);

  const initOrder = {
    orderNumber: '',
    quotationNumber: '',
    piNumber: '',
    poNumber: '',
    date: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    status: '處理中',
    paymentType: '月結',
    paymentDays: '30',
    paymentStatus: '未收款',
    productSpecs: '',
    quantity: '',
    unit: 'M',
    totalAmount: '',
    purchaseQuantity: '',
    purchaseAmount: '',
    quoteFile: null,
    piFile: null,
  };
  const [newOrder, setNewOrder] = useState(initOrder);
  const [newComm, setNewComm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: '電話',
    notes: '',
  });

  const handleFileUpload = (field) => (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 800 * 1024) {
      alert(
        '為了系統流暢，單一附件請小於 800KB。建議將圖片壓縮或另存較小的 PDF。'
      );
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setNewOrder((prev) => ({
        ...prev,
        [field]: { name: file.name, data: ev.target.result, type: file.type },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveOrder = (e) => {
    e.preventDefault();
    let updatedOrders;
    if (editingOrderId) {
      updatedOrders = (item.orders || []).map((o) =>
        o.id === editingOrderId ? { ...newOrder, id: editingOrderId } : o
      );
    } else {
      updatedOrders = [{ ...newOrder, id: Date.now() }, ...(item.orders || [])];
    }
    onUpdate({ ...item, orders: updatedOrders });
    setShowAddOrder(false);
    setEditingOrderId(null);
    setNewOrder(initOrder);
  };

  const handleEditOrder = (order) => {
    setNewOrder(order);
    setEditingOrderId(order.id);
    setShowAddOrder(true);
  };

  const handleCancelOrderEdit = () => {
    setShowAddOrder(false);
    setEditingOrderId(null);
    setNewOrder(initOrder);
  };

  const handleDeleteOrder = (orderId) => {
    if (!window.confirm('確定要刪除這筆訂單嗎？')) return;
    onUpdate({
      ...item,
      orders: (item.orders || []).filter((o) => o.id !== orderId),
    });
  };

  const handleAddComm = (e) => {
    e.preventDefault();
    onUpdate({
      ...item,
      lastContact: newComm.date,
      communications: [
        { ...newComm, id: Date.now() },
        ...(item.communications || []),
      ],
    });
    setShowAddComm(false);
    setNewComm({
      date: new Date().toISOString().split('T')[0],
      type: '電話',
      notes: '',
    });
  };

  const totalAmt = Number(newOrder.totalAmount) || 0;
  const purAmt = Number(newOrder.purchaseAmount) || 0;
  const netProfit = totalAmt - purAmt;
  const netProfitMargin =
    totalAmt > 0 ? ((netProfit / totalAmt) * 100).toFixed(1) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <DetailHeader onBack={onBack} onEdit={onEdit} onDelete={onDelete} />
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-4 sm:px-8 py-6 sm:py-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 relative overflow-hidden bg-slate-50/50 border-b border-slate-100">
          <div className="flex items-center gap-4 sm:gap-5 relative z-10 w-full sm:w-auto">
            <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-md">
              {item.companyName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold text-slate-800 tracking-tight mb-1 truncate">
                {item.companyName}
              </h1>
              <div className="flex flex-wrap gap-2 sm:gap-3 text-[11px] sm:text-sm font-medium text-slate-500">
                <span className="flex items-center gap-1">
                  <Hash size={12} className="sm:w-3.5 sm:h-3.5" />{' '}
                  {item.taxId || '無統編'}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={12} className="sm:w-3.5 sm:h-3.5" />{' '}
                  {item.contactPerson || '無聯絡人'}
                </span>
              </div>
            </div>
          </div>
          <div className="relative z-10 self-end sm:self-auto -mt-10 sm:mt-0">
            <StatusBadge status={item.status} size="lg" />
          </div>
        </div>

        <div className="flex border-b border-slate-200 px-2 sm:px-6 gap-1 sm:gap-2 bg-slate-50/30 overflow-x-auto custom-scrollbar">
          <TabButton
            active={activeTab === 'info'}
            onClick={() => setActiveTab('info')}
            icon={FileText}
            label="基本資訊"
          />
          <TabButton
            active={activeTab === 'orders'}
            onClick={() => setActiveTab('orders')}
            icon={ShoppingCart}
            label={`交易紀錄 (${(item.orders || []).length})`}
          />
          <TabButton
            active={activeTab === 'communications'}
            onClick={() => setActiveTab('communications')}
            icon={MessageSquare}
            label={`溝通進度 (${(item.communications || []).length})`}
          />
        </div>

        <div className="p-4 sm:p-6 md:p-8 min-h-[400px]">
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 animate-in fade-in">
              <div className="bg-white p-5 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4 sm:space-y-6">
                <h3 className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2 sm:pb-3">
                  <Building2 size={14} /> 公司詳情
                </h3>
                <div className="space-y-4 sm:space-y-6">
                  <InfoRow
                    icon={Building2}
                    label="公司名稱"
                    value={item.companyName}
                  />
                  <InfoRow icon={Hash} label="統一編號" value={item.taxId} />
                  <InfoRow
                    icon={Users}
                    label="聯絡窗口"
                    value={item.contactPerson}
                  />
                  <InfoRow
                    icon={Globe}
                    label="公司網站"
                    value={item.website}
                    isLink
                  />
                  <InfoRow
                    icon={MapPin}
                    label="公司地址"
                    value={item.address}
                  />
                </div>
              </div>
              <div className="bg-slate-50/80 p-5 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4 sm:space-y-6">
                <h3 className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-200/60 pb-2 sm:pb-3">
                  <Phone size={14} /> 聯絡方式
                </h3>
                <div className="space-y-4 sm:space-y-6">
                  <InfoRow icon={Phone} label="聯絡電話" value={item.phone} />
                  <InfoRow icon={Printer} label="傳真號碼" value={item.fax} />
                  <InfoRow icon={Mail} label="電子信箱" value={item.email} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4 sm:space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center">
                <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                  歷史交易清單
                </h3>
                <button
                  onClick={() => {
                    if (showAddOrder) handleCancelOrderEdit();
                    else setShowAddOrder(true);
                  }}
                  className={`flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-colors shadow-sm active:scale-95 ${
                    showAddOrder && !editingOrderId
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  <PlusCircle
                    size={14}
                    className={`sm:w-4 sm:h-4 ${
                      showAddOrder && !editingOrderId
                        ? 'rotate-45 transition-transform'
                        : 'transition-transform'
                    }`}
                  />
                  {showAddOrder && !editingOrderId ? '取消新增' : '新增紀錄'}
                </button>
              </div>

              {showAddOrder && (
                <form
                  onSubmit={handleSaveOrder}
                  className="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200 flex flex-col gap-5 sm:gap-6 animate-in fade-in slide-in-from-top-4 shadow-inner"
                >
                  <div>
                    <h4 className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 sm:mb-4 flex items-center gap-2">
                      <FileText size={14} />{' '}
                      {editingOrderId ? '編輯單據與狀態' : '單據與狀態'}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
                      <FormInput
                        label="訂單日期"
                        name="date"
                        type="date"
                        value={newOrder.date}
                        onChange={(e) =>
                          setNewOrder({ ...newOrder, date: e.target.value })
                        }
                        required
                        className="bg-white"
                      />
                      <FormInput
                        label="預計交期"
                        name="deliveryDate"
                        type="date"
                        value={newOrder.deliveryDate}
                        onChange={(e) =>
                          setNewOrder({
                            ...newOrder,
                            deliveryDate: e.target.value,
                          })
                        }
                        className="bg-white"
                      />
                      <FormInput
                        label="報價單號"
                        name="quotationNumber"
                        value={newOrder.quotationNumber}
                        onChange={(e) =>
                          setNewOrder({
                            ...newOrder,
                            quotationNumber: e.target.value,
                          })
                        }
                        className="bg-white"
                      />
                      <FormInput
                        label="PI 號碼"
                        name="piNumber"
                        value={newOrder.piNumber}
                        onChange={(e) =>
                          setNewOrder({ ...newOrder, piNumber: e.target.value })
                        }
                        className="bg-white"
                      />
                      <FormInput
                        label="PO 號碼"
                        name="poNumber"
                        value={newOrder.poNumber}
                        onChange={(e) =>
                          setNewOrder({ ...newOrder, poNumber: e.target.value })
                        }
                        className="bg-white"
                      />

                      <FormSelect
                        label="訂單狀況"
                        name="status"
                        value={newOrder.status}
                        onChange={(e) =>
                          setNewOrder({ ...newOrder, status: e.target.value })
                        }
                        options={[
                          '處理中',
                          '生產中',
                          '已出貨',
                          '已入庫',
                          '已結案',
                          '已取消',
                        ]}
                        className="bg-white md:col-span-1"
                      />
                      <div className="grid grid-cols-2 gap-2 col-span-1 sm:col-span-2 md:col-span-3">
                        <FormSelect
                          label="付款方式"
                          name="paymentType"
                          value={newOrder.paymentType}
                          onChange={(e) =>
                            setNewOrder({
                              ...newOrder,
                              paymentType: e.target.value,
                            })
                          }
                          options={['現金', '月結', '匯款', '預先付款']}
                          className="bg-white"
                        />
                        {newOrder.paymentType === '月結' ? (
                          <FormInput
                            label="月結天數"
                            name="paymentDays"
                            type="number"
                            placeholder="例如 30"
                            value={newOrder.paymentDays}
                            onChange={(e) =>
                              setNewOrder({
                                ...newOrder,
                                paymentDays: e.target.value,
                              })
                            }
                            className="bg-white"
                          />
                        ) : (
                          <div />
                        )}
                      </div>
                      <FormSelect
                        label="收款狀態"
                        name="paymentStatus"
                        value={newOrder.paymentStatus}
                        onChange={(e) =>
                          setNewOrder({
                            ...newOrder,
                            paymentStatus: e.target.value,
                          })
                        }
                        options={['未收款', '已收款', '部分收款']}
                        className="bg-white md:col-span-1"
                      />
                    </div>
                  </div>

                  <hr className="border-slate-200" />

                  <div>
                    <h4 className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 sm:mb-4 flex items-center gap-2">
                      <Package size={14} /> 產品進銷存
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4 items-end">
                      <FormInput
                        label="產品規格/描述"
                        name="productSpecs"
                        value={newOrder.productSpecs}
                        onChange={(e) =>
                          setNewOrder({
                            ...newOrder,
                            productSpecs: e.target.value,
                          })
                        }
                        required
                        className="bg-white md:col-span-2"
                      />

                      <div className="space-y-1 sm:space-y-1.5 md:col-span-2">
                        <label className="text-xs sm:text-[13px] font-semibold text-slate-700">
                          銷售數量與單位{' '}
                          <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex shadow-sm rounded-xl">
                          <input
                            type="number"
                            value={newOrder.quantity}
                            onChange={(e) =>
                              setNewOrder({
                                ...newOrder,
                                quantity: e.target.value,
                              })
                            }
                            required
                            className="w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-white border border-r-0 border-slate-200 rounded-l-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm"
                          />
                          <select
                            value={newOrder.unit}
                            onChange={(e) =>
                              setNewOrder({ ...newOrder, unit: e.target.value })
                            }
                            className="px-2 py-2 sm:px-4 sm:py-2.5 bg-slate-100 border border-slate-200 rounded-r-xl font-medium text-slate-600 outline-none text-xs sm:text-sm appearance-none border-l-0"
                          >
                            <option value="M">M</option>
                            <option value="KG">KG</option>
                            <option value="M2">M2</option>
                            <option value="ROLL">ROLL</option>
                            <option value="PCS">PCS</option>
                          </select>
                        </div>
                      </div>

                      <FormInput
                        label="銷售總金額 (NT$)"
                        name="totalAmount"
                        type="number"
                        value={newOrder.totalAmount}
                        onChange={(e) =>
                          setNewOrder({
                            ...newOrder,
                            totalAmount: e.target.value,
                          })
                        }
                        required
                        className="bg-white"
                      />
                      <FormInput
                        label="採購成本總額 (NT$)"
                        name="purchaseAmount"
                        type="number"
                        value={newOrder.purchaseAmount}
                        onChange={(e) =>
                          setNewOrder({
                            ...newOrder,
                            purchaseAmount: e.target.value,
                          })
                        }
                        className="bg-white"
                      />

                      <div className="md:col-span-2 bg-indigo-50/50 border border-indigo-100 p-2 sm:p-3 rounded-xl flex justify-between items-center h-[42px]">
                        <span className="text-[10px] sm:text-xs font-bold text-indigo-800 flex items-center gap-1 sm:gap-1.5">
                          <MoreVertical
                            size={12}
                            className="sm:w-3.5 sm:h-3.5"
                          />{' '}
                          利潤試算
                        </span>
                        <div className="flex gap-2 sm:gap-4">
                          <div className="text-[10px] sm:text-xs text-slate-500 font-medium">
                            淨利{' '}
                            <span
                              className={`text-xs sm:text-sm font-bold ml-1 ${
                                netProfit > 0
                                  ? 'text-emerald-600'
                                  : 'text-slate-800'
                              }`}
                            >
                              NT$ {netProfit.toLocaleString()}
                            </span>
                          </div>
                          <div className="text-[10px] sm:text-xs text-slate-500 font-medium">
                            淨利率{' '}
                            <span
                              className={`text-xs sm:text-sm font-bold ml-1 ${
                                netProfitMargin > 0
                                  ? 'text-emerald-600'
                                  : 'text-slate-800'
                              }`}
                            >
                              {netProfitMargin}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-200" />

                  <div className="flex flex-col md:flex-row gap-4 sm:gap-6 justify-between items-end">
                    <div className="flex-1 w-full space-y-3 sm:space-y-4">
                      <h4 className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Paperclip size={14} /> 附件上傳 (選填)
                      </h4>
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <div className="flex-1 min-w-[150px] sm:min-w-[200px]">
                          <label className="text-[11px] sm:text-[12px] font-semibold text-slate-600 mb-1 sm:mb-1.5 block">
                            報價單檔案
                          </label>
                          <input
                            type="file"
                            accept=".pdf,image/*"
                            onChange={handleFileUpload('quoteFile')}
                            className="block w-full text-[10px] sm:text-xs text-slate-500 file:mr-2 sm:file:mr-3 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-lg file:border-0 file:text-[10px] sm:file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all cursor-pointer bg-white border border-slate-200 rounded-xl p-1"
                          />
                        </div>
                        <div className="flex-1 min-w-[150px] sm:min-w-[200px]">
                          <label className="text-[11px] sm:text-[12px] font-semibold text-slate-600 mb-1 sm:mb-1.5 block">
                            PI 檔案
                          </label>
                          <input
                            type="file"
                            accept=".pdf,image/*"
                            onChange={handleFileUpload('piFile')}
                            className="block w-full text-[10px] sm:text-xs text-slate-500 file:mr-2 sm:file:mr-3 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-lg file:border-0 file:text-[10px] sm:file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all cursor-pointer bg-white border border-slate-200 rounded-xl p-1"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 sm:gap-3 w-full md:w-auto shrink-0 mt-2 md:mt-0">
                      {editingOrderId && (
                        <button
                          type="button"
                          onClick={handleCancelOrderEdit}
                          className="flex-1 bg-white border border-slate-300 text-slate-700 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl hover:bg-slate-50 text-xs sm:text-sm font-bold shadow-sm active:scale-95 transition-all whitespace-nowrap"
                        >
                          取消
                        </button>
                      )}
                      <button
                        type="submit"
                        className="flex-1 bg-indigo-600 text-white px-4 sm:px-8 py-2 sm:py-2.5 rounded-xl hover:bg-indigo-700 text-xs sm:text-sm font-bold shadow-md hover:shadow-lg active:scale-95 transition-all whitespace-nowrap"
                      >
                        💾 {editingOrderId ? '儲存變更' : '儲存紀錄'}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left whitespace-nowrap min-w-[800px] sm:min-w-[1000px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 sm:px-5 py-3 sm:py-4">單據號碼</th>
                        <th className="px-4 sm:px-5 py-3 sm:py-4">
                          日期 / 交期
                        </th>
                        <th className="px-4 sm:px-5 py-3 sm:py-4">
                          產品規格 / 數量
                        </th>
                        <th className="px-4 sm:px-5 py-3 sm:py-4 text-right">
                          銷售與利潤
                        </th>
                        <th className="px-4 sm:px-5 py-3 sm:py-4">狀態追蹤</th>
                        <th className="px-4 sm:px-5 py-3 sm:py-4 text-center">
                          附件
                        </th>
                        <th className="px-4 sm:px-5 py-3 sm:py-4 text-right">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs sm:text-[13px]">
                      {(item.orders || []).map((order) => {
                        const oProfit =
                          (Number(order.totalAmount) || 0) -
                          (Number(order.purchaseAmount) || 0);
                        const oMargin = Number(order.totalAmount)
                          ? (
                              (oProfit / Number(order.totalAmount)) *
                              100
                            ).toFixed(1)
                          : 0;
                        return (
                          <tr
                            key={order.id}
                            className="hover:bg-slate-50/50 transition-colors bg-white group"
                          >
                            <td className="px-4 sm:px-5 py-2 sm:py-3">
                              <div className="font-bold text-slate-800">
                                {order.quotationNumber ||
                                  order.piNumber ||
                                  '未登錄單號'}
                              </div>
                            </td>
                            <td className="px-4 sm:px-5 py-2 sm:py-3">
                              <div className="flex flex-col gap-0.5 sm:gap-1">
                                <span
                                  className="text-slate-500 font-medium"
                                  title="下單日"
                                >
                                  <Calendar
                                    size={10}
                                    className="inline mr-1 sm:mr-1.5 sm:w-3 sm:h-3"
                                  />
                                  {order.date}
                                </span>
                                <span
                                  className={`font-medium ${
                                    order.deliveryDate
                                      ? 'text-indigo-600'
                                      : 'text-slate-400'
                                  }`}
                                  title="交期"
                                >
                                  <Clock
                                    size={10}
                                    className="inline mr-1 sm:mr-1.5 sm:w-3 sm:h-3"
                                  />
                                  {order.deliveryDate || '未定'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 sm:px-5 py-2 sm:py-3">
                              <div
                                className="font-medium text-slate-700 max-w-[150px] sm:max-w-[200px] truncate"
                                title={order.productSpecs}
                              >
                                {order.productSpecs || '-'}
                              </div>
                              <div className="text-slate-500 text-[10px] sm:text-xs mt-0.5 font-mono">
                                {order.quantity} {order.unit}
                              </div>
                            </td>
                            <td className="px-4 sm:px-5 py-2 sm:py-3 text-right">
                              <div className="font-bold text-slate-800">
                                NT$ {Number(order.totalAmount).toLocaleString()}
                              </div>
                              <div
                                className={`text-[10px] sm:text-xs mt-0.5 font-medium ${
                                  oProfit > 0
                                    ? 'text-emerald-600'
                                    : 'text-slate-400'
                                }`}
                              >
                                淨利 ${oProfit.toLocaleString()} ({oMargin}%)
                              </div>
                            </td>
                            <td className="px-4 sm:px-5 py-2 sm:py-3">
                              <div className="flex flex-col gap-1 sm:gap-1.5 items-start">
                                <StatusBadge status={order.status} />
                                <span
                                  className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold border ${
                                    order.paymentStatus === '已收款'
                                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                      : 'bg-amber-50 text-amber-600 border-amber-200'
                                  }`}
                                >
                                  {order.paymentType}
                                  {order.paymentType === '月結'
                                    ? ` ${order.paymentDays}天`
                                    : ''}{' '}
                                  • {order.paymentStatus}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 sm:px-5 py-2 sm:py-3 text-center">
                              <div className="flex justify-center gap-1.5 sm:gap-2">
                                {order.quoteFile && (
                                  <a
                                    href={order.quoteFile.data}
                                    download={order.quoteFile.name}
                                    className="p-1 sm:p-1.5 text-indigo-500 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                                    title={`下載報價單: ${order.quoteFile.name}`}
                                  >
                                    <FileUp
                                      size={12}
                                      className="sm:w-3.5 sm:h-3.5"
                                    />
                                  </a>
                                )}
                                {order.piFile && (
                                  <a
                                    href={order.piFile.data}
                                    download={order.piFile.name}
                                    className="p-1 sm:p-1.5 text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                                    title={`下載 PI: ${order.piFile.name}`}
                                  >
                                    <Download
                                      size={12}
                                      className="sm:w-3.5 sm:h-3.5"
                                    />
                                  </a>
                                )}
                                {!order.quoteFile && !order.piFile && (
                                  <span className="text-slate-300 text-[10px] sm:text-xs">
                                    -
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 sm:px-5 py-2 sm:py-3 text-right">
                              <div className="flex justify-end gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleEditOrder(order)}
                                  className="p-1 sm:p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  title="編輯紀錄"
                                >
                                  <Edit
                                    size={12}
                                    className="sm:w-3.5 sm:h-3.5"
                                  />
                                </button>
                                <button
                                  onClick={() => handleDeleteOrder(order.id)}
                                  className="p-1 sm:p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="刪除紀錄"
                                >
                                  <Trash2
                                    size={12}
                                    className="sm:w-3.5 sm:h-3.5"
                                  />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {!(item.orders && item.orders.length > 0) && (
                        <tr>
                          <td
                            colSpan="7"
                            className="px-4 sm:px-6 py-12 sm:py-16 text-center text-slate-400"
                          >
                            尚無交易紀錄，點擊上方按鈕新增。
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'communications' && (
            <div className="space-y-4 sm:space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center">
                <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                  歷次溝通日誌
                </h3>
                <button
                  onClick={() => setShowAddComm(!showAddComm)}
                  className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-colors"
                >
                  <PlusCircle size={14} className="sm:w-4 sm:h-4" /> 新增紀錄
                </button>
              </div>
              {showAddComm && (
                <form
                  onSubmit={handleAddComm}
                  className="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200 space-y-4 sm:space-y-5 animate-in fade-in slide-in-from-top-4"
                >
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <FormInput
                      label="日期"
                      name="date"
                      type="date"
                      value={newComm.date}
                      onChange={(e) =>
                        setNewComm({ ...newComm, date: e.target.value })
                      }
                      required
                      className="w-full sm:w-48 bg-white"
                    />
                    <FormSelect
                      label="溝通方式"
                      name="type"
                      value={newComm.type}
                      onChange={(e) =>
                        setNewComm({ ...newComm, type: e.target.value })
                      }
                      options={['電話', 'Email', '拜訪', '線上會議', 'Line']}
                      className="w-full sm:w-48 bg-white"
                    />
                  </div>
                  <FormTextarea
                    label="溝通內容 / 備註"
                    name="notes"
                    value={newComm.notes}
                    onChange={(e) =>
                      setNewComm({ ...newComm, notes: e.target.value })
                    }
                    required
                    className="bg-white"
                  />
                  <div className="flex justify-end pt-1 sm:pt-2">
                    <button
                      type="submit"
                      className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 text-xs sm:text-sm font-semibold shadow-sm hover:shadow active:scale-95 transition-all"
                    >
                      儲存紀錄
                    </button>
                  </div>
                </form>
              )}
              <div className="relative pl-4 space-y-6 sm:space-y-8 mt-6 sm:mt-8 before:absolute before:inset-0 before:ml-[33px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:to-transparent">
                {(item.communications || []).map((comm) => (
                  <div
                    key={comm.id}
                    className="relative flex items-start gap-4 sm:gap-6"
                  >
                    <div className="absolute left-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white border-2 sm:border-[3px] border-indigo-100 flex items-center justify-center text-indigo-500 shadow-sm z-10 -ml-3 sm:-ml-4 mt-1 ring-2 sm:ring-4 ring-white">
                      {comm.type === '電話' ? (
                        <Phone size={12} className="sm:w-3.5 sm:h-3.5" />
                      ) : comm.type === 'Email' ? (
                        <Mail size={12} className="sm:w-3.5 sm:h-3.5" />
                      ) : comm.type === '拜訪' ? (
                        <Briefcase size={12} className="sm:w-3.5 sm:h-3.5" />
                      ) : (
                        <MessageSquare
                          size={12}
                          className="sm:w-3.5 sm:h-3.5"
                        />
                      )}
                    </div>
                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex-1 ml-4 sm:ml-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                        <span className="text-[11px] sm:text-sm font-bold text-slate-800 bg-slate-100 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg">
                          {comm.type}
                        </span>
                        <span className="text-[10px] sm:text-xs font-semibold text-slate-400 flex items-center gap-1">
                          <Calendar size={10} className="sm:w-3 sm:h-3" />{' '}
                          {comm.date}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-wrap leading-relaxed mt-2 sm:mt-3">
                        {comm.notes}
                      </p>
                    </div>
                  </div>
                ))}
                {!(item.communications && item.communications.length > 0) && (
                  <div className="py-8 sm:py-12 text-center text-xs sm:text-sm text-slate-400">
                    尚未有任何溝通紀錄
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 供應商表單
// ==========================================
function SupplierFormView({ item, onSave, onCancel }) {
  const [formData, setFormData] = useState(
    item || {
      name: '',
      taxId: '',
      category: '',
      contactPerson: '',
      status: '合作中',
      phone: '',
      fax: '',
      email: '',
      website: '',
      address: '',
      notes: '',
      orders: [],
    }
  );
  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-base sm:text-lg font-bold text-slate-800">
          {item ? '編輯供應商資料' : '新增供應商資料'}
        </h3>
      </div>
      <form
        onSubmit={handleSubmit}
        className="p-4 sm:p-8 space-y-6 sm:space-y-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 sm:gap-y-6">
          <FormInput
            label="供應商名稱"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="md:col-span-2"
          />
          <FormInput
            label="統一編號"
            name="taxId"
            value={formData.taxId}
            onChange={handleChange}
          />
          <FormInput
            label="供應物料類別"
            name="category"
            value={formData.category}
            onChange={handleChange}
            placeholder="例如：五金、包材"
          />
          <FormInput
            label="聯絡窗口"
            name="contactPerson"
            value={formData.contactPerson}
            onChange={handleChange}
          />
          <FormSelect
            label="狀態"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={['合作中', '暫停合作', '已停用']}
          />
          <FormInput
            label="聯絡電話"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
          <FormInput
            label="傳真號碼"
            name="fax"
            value={formData.fax}
            onChange={handleChange}
          />
          <FormInput
            label="電子信箱"
            name="email"
            value={formData.email}
            onChange={handleChange}
            type="email"
          />
          <FormInput
            label="公司網站"
            name="website"
            value={formData.website}
            onChange={handleChange}
          />
          <FormInput
            label="公司地址"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="md:col-span-2"
          />
          <FormTextarea
            label="備註"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="md:col-span-2"
          />
        </div>
        <FormActions
          onCancel={onCancel}
          submitText={item ? '儲存變更' : '建立供應商'}
        />
      </form>
    </div>
  );
}

// ==========================================
// 供應商詳細資料與交易紀錄
// ==========================================
function SupplierDetailView({
  item,
  customers,
  onBack,
  onEdit,
  onDelete,
  onUpdate,
}) {
  const [activeTab, setActiveTab] = useState('info');
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);

  const initOrder = {
    date: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    poNumber: '',
    itemSpecs: '',
    quantity: '',
    unit: 'M',
    purchaseAmount: '',
    piNumber: '',
    piAmount: '',
    status: '處理中',
    paymentType: '月結',
    paymentDays: '30',
    paymentStatus: '未付款',
  };
  const [newOrder, setNewOrder] = useState(initOrder);

  useEffect(() => {
    if (newOrder.piNumber) {
      let foundAmount = '';
      for (const customer of customers) {
        if (customer.orders) {
          const matchedOrder = customer.orders.find(
            (o) => o.piNumber === newOrder.piNumber
          );
          if (matchedOrder) {
            foundAmount = matchedOrder.totalAmount;
            break;
          }
        }
      }
      if (foundAmount && newOrder.piAmount !== foundAmount) {
        setNewOrder((prev) => ({ ...prev, piAmount: foundAmount }));
      }
    }
  }, [newOrder.piNumber, customers]);

  const handleSaveOrder = (e) => {
    e.preventDefault();
    let updatedOrders;
    if (editingOrderId) {
      updatedOrders = (item.orders || []).map((o) =>
        o.id === editingOrderId ? { ...newOrder, id: editingOrderId } : o
      );
    } else {
      updatedOrders = [{ ...newOrder, id: Date.now() }, ...(item.orders || [])];
    }
    onUpdate({ ...item, orders: updatedOrders });
    setShowAddOrder(false);
    setEditingOrderId(null);
    setNewOrder(initOrder);
  };

  const handleEditOrder = (order) => {
    setNewOrder({
      ...initOrder,
      ...order,
    });
    setEditingOrderId(order.id);
    setShowAddOrder(true);
  };

  const handleCancelOrderEdit = () => {
    setShowAddOrder(false);
    setEditingOrderId(null);
    setNewOrder(initOrder);
  };

  const handleDeleteOrder = (orderId) => {
    if (!window.confirm('確定要刪除這筆交易紀錄嗎？')) return;
    onUpdate({
      ...item,
      orders: (item.orders || []).filter((o) => o.id !== orderId),
    });
  };

  const pAmt = Number(newOrder.purchaseAmount) || 0;
  const piAmt = Number(newOrder.piAmount) || 0;
  const priceDiff = piAmt - pAmt;

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <DetailHeader onBack={onBack} onEdit={onEdit} onDelete={onDelete} />
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-4 sm:px-8 py-6 sm:py-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 relative overflow-hidden bg-slate-50/50 border-b border-slate-100">
          <div className="flex items-center gap-4 sm:gap-5 relative z-10 w-full sm:w-auto">
            <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <Truck size={24} className="sm:w-8 sm:h-8" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold text-slate-800 tracking-tight mb-1 truncate">
                {item.name}
              </h1>
              <div className="flex flex-wrap gap-2 sm:gap-3 text-[11px] sm:text-sm font-medium text-slate-500">
                <span className="flex items-center gap-1">
                  <Tag size={12} className="sm:w-3.5 sm:h-3.5" />{' '}
                  {item.category || '未設定分類'}
                </span>
                <span className="flex items-center gap-1">
                  <Hash size={12} className="sm:w-3.5 sm:h-3.5" />{' '}
                  {item.taxId || '無統編'}
                </span>
              </div>
            </div>
          </div>
          <div className="relative z-10 self-end sm:self-auto -mt-10 sm:mt-0">
            <StatusBadge status={item.status} size="lg" />
          </div>
        </div>

        <div className="flex border-b border-slate-200 px-2 sm:px-6 gap-1 sm:gap-2 bg-slate-50/30 overflow-x-auto custom-scrollbar">
          <TabButton
            active={activeTab === 'info'}
            onClick={() => setActiveTab('info')}
            icon={FileText}
            label="基本資訊"
          />
          <TabButton
            active={activeTab === 'orders'}
            onClick={() => setActiveTab('orders')}
            icon={ShoppingCart}
            label={`交易紀錄 (${(item.orders || []).length})`}
          />
        </div>

        <div className="p-4 sm:p-6 md:p-8 min-h-[400px]">
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 animate-in fade-in">
              <div className="bg-white p-5 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4 sm:space-y-6">
                <h3 className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2 sm:pb-3">
                  <Building2 size={14} /> 供應商詳情
                </h3>
                <div className="space-y-4 sm:space-y-6">
                  <InfoRow icon={Truck} label="供應商名稱" value={item.name} />
                  <InfoRow icon={Hash} label="統一編號" value={item.taxId} />
                  <InfoRow icon={Tag} label="供應物料" value={item.category} />
                  <InfoRow
                    icon={Globe}
                    label="公司網站"
                    value={item.website}
                    isLink
                  />
                  <InfoRow
                    icon={MapPin}
                    label="公司地址"
                    value={item.address}
                  />
                </div>
              </div>
              <div className="bg-slate-50/80 p-5 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4 sm:space-y-6">
                <h3 className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-200/60 pb-2 sm:pb-3">
                  <Phone size={14} /> 聯絡方式
                </h3>
                <div className="space-y-4 sm:space-y-6">
                  <InfoRow
                    icon={Users}
                    label="聯絡窗口"
                    value={item.contactPerson}
                  />
                  <InfoRow icon={Phone} label="聯絡電話" value={item.phone} />
                  <InfoRow icon={Printer} label="傳真號碼" value={item.fax} />
                  <InfoRow icon={Mail} label="電子信箱" value={item.email} />
                </div>
              </div>
              {item.notes && (
                <div className="md:col-span-2 bg-slate-50/80 p-5 sm:p-8 rounded-2xl border border-slate-100 shadow-sm">
                  <h3 className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 sm:mb-4 flex items-center gap-2 border-b border-slate-200/60 pb-2 sm:pb-3">
                    <FileText size={14} /> 備註
                  </h3>
                  <div className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {item.notes}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4 sm:space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center">
                <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                  歷史採購交易
                </h3>
                <button
                  onClick={() => {
                    if (showAddOrder) handleCancelOrderEdit();
                    else setShowAddOrder(true);
                  }}
                  className={`flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-colors shadow-sm active:scale-95 ${
                    showAddOrder && !editingOrderId
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <PlusCircle
                    size={14}
                    className={`sm:w-4 sm:h-4 ${
                      showAddOrder && !editingOrderId
                        ? 'rotate-45 transition-transform'
                        : 'transition-transform'
                    }`}
                  />
                  {showAddOrder && !editingOrderId ? '取消新增' : '新增紀錄'}
                </button>
              </div>

              {showAddOrder && (
                <form
                  onSubmit={handleSaveOrder}
                  className="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200 flex flex-col gap-5 sm:gap-6 animate-in fade-in slide-in-from-top-4 shadow-inner"
                >
                  <div>
                    <h4 className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 sm:mb-4 flex items-center gap-2">
                      <Package size={14} />{' '}
                      {editingOrderId ? '編輯採購品項與金額' : '採購品項與金額'}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 items-end">
                      <FormInput
                        label="交易日期"
                        name="date"
                        type="date"
                        value={newOrder.date}
                        onChange={(e) =>
                          setNewOrder({ ...newOrder, date: e.target.value })
                        }
                        required
                        className="bg-white"
                      />
                      <FormInput
                        label="預計交期"
                        name="deliveryDate"
                        type="date"
                        value={newOrder.deliveryDate}
                        onChange={(e) =>
                          setNewOrder({
                            ...newOrder,
                            deliveryDate: e.target.value,
                          })
                        }
                        className="bg-white"
                      />
                      <FormInput
                        label="PO (採購) 號碼"
                        name="poNumber"
                        value={newOrder.poNumber}
                        onChange={(e) =>
                          setNewOrder({ ...newOrder, poNumber: e.target.value })
                        }
                        required
                        className="bg-white"
                      />
                      <FormInput
                        label="品項 / 規格"
                        name="itemSpecs"
                        value={newOrder.itemSpecs}
                        onChange={(e) =>
                          setNewOrder({
                            ...newOrder,
                            itemSpecs: e.target.value,
                          })
                        }
                        required
                        className="bg-white md:col-span-2"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 items-end mt-3 sm:mt-4">
                      <FormSelect
                        label="訂單狀況"
                        name="status"
                        value={newOrder.status}
                        onChange={(e) =>
                          setNewOrder({ ...newOrder, status: e.target.value })
                        }
                        options={[
                          '處理中',
                          '生產中',
                          '已出貨',
                          '已入庫',
                          '已結案',
                          '已取消',
                        ]}
                        className="bg-white md:col-span-1"
                      />
                      <div className="grid grid-cols-2 gap-2 col-span-1 sm:col-span-2 md:col-span-3">
                        <FormSelect
                          label="付款方式"
                          name="paymentType"
                          value={newOrder.paymentType}
                          onChange={(e) =>
                            setNewOrder({
                              ...newOrder,
                              paymentType: e.target.value,
                            })
                          }
                          options={['現金', '月結', '匯款', '預先付款']}
                          className="bg-white"
                        />
                        {newOrder.paymentType === '月結' ? (
                          <FormInput
                            label="月結天數"
                            name="paymentDays"
                            type="number"
                            placeholder="例如 30"
                            value={newOrder.paymentDays}
                            onChange={(e) =>
                              setNewOrder({
                                ...newOrder,
                                paymentDays: e.target.value,
                              })
                            }
                            className="bg-white"
                          />
                        ) : (
                          <div />
                        )}
                      </div>
                      <FormSelect
                        label="付款狀態"
                        name="paymentStatus"
                        value={newOrder.paymentStatus}
                        onChange={(e) =>
                          setNewOrder({
                            ...newOrder,
                            paymentStatus: e.target.value,
                          })
                        }
                        options={['未付款', '已付款', '部分付款']}
                        className="bg-white md:col-span-1"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 items-end mt-3 sm:mt-4">
                      <div className="space-y-1 sm:space-y-1.5 lg:col-span-2">
                        <label className="text-xs sm:text-[13px] font-semibold text-slate-700">
                          數量與單位 <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex shadow-sm rounded-xl">
                          <input
                            type="number"
                            value={newOrder.quantity}
                            onChange={(e) =>
                              setNewOrder({
                                ...newOrder,
                                quantity: e.target.value,
                              })
                            }
                            required
                            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-r-0 border-slate-200 rounded-l-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm"
                          />
                          <select
                            value={newOrder.unit}
                            onChange={(e) =>
                              setNewOrder({ ...newOrder, unit: e.target.value })
                            }
                            className="px-2 sm:px-4 py-2 sm:py-2.5 bg-slate-100 border border-slate-200 rounded-r-xl font-medium text-slate-600 outline-none text-xs sm:text-sm appearance-none border-l-0"
                          >
                            <option value="M">M</option>
                            <option value="M2">M2</option>
                            <option value="KG">KG</option>
                            <option value="ROLL">ROLL</option>
                            <option value="PCS">PCS</option>
                          </select>
                        </div>
                      </div>
                      <FormInput
                        label="採購總金額 (NT$)"
                        name="purchaseAmount"
                        type="number"
                        value={newOrder.purchaseAmount}
                        onChange={(e) =>
                          setNewOrder({
                            ...newOrder,
                            purchaseAmount: e.target.value,
                          })
                        }
                        required
                        className="bg-white lg:col-span-3"
                      />
                    </div>
                  </div>

                  <hr className="border-slate-200" />

                  <div>
                    <h4 className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 sm:mb-4 flex items-center gap-2">
                      <Globe size={14} /> 銷售 PI 串聯追蹤
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 items-end">
                      <FormInput
                        label="對應 PI 號碼 (輸入自動搜尋)"
                        name="piNumber"
                        value={newOrder.piNumber}
                        onChange={(e) =>
                          setNewOrder({ ...newOrder, piNumber: e.target.value })
                        }
                        className="bg-white md:col-span-2"
                        placeholder="例: PI-20261101"
                      />
                      <FormInput
                        label="PI 銷售金額 (NT$)"
                        name="piAmount"
                        type="number"
                        value={newOrder.piAmount}
                        onChange={(e) =>
                          setNewOrder({ ...newOrder, piAmount: e.target.value })
                        }
                        className="bg-white md:col-span-1"
                        placeholder="系統自動填入"
                      />

                      <div className="md:col-span-2 bg-blue-50/50 border border-blue-100 p-2 sm:p-3 rounded-xl flex justify-between items-center h-[42px]">
                        <span className="text-[10px] sm:text-xs font-bold text-blue-800 flex items-center gap-1 sm:gap-1.5">
                          <MoreVertical
                            size={12}
                            className="sm:w-3.5 sm:h-3.5"
                          />{' '}
                          價差分析
                        </span>
                        <div className="text-[10px] sm:text-xs text-slate-500 font-medium">
                          價差利潤{' '}
                          <span
                            className={`text-xs sm:text-sm font-bold ml-1 ${
                              priceDiff > 0
                                ? 'text-emerald-600'
                                : priceDiff < 0
                                ? 'text-rose-600'
                                : 'text-slate-800'
                            }`}
                          >
                            NT$ {priceDiff.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1 sm:pt-2 gap-2 sm:gap-3">
                    {editingOrderId && (
                      <button
                        type="button"
                        onClick={handleCancelOrderEdit}
                        className="w-full sm:w-auto bg-white border border-slate-300 text-slate-700 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl hover:bg-slate-50 text-xs sm:text-sm font-bold shadow-sm active:scale-95 transition-all whitespace-nowrap"
                      >
                        取消
                      </button>
                    )}
                    <button
                      type="submit"
                      className="w-full sm:w-auto bg-blue-600 text-white px-6 sm:px-8 py-2 sm:py-2.5 rounded-xl hover:bg-blue-700 text-xs sm:text-sm font-bold shadow-md hover:shadow-lg active:scale-95 transition-all whitespace-nowrap"
                    >
                      💾 {editingOrderId ? '儲存變更' : '儲存紀錄'}
                    </button>
                  </div>
                </form>
              )}

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left whitespace-nowrap min-w-[800px] sm:min-w-[1000px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 sm:px-5 py-3 sm:py-4">PO 號碼</th>
                        <th className="px-4 sm:px-5 py-3 sm:py-4">
                          日期 / 交期
                        </th>
                        <th className="px-4 sm:px-5 py-3 sm:py-4">
                          品項 / 數量
                        </th>
                        <th className="px-4 sm:px-5 py-3 sm:py-4 text-right">
                          採購金額
                        </th>
                        <th className="px-4 sm:px-5 py-3 sm:py-4">
                          對應 PI / 金額
                        </th>
                        <th className="px-4 sm:px-5 py-3 sm:py-4 text-right">
                          價差分析
                        </th>
                        <th className="px-4 sm:px-5 py-3 sm:py-4">狀態追蹤</th>
                        <th className="px-4 sm:px-5 py-3 sm:py-4 text-right">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs sm:text-[13px]">
                      {(item.orders || []).map((order) => {
                        const oPurchase = Number(order.purchaseAmount) || 0;
                        const oPi = Number(order.piAmount) || 0;
                        const oDiff = oPi - oPurchase;
                        return (
                          <tr
                            key={order.id}
                            className="hover:bg-slate-50/50 transition-colors bg-white group"
                          >
                            <td className="px-4 sm:px-5 py-2 sm:py-3 font-bold text-slate-800">
                              {order.poNumber}
                            </td>
                            <td className="px-4 sm:px-5 py-2 sm:py-3">
                              <div className="flex flex-col gap-0.5 sm:gap-1">
                                <span
                                  className="text-slate-500 font-medium"
                                  title="下單日"
                                >
                                  <Calendar
                                    size={10}
                                    className="inline mr-1 sm:mr-1.5 sm:w-3 sm:h-3"
                                  />
                                  {order.date}
                                </span>
                                <span
                                  className={`font-medium ${
                                    order.deliveryDate
                                      ? 'text-indigo-600'
                                      : 'text-slate-400'
                                  }`}
                                  title="交期"
                                >
                                  <Clock
                                    size={10}
                                    className="inline mr-1 sm:mr-1.5 sm:w-3 sm:h-3"
                                  />
                                  {order.deliveryDate || '未定'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 sm:px-5 py-2 sm:py-3">
                              <div
                                className="font-medium text-slate-700 max-w-[150px] sm:max-w-[200px] truncate"
                                title={order.itemSpecs}
                              >
                                {order.itemSpecs}
                              </div>
                              <div className="text-slate-500 text-[10px] sm:text-xs mt-0.5 font-mono">
                                {order.quantity} {order.unit}
                              </div>
                            </td>
                            <td className="px-4 sm:px-5 py-2 sm:py-3 text-right font-bold text-slate-800">
                              NT$ {oPurchase.toLocaleString()}
                            </td>
                            <td className="px-4 sm:px-5 py-2 sm:py-3">
                              {order.piNumber ? (
                                <div>
                                  <div className="font-medium text-slate-700">
                                    {order.piNumber}
                                  </div>
                                  <div className="text-slate-400 text-[10px] sm:text-xs mt-0.5">
                                    NT$ {oPi.toLocaleString()}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                            <td className="px-4 sm:px-5 py-2 sm:py-3 text-right">
                              {order.piNumber ? (
                                <span
                                  className={`font-bold px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs ${
                                    oDiff > 0
                                      ? 'bg-emerald-50 text-emerald-600'
                                      : oDiff < 0
                                      ? 'bg-rose-50 text-rose-600'
                                      : 'bg-slate-100 text-slate-500'
                                  }`}
                                >
                                  {oDiff > 0 ? '+' : ''}
                                  {oDiff.toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                            <td className="px-4 sm:px-5 py-2 sm:py-3">
                              <div className="flex flex-col gap-1 sm:gap-1.5 items-start">
                                <StatusBadge status={order.status} />
                                <span
                                  className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold border ${
                                    order.paymentStatus === '已付款'
                                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                      : 'bg-amber-50 text-amber-600 border-amber-200'
                                  }`}
                                >
                                  {order.paymentType || '現金'}
                                  {order.paymentType === '月結' &&
                                  order.paymentDays
                                    ? ` ${order.paymentDays}天`
                                    : ''}{' '}
                                  • {order.paymentStatus || '未付款'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 sm:px-5 py-2 sm:py-3 text-right">
                              <div className="flex justify-end gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleEditOrder(order)}
                                  className="p-1 sm:p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="編輯紀錄"
                                >
                                  <Edit
                                    size={12}
                                    className="sm:w-3.5 sm:h-3.5"
                                  />
                                </button>
                                <button
                                  onClick={() => handleDeleteOrder(order.id)}
                                  className="p-1 sm:p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="刪除紀錄"
                                >
                                  <Trash2
                                    size={12}
                                    className="sm:w-3.5 sm:h-3.5"
                                  />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {!(item.orders && item.orders.length > 0) && (
                        <tr>
                          <td
                            colSpan="8"
                            className="px-4 sm:px-6 py-12 sm:py-16 text-center text-slate-400"
                          >
                            尚無交易紀錄，點擊上方按鈕新增。
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductFormView({ item, customers, suppliers, onSave, onCancel }) {
  const [formData, setFormData] = useState(
    item || {
      productId: '',
      name: '',
      category: '',
      specs: '',
      purchasePrice: '',
      purchaseUnit: 'M',
      sellingPrice: '',
      sellingUnit: 'M',
      supplier: '',
      customers: [],
    }
  );

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-base sm:text-lg font-bold text-slate-800">
          {item ? '編輯產品資料' : '新增產品資料'}
        </h3>
      </div>
      <form
        onSubmit={handleSubmit}
        className="p-4 sm:p-8 space-y-6 sm:space-y-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 sm:gap-y-6 items-start">
          <FormInput
            label="產品編號"
            name="productId"
            value={formData.productId}
            onChange={handleChange}
            required
            placeholder="例：RHP001"
            className="md:col-span-1"
          />
          <FormInput
            label="品名"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="md:col-span-1"
          />
          <FormInput
            label="類別"
            name="category"
            value={formData.category}
            onChange={handleChange}
          />
          <FormInput
            label="規格"
            name="specs"
            value={formData.specs}
            onChange={handleChange}
            placeholder="例：外徑 50mm"
          />

          <div className="space-y-1 sm:space-y-1.5">
            <label className="text-xs sm:text-[13px] font-semibold text-slate-700">
              採購單價 (NT$)
            </label>
            <div className="flex shadow-sm rounded-xl">
              <input
                type="number"
                name="purchasePrice"
                value={formData.purchasePrice}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-r-0 border-slate-200 rounded-l-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-xs sm:text-sm"
              />
              <select
                name="purchaseUnit"
                value={formData.purchaseUnit || 'M'}
                onChange={handleChange}
                className="px-2 sm:px-4 py-2 sm:py-2.5 bg-slate-100 border border-slate-200 rounded-r-xl font-medium text-slate-600 outline-none text-xs sm:text-sm appearance-none border-l-0"
              >
                <option value="M">/ M</option>
                <option value="M2">/ M2</option>
                <option value="KG">/ KG</option>
                <option value="ROLL">/ ROLL</option>
                <option value="PCS">/ PCS</option>
              </select>
            </div>
          </div>

          <div className="space-y-1 sm:space-y-1.5">
            <label className="text-xs sm:text-[13px] font-semibold text-slate-700">
              出售單價 (NT$)
            </label>
            <div className="flex shadow-sm rounded-xl">
              <input
                type="number"
                name="sellingPrice"
                value={formData.sellingPrice}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-r-0 border-slate-200 rounded-l-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-xs sm:text-sm"
              />
              <select
                name="sellingUnit"
                value={formData.sellingUnit || 'M'}
                onChange={handleChange}
                className="px-2 sm:px-4 py-2 sm:py-2.5 bg-slate-100 border border-slate-200 rounded-r-xl font-medium text-slate-600 outline-none text-xs sm:text-sm appearance-none border-l-0"
              >
                <option value="M">/ M</option>
                <option value="M2">/ M2</option>
                <option value="KG">/ KG</option>
                <option value="ROLL">/ ROLL</option>
                <option value="PCS">/ PCS</option>
              </select>
            </div>
          </div>

          <FormSelect
            label="對應供應商"
            name="supplier"
            value={formData.supplier}
            onChange={handleChange}
            options={['', ...suppliers.map((s) => s.name)]}
            className="md:col-span-2"
          />

          <div className="space-y-1 sm:space-y-1.5 md:col-span-2">
            <label className="text-xs sm:text-[13px] font-semibold text-slate-700 block mb-1 sm:mb-2">
              對應客人 (可複選)
            </label>
            <div className="flex flex-wrap gap-2 sm:gap-3 p-3 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl">
              {customers.map((c, i) => {
                const isChecked = formData.customers?.includes(c.companyName);
                return (
                  <label
                    key={i}
                    className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border cursor-pointer transition-colors ${
                      isChecked
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 w-3.5 h-3.5 sm:w-4 sm:h-4"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData((prev) => ({
                            ...prev,
                            customers: [
                              ...(prev.customers || []),
                              c.companyName,
                            ],
                          }));
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            customers: (prev.customers || []).filter(
                              (name) => name !== c.companyName
                            ),
                          }));
                        }
                      }}
                    />
                    <span className="text-[11px] sm:text-sm font-medium">
                      {c.companyName}
                    </span>
                  </label>
                );
              })}
              {customers.length === 0 && (
                <span className="text-[11px] sm:text-sm text-slate-400">
                  目前尚無客戶資料，請先至客戶管理建立
                </span>
              )}
            </div>
          </div>
        </div>
        <FormActions
          onCancel={onCancel}
          submitText={item ? '儲存變更' : '建立產品'}
        />
      </form>
    </div>
  );
}

function ProductDetailView({ item, onBack, onEdit, onDelete }) {
  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <DetailHeader onBack={onBack} onEdit={onEdit} onDelete={onDelete} />
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-1 sm:mb-2">
              {item.name}
            </h1>
            <div className="flex gap-4 text-slate-500 text-xs sm:text-sm">
              <span className="flex items-center gap-1 font-mono">
                <FileText size={14} className="sm:w-4 sm:h-4" /> 編號:{' '}
                {item.productId}
              </span>
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-8">
          <div className="max-w-3xl space-y-6 sm:space-y-8">
            <div className="bg-white p-5 sm:p-8 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 sm:mb-6 flex items-center gap-2 border-b border-slate-100 pb-2 sm:pb-3">
                <Package size={14} /> 產品管理資訊
              </h3>
              <div className="space-y-4 sm:space-y-6">
                <InfoRow icon={Tag} label="類別" value={item.category} />
                <InfoRow icon={FileText} label="規格" value={item.specs} />
                <InfoRow
                  icon={Truck}
                  label="對應供應商"
                  value={item.supplier}
                />

                {/* 複選客戶標籤區塊 */}
                <div className="flex items-start gap-3 sm:gap-4 group">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                    <Users size={16} className="sm:w-4.5 sm:h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 sm:mb-1.5">
                      對應客人
                    </p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {item.customers && item.customers.length > 0 ? (
                        item.customers.map((cName, idx) => (
                          <span
                            key={idx}
                            className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-bold"
                          >
                            {cName}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-300 text-xs sm:text-sm">
                          尚未指定客人
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 sm:mt-4 border-t border-slate-100 pt-4 sm:pt-6">
                  <div className="flex items-center gap-3 sm:gap-4 group">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold transition-colors text-[10px] sm:text-base">
                      NT$
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                        採購單價
                      </p>
                      <p className="font-bold text-slate-800 text-base sm:text-lg">
                        {Number(item.purchasePrice).toLocaleString()}{' '}
                        <span className="text-xs sm:text-sm text-slate-500 font-medium">
                          / {item.purchaseUnit || 'M'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 group">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold transition-colors text-[10px] sm:text-base">
                      NT$
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                        出售單價
                      </p>
                      <p className="font-bold text-slate-800 text-base sm:text-lg">
                        {Number(item.sellingPrice).toLocaleString()}{' '}
                        <span className="text-xs sm:text-sm text-slate-500 font-medium">
                          / {item.sellingUnit || 'M'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 質感輔助元件 ---
function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 sm:px-5 py-2.5 sm:py-3.5 text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 sm:gap-2 border-b-2 mt-1 sm:mt-2 -mb-[1px] whitespace-nowrap ${
        active
          ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl'
          : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50 rounded-t-xl'
      }`}
    >
      <Icon
        size={14}
        className={`sm:w-4 sm:h-4 ${
          active ? 'text-indigo-600' : 'text-slate-400'
        }`}
      />{' '}
      {label}
    </button>
  );
}

function FormInput({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required,
  className = '',
  placeholder,
}) {
  return (
    <div className={`space-y-1 sm:space-y-1.5 ${className}`}>
      <label className="text-xs sm:text-[13px] font-semibold text-slate-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-xs sm:text-sm shadow-sm"
      />
    </div>
  );
}

function FormSelect({ label, name, value, onChange, options, className = '' }) {
  return (
    <div className={`space-y-1 sm:space-y-1.5 ${className}`}>
      <label className="text-xs sm:text-[13px] font-semibold text-slate-700">
        {label}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-xs sm:text-sm shadow-sm appearance-none"
      >
        {options.map((opt, i) => (
          <option key={i} value={opt}>
            {opt || '請選擇...'}
          </option>
        ))}
      </select>
    </div>
  );
}

function FormTextarea({ label, name, value, onChange, className = '' }) {
  return (
    <div className={`space-y-1 sm:space-y-1.5 ${className}`}>
      <label className="text-xs sm:text-[13px] font-semibold text-slate-700">
        {label}
      </label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows="4"
        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-xs sm:text-sm shadow-sm resize-y"
      ></textarea>
    </div>
  );
}

function FormActions({ onCancel, submitText }) {
  return (
    <div className="pt-4 sm:pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 mt-6 sm:mt-8">
      <button
        type="button"
        onClick={onCancel}
        className="w-full sm:w-auto px-6 py-2.5 border border-slate-300 bg-white rounded-xl text-slate-700 hover:bg-slate-50 font-semibold transition-colors text-xs sm:text-sm"
      >
        取消返回
      </button>
      <button
        type="submit"
        className="w-full sm:w-auto px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm hover:shadow active:scale-95 transition-all text-xs sm:text-sm"
      >
        {submitText}
      </button>
    </div>
  );
}

function DetailHeader({ onBack, onEdit, onDelete }) {
  return (
    <div className="flex justify-between items-center mb-2">
      <button
        onClick={onBack}
        className="flex items-center text-slate-500 hover:text-slate-800 text-xs sm:text-sm font-semibold group transition-colors"
      >
        <ChevronRight
          size={16}
          className="rotate-180 mr-0.5 sm:mr-1 transition-transform group-hover:-translate-x-1 sm:w-4 sm:h-4"
        />
        返回列表
      </button>
      <div className="flex gap-1.5 sm:gap-2">
        <button
          onClick={onEdit}
          className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:border-slate-300 hover:bg-slate-50 text-xs sm:text-sm font-semibold shadow-sm transition-all"
        >
          <Edit size={12} className="sm:w-3.5 sm:h-3.5" />
          <span className="hidden sm:inline">編輯資料</span>
          <span className="sm:hidden">編輯</span>
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-slate-200 text-rose-600 rounded-xl hover:border-rose-200 hover:bg-rose-50 text-xs sm:text-sm font-semibold shadow-sm transition-all"
        >
          <Trash2 size={12} className="sm:w-3.5 sm:h-3.5" />
          <span className="hidden sm:inline">刪除</span>
        </button>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, isLink }) {
  return (
    <div className="flex items-start gap-3 sm:gap-4 group">
      <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
        <Icon size={14} className="sm:w-4.5 sm:h-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
          {label}
        </p>
        <div className="font-medium text-slate-800 text-xs sm:text-[14px] break-words">
          {value ? (
            isLink ? (
              <a
                href={value.startsWith('http') ? value : `https://${value}`}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:underline"
              >
                {value}
              </a>
            ) : (
              value
            )
          ) : (
            <span className="text-slate-300">未提供</span>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status, size = 'sm' }) {
  if (!status) return null;
  const styles = {
    活躍: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    上架中: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    合作中: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
    處理中: 'bg-amber-50 text-amber-700 border-amber-200/60',
    生產中: 'bg-amber-50 text-amber-700 border-amber-200/60',
    潛在: 'bg-amber-50 text-amber-700 border-amber-200/60',
    庫存不足: 'bg-rose-50 text-rose-700 border-rose-200/60',
    已出貨: 'bg-blue-50 text-blue-700 border-blue-200/60',
    已入庫: 'bg-blue-50 text-blue-700 border-blue-200/60',
    已結案: 'bg-slate-100 text-slate-700 border-slate-300/60',
    非活躍: 'bg-slate-100 text-slate-500 border-slate-200/60',
    已停用: 'bg-slate-100 text-slate-500 border-slate-200/60',
    已下架: 'bg-slate-100 text-slate-500 border-slate-200/60',
    暫停合作: 'bg-rose-50 text-rose-700 border-rose-200/60',
    已取消: 'bg-slate-100 text-slate-400 border-slate-200/60',
  };
  const sizeClasses =
    size === 'lg'
      ? 'px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-xs sm:text-sm'
      : 'px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-[11px]';
  const matchStyle =
    styles[status] || 'bg-slate-100 text-slate-500 border-slate-200/60';
  return (
    <span
      className={`${sizeClasses} font-bold rounded-lg border ${matchStyle} inline-flex items-center justify-center whitespace-nowrap`}
    >
      {status}
    </span>
  );
}
